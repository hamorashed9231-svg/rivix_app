import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fetch current homepage customization settings for a restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول لإعدادات واجهة العميل" },
        { status: 403 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        bannerTitle: true,
        bannerSubtitle: true,
        bannerBadge: true,
        bannerActive: true,
        primaryColor: true,
        secondaryColor: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 })
    }

    // Fetch items with their categories
    const menuItems = await prisma.menuItem.findMany({
      where: {
        category: {
          restaurantId: restaurantId,
        },
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      restaurant,
      items: menuItems,
    })
  } catch (error) {
    console.error("Error fetching restaurant customization:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إعدادات الواجهة" },
      { status: 500 }
    )
  }
}

// PATCH: Update banner settings or toggle top-seller / featured / badge for items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "التحكم في واجهة العميل متاح للمالك ومدير الكول سنتر فقط" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { banner, itemUpdates } = body

    // 1. Update Restaurant Banner if provided
    if (banner) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          bannerTitle: banner.bannerTitle !== undefined ? banner.bannerTitle : undefined,
          bannerSubtitle: banner.bannerSubtitle !== undefined ? banner.bannerSubtitle : undefined,
          bannerBadge: banner.bannerBadge !== undefined ? banner.bannerBadge : undefined,
          bannerActive: banner.bannerActive !== undefined ? Boolean(banner.bannerActive) : undefined,
        },
      })
    }

    // 2. Update Menu Items (isTopSeller, isFeatured, badge, originalPrice) if provided
    if (Array.isArray(itemUpdates) && itemUpdates.length > 0) {
      for (const update of itemUpdates) {
        if (!update.id) continue

        // Verify item belongs to this restaurant
        const item = await prisma.menuItem.findUnique({
          where: { id: update.id },
          include: { category: true },
        })

        if (!item || item.category.restaurantId !== restaurantId) {
          continue
        }

        const dataToUpdate: any = {}
        if (update.isTopSeller !== undefined) dataToUpdate.isTopSeller = Boolean(update.isTopSeller)
        if (update.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(update.isFeatured)
        if (update.badge !== undefined) dataToUpdate.badge = update.badge ? String(update.badge).trim() : null
        if (update.originalPrice !== undefined) {
          dataToUpdate.originalPrice = update.originalPrice ? parseFloat(update.originalPrice) : null
        }

        await prisma.menuItem.update({
          where: { id: update.id },
          data: dataToUpdate,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث إعدادات واجهة العميل بنجاح 🎉",
    })
  } catch (error) {
    console.error("Error updating restaurant customization:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ إعدادات الواجهة" },
      { status: 500 }
    )
  }
}

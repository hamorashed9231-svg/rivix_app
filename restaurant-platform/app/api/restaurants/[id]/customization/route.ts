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
    const user = await getCurrentUser(request)

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
    const user = await getCurrentUser(request)

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
    const { banner, itemUpdates, notifyCustomers, notificationTitle, notificationBody } = body

    // 1. Update Restaurant Banner if provided
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: banner
        ? {
            bannerTitle: banner.bannerTitle !== undefined ? banner.bannerTitle : undefined,
            bannerSubtitle: banner.bannerSubtitle !== undefined ? banner.bannerSubtitle : undefined,
            bannerBadge: banner.bannerBadge !== undefined ? banner.bannerBadge : undefined,
            bannerActive: banner.bannerActive !== undefined ? Boolean(banner.bannerActive) : undefined,
          }
        : {},
      select: { id: true, name: true, bannerTitle: true, bannerSubtitle: true, bannerBadge: true },
    })

    // 2. Update Menu Items (price, isTopSeller, isFeatured, badge, originalPrice) if provided
    let newlyOfferedItems: string[] = []
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
        if (update.price !== undefined && update.price !== null && !isNaN(parseFloat(update.price))) {
          dataToUpdate.price = parseFloat(update.price)
        }
        if (update.isTopSeller !== undefined) dataToUpdate.isTopSeller = Boolean(update.isTopSeller)
        if (update.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(update.isFeatured)
        if (update.badge !== undefined) dataToUpdate.badge = update.badge ? String(update.badge).trim() : null
        if (update.originalPrice !== undefined) {
          dataToUpdate.originalPrice = update.originalPrice ? parseFloat(update.originalPrice) : null
        }

        const wasOffer = Boolean(item.isFeatured || (item.originalPrice && item.originalPrice > item.price))
        const isNowOffer = Boolean(
          dataToUpdate.isFeatured ||
            (dataToUpdate.originalPrice && dataToUpdate.originalPrice > (dataToUpdate.price ?? item.price))
        )

        if (isNowOffer && (!wasOffer || dataToUpdate.price !== item.price || dataToUpdate.originalPrice !== item.originalPrice)) {
          newlyOfferedItems.push(item.name)
        }

        await prisma.menuItem.update({
          where: { id: update.id },
          data: dataToUpdate,
        })
      }
    }

    // 3. Broadcast push notification to all app users if requested or when new offers are added
    if (notifyCustomers || newlyOfferedItems.length > 0) {
      const { broadcastPromoNotification } = await import("@/lib/promo-notifications")
      const title =
        notificationTitle && String(notificationTitle).trim()
          ? String(notificationTitle).trim()
          : banner?.bannerBadge
          ? `🔥 ${banner.bannerBadge} من ${updatedRestaurant.name}!`
          : `🎉 عروض وخصومات جديدة من ${updatedRestaurant.name}!`

      const msgBody =
        notificationBody && String(notificationBody).trim()
          ? String(notificationBody).trim()
          : newlyOfferedItems.length > 0
          ? `عروض وخصومات حصرية الآن على: ${newlyOfferedItems.slice(0, 3).join("، ")}! اطلب الآن من المنيو 🔥`
          : banner?.bannerTitle
          ? `${banner.bannerTitle}${banner.bannerSubtitle ? ` — ${banner.bannerSubtitle}` : ""}`
          : `تصفح أحدث العروض والأصناف الأكثر مبيعاً في منيو ${updatedRestaurant.name} الآن!`

      await broadcastPromoNotification({
        restaurantId,
        title,
        body: msgBody,
        type: "offer",
        createdById: user.id,
      })
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث إعدادات واجهة العميل وإشعار العملاء بنجاح 🎉",
    })
  } catch (error) {
    console.error("Error updating restaurant customization:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ إعدادات الواجهة" },
      { status: 500 }
    )
  }
}

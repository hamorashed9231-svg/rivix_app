import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { broadcastPromoNotification } from "@/lib/promo-notifications"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantIdParam = searchParams.get("restaurantId")
    const restaurantSlug = searchParams.get("restaurantSlug")

    let targetRestaurantId = restaurantIdParam

    if (!targetRestaurantId && restaurantSlug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        select: { id: true },
      })
      if (restaurant) {
        targetRestaurantId = restaurant.id
      }
    }

    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const notifications = await prisma.promoNotification.findMany({
      where: {
        createdAt: { gte: sinceDate },
        ...(targetRestaurantId
          ? {
              OR: [{ restaurantId: targetRestaurantId }, { restaurantId: null }],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Fetch Promo Notifications Error:", error)
    return NextResponse.json({ notifications: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Register Device Push Token from Mobile Client
    if (body.token && typeof body.token === "string") {
      const cleanToken = body.token.trim()
      if (!cleanToken) {
        return NextResponse.json({ error: "رمز الإشعارات فارغ" }, { status: 400 })
      }

      const user = await getCurrentUser(req)
      let targetRestaurantId = body.restaurantId || null

      if (!targetRestaurantId && body.restaurantSlug) {
        const rest = await prisma.restaurant.findUnique({
          where: { slug: String(body.restaurantSlug) },
          select: { id: true },
        })
        if (rest) targetRestaurantId = rest.id
      }

      const saved = await prisma.devicePushToken.upsert({
        where: { token: cleanToken },
        update: {
          userId: user?.id || body.userId || undefined,
          restaurantId: targetRestaurantId || undefined,
          platform: body.platform || undefined,
        },
        create: {
          token: cleanToken,
          userId: user?.id || body.userId || null,
          restaurantId: targetRestaurantId,
          platform: body.platform || null,
        },
      })

      return NextResponse.json({ success: true, id: saved.id })
    }

    // 2. Broadcast Promotional Notification from Call Center Manager / Owner / Admin
    if (body.action === "broadcast") {
      const user = await getCurrentUser(req)
      if (!user) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
      }

      const { restaurantId, title, message, type, couponCode } = body

      if (!title || !message) {
        return NextResponse.json(
          { error: "يرجى إدخال عنوان ونص الإشعار" },
          { status: 400 }
        )
      }

      if (restaurantId) {
        const access = await getRestaurantAccess(user.id, restaurantId)
        if (access !== "owner" && access !== "manager" && user.role !== "admin") {
          return NextResponse.json(
            { error: "إرسال الإشعارات متاح لمالك المطعم ومدير الكول سنتر فقط" },
            { status: 403 }
          )
        }
      } else if (user.role !== "admin") {
        return NextResponse.json(
          { error: "غير مصرح بإرسال إشعار عام" },
          { status: 403 }
        )
      }

      const notification = await broadcastPromoNotification({
        restaurantId: restaurantId || null,
        title: String(title),
        body: String(message),
        type: type || "offer",
        couponCode: couponCode || null,
        createdById: user.id,
      })

      return NextResponse.json({
        success: true,
        message: "تم إرسال الإشعار لجميع العملاء المحملين للتطبيق بنجاح 🔔",
        notification,
      })
    }

    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 })
  } catch (error) {
    console.error("Mobile Notifications POST Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الإشعار" },
      { status: 500 }
    )
  }
}

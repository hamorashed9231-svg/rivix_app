import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    if (user.role === "admin") {
      const coupons = await prisma.coupon.findMany({
        include: { restaurant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ coupons })
    }

    // Find restaurants owned by user or where user is active staff
    const [ownedRestaurants, staffMemberships] = await Promise.all([
      prisma.restaurant.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      }),
      prisma.restaurantStaff.findMany({
        where: { userId: user.id, isActive: true },
        select: { restaurantId: true },
      }),
    ])

    const accessibleRestaurantIds = Array.from(
      new Set([
        ...ownedRestaurants.map((r) => r.id),
        ...staffMemberships.map((s) => s.restaurantId),
      ])
    )

    const coupons = await prisma.coupon.findMany({
      where: {
        OR: [
          { restaurantId: { in: accessibleRestaurantIds } },
          { restaurantId: null, isActive: true },
        ],
      },
      include: { restaurant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الكوبونات" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بإنشاء كود خصم" }, { status: 401 })
    }

    const body = await req.json()
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      restaurantId,
      targetScope,
      targetMenuItemId,
      sendNotification = true,
      notificationTitle,
      notificationBody,
    } = body

    if (!code || !discountValue) {
      return NextResponse.json({ error: "كود الخصم وقيمة الخصم مطلوبان" }, { status: 400 })
    }

    let resolvedRestaurantId: string | null = restaurantId || null
    let resolvedRestaurantName = "مطعمنا"

    if (!resolvedRestaurantId && user.role !== "admin") {
      // Auto-resolve restaurant for Owner or Call Center Manager
      const owned = await prisma.restaurant.findFirst({
        where: { ownerId: user.id },
        select: { id: true, name: true },
      })
      if (owned) {
        resolvedRestaurantId = owned.id
        resolvedRestaurantName = owned.name
      } else {
        const staff = await prisma.restaurantStaff.findFirst({
          where: { userId: user.id, isActive: true, staffRole: "manager" },
          include: { restaurant: { select: { id: true, name: true } } },
        })
        if (staff?.restaurant) {
          resolvedRestaurantId = staff.restaurant.id
          resolvedRestaurantName = staff.restaurant.name
        }
      }

      if (!resolvedRestaurantId) {
        return NextResponse.json(
          { error: "إنشاء الكوبون متاح للمشرف أو مالك المطعم أو مدير الكول سنتر فقط" },
          { status: 403 }
        )
      }
    }

    // Restaurant-specific coupon creation requires owner or manager access
    if (resolvedRestaurantId) {
      const access = await getRestaurantAccess(user.id, resolvedRestaurantId)
      if (access !== "owner" && access !== "manager" && user.role !== "admin") {
        return NextResponse.json(
          { error: "غير مصرح لك بإنشاء كوبون لهذا المطعم" },
          { status: 403 }
        )
      }
      const rest = await prisma.restaurant.findUnique({
        where: { id: resolvedRestaurantId },
        select: { name: true },
      })
      if (rest?.name) resolvedRestaurantName = rest.name
    }

    const cleanCode = code.trim().toUpperCase()
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    })

    if (existing) {
      return NextResponse.json({ error: "كود الخصم موجود بالفعل" }, { status: 400 })
    }

    const parsedValue = parseFloat(discountValue)
    const parsedMinOrder = parseFloat(minOrderAmount || "0")

    const newCoupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType || "percentage",
        discountValue: parsedValue,
        minOrderAmount: parsedMinOrder,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        restaurantId: resolvedRestaurantId,
        targetScope: targetScope || "order",
        targetMenuItemId: targetMenuItemId || null,
        isActive: true,
      },
      include: { restaurant: { select: { name: true } } },
    })

    if (sendNotification !== false) {
      const { broadcastPromoNotification } = await import("@/lib/promo-notifications")
      const discountLabel =
        (discountType || "percentage") === "percentage"
          ? `${parsedValue}%`
          : `${parsedValue} ج.م`

      const title =
        notificationTitle && String(notificationTitle).trim()
          ? String(notificationTitle).trim()
          : `🎉 عرض وخصم جديد من ${resolvedRestaurantName}!`

      const msgBody =
        notificationBody && String(notificationBody).trim()
          ? String(notificationBody).trim()
          : `استخدم كود الخصم (${cleanCode}) واحصل على خصم ${discountLabel} على طلبك الآن! 🔥${
              parsedMinOrder > 0 ? ` (للأوردرات فوق ${parsedMinOrder} ج.م)` : ""
            }`

      await broadcastPromoNotification({
        restaurantId: resolvedRestaurantId,
        title,
        body: msgBody,
        type: "coupon",
        couponCode: cleanCode,
        createdById: user.id,
      })
    }

    return NextResponse.json(
      {
        message: "تم إنشاء كود الخصم وإرسال إشعار لجميع العملاء بنجاح 🎉",
        coupon: newCoupon,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Coupon Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الكوبون" }, { status: 500 })
  }
}

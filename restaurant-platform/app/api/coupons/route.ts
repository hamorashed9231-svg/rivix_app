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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بإنشاء كود خصم" }, { status: 401 })
    }

    const body = await req.json()
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, restaurantId } = body

    if (!code || !discountValue) {
      return NextResponse.json({ error: "كود الخصم وقيمة الخصم مطلوبان" }, { status: 400 })
    }

    // Global coupon creation requires admin role
    if (!restaurantId && user.role !== "admin") {
      return NextResponse.json(
        { error: "إنشاء كوبون عام لجميع المطاعم متاح فقط للمشرف (Admin)" },
        { status: 403 }
      )
    }

    // Restaurant-specific coupon creation requires owner access
    if (restaurantId) {
      const access = await getRestaurantAccess(user.id, restaurantId)
      if (access !== "owner" && user.role !== "admin") {
        return NextResponse.json(
          { error: "غير مصرح لك بإنشاء كوبون لهذا المطعم" },
          { status: 403 }
        )
      }
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (existing) {
      return NextResponse.json({ error: "كود الخصم موجود بالفعل" }, { status: 400 })
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || "percentage",
        discountValue: parseFloat(discountValue),
        minOrderAmount: parseFloat(minOrderAmount || "0"),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        restaurantId: restaurantId || null,
        isActive: true,
      },
    })

    return NextResponse.json({ message: "تم إنشاء كود الخصم بنجاح", coupon: newCoupon }, { status: 201 })
  } catch (error) {
    console.error("Create Coupon Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الكوبون" }, { status: 500 })
  }
}

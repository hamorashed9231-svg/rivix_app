import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
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
    if (!user || (user.role !== "admin" && user.role !== "restaurant_owner")) {
      return NextResponse.json({ error: "غير مصرح لك بإنشاء كود خصم" }, { status: 403 })
    }

    const body = await req.json()
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, restaurantId } = body

    if (!code || !discountValue) {
      return NextResponse.json({ error: "كود الخصم وقيمة الخصم مطلوبان" }, { status: 400 })
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

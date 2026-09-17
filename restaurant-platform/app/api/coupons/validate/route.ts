import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateCouponDiscount } from "@/lib/coupon-calculator"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, subtotal, restaurantId, cartItems } = body

    if (!code || subtotal === undefined) {
      return NextResponse.json({ error: "كود الخصم والمبلغ مطلوبان" }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "كود الخصم غير صالح أو ملغى" }, { status: 404 })
    }

    // Validate & Calculate discount using pure helper logic
    const validation = calculateCouponDiscount(coupon, subtotal, restaurantId, cartItems)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      message: "تم تطبيق كود الخصم بنجاح 🎉",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: validation.discountAmount,
        targetScope: coupon.targetScope,
        targetMenuItemId: coupon.targetMenuItemId,
      },
    })
  } catch (error) {
    console.error("Validate Coupon Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الكوبون" }, { status: 500 })
  }
}

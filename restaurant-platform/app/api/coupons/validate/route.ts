import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, subtotal, restaurantId } = body

    if (!code || subtotal === undefined) {
      return NextResponse.json({ error: "كود الخصم والمبلغ مطلوبان" }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "كود الخصم غير صالح أو ملغى" }, { status: 404 })
    }

    // Check expiration date
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "انتهت صلاحية كود الخصم هذا" }, { status: 400 })
    }

    // Check minimum order amount
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `الحد الأدنى لاستخدام هذا الكوبون هو ${coupon.minOrderAmount} ج.م` },
        { status: 400 }
      )
    }

    // Check restaurant restriction if any
    if (coupon.restaurantId && coupon.restaurantId !== restaurantId) {
      return NextResponse.json(
        { error: "هذا الكوبون غير مخصص لطلبات هذا المطعم" },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.discountType === "percentage") {
      discountAmount = subtotal * (coupon.discountValue / 100)
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      discountAmount = coupon.discountValue
    }

    return NextResponse.json({
      valid: true,
      message: "تم تطبيق كود الخصم بنجاح 🎉",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Validate Coupon Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الكوبون" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publishOrderEvent } from "@/lib/notifications-pubsub"
import { checkBranchOpenStatus } from "@/lib/opening-hours"
import { calculateDeliveryForCustomer } from "@/lib/delivery-calculator"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const { restaurantId, items, totalPrice, deliveryAddressDetails, customerLat, customerLng } = body

    if (!restaurantId || !items || items.length === 0 || !totalPrice) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      )
    }

    // 1. Find the restaurant's active branch
    const branch = await prisma.branch.findFirst({
      where: { restaurantId, isActive: true },
    })

    if (!branch) {
      return NextResponse.json(
        { error: "لا يوجد فرع نشط للمطعم حالياً" },
        { status: 400 }
      )
    }

    // Check if branch is open based on working hours
    const branchStatus = checkBranchOpenStatus(branch.openingHours, branch.isActive)
    if (!branchStatus.isOpen) {
      return NextResponse.json(
        { error: branchStatus.reason || "عذراً، الفرع مغلق حالياً ولا يستقبل طلبات جديدة." },
        { status: 400 }
      )
    }

    // 2. Determine Customer User
    if (!user) {
      return NextResponse.json(
        { error: "يرجى تسجيل الدخول أولاً لإرسال الطلب" },
        { status: 401 }
      )
    }
    const customerUser = user

    // 3. Find or Create Delivery Address
    let address = await prisma.address.findFirst({
      where: { userId: customerUser.id },
    })

    const targetLat = typeof customerLat === "number" ? customerLat : address?.lat || 24.7136
    const targetLng = typeof customerLng === "number" ? customerLng : address?.lng || 46.6753

    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: customerUser.id,
          label: "المنزل",
          lat: targetLat,
          lng: targetLng,
          details: deliveryAddressDetails || "الرياض - حي الملقا",
        },
      })
    }

    // 4. Check GPS Delivery Radius Coverage and Calculate Fee
    const deliveryCoverage = calculateDeliveryForCustomer(targetLat, targetLng, [branch])
    if (!deliveryCoverage.isWithinRadius) {
      return NextResponse.json(
        { error: deliveryCoverage.reason || "عذراً، موقعك الحالي يقع خارج نطاق التوصيل المتاح لفرعنا" },
        { status: 400 }
      )
    }

    // 5. Create Order and OrderItems in DB
    const finalTotalPrice = parseFloat(totalPrice) + deliveryCoverage.deliveryFee

    const newOrder = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        branchId: branch.id,
        status: "pending",
        totalPrice: finalTotalPrice,
        deliveryFee: deliveryCoverage.deliveryFee,
        distanceKm: deliveryCoverage.distanceKm,
        deliveryAddressId: address.id,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId || item.id,
            quantity: item.quantity,
            price: parseFloat(item.price),
            notes: item.notes || null,
            selectedOptions: item.selectedOptions ? item.selectedOptions : null,
          })),
        },
      },
      include: {
        items: { include: { menuItem: true } },
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true } },
        deliveryAddress: true,
      },
    })

    // Publish Firestore Pub/Sub event for real-time dashboard notification
    publishOrderEvent(restaurantId, "new_order", newOrder.id).catch((err) =>
      console.error("PubSub Trigger Error:", err)
    )

    return NextResponse.json(
      {
        message: "تم إنشاء الطلب بنجاح",
        order: newOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Customer Order Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الطلب في النظام" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const sessionUser = await getCurrentUser()

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "يرجى تسجيل الدخول أولاً لعرض الطلبات" },
        { status: 401 }
      )
    }

    const userId = sessionUser.id

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: { include: { menuItem: true } },
        branch: { include: { restaurant: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Fetch Customer Orders Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلبات" }, { status: 500 })
  }
}

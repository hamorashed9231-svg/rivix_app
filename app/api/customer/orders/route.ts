import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const { restaurantId, items, totalPrice, deliveryAddressDetails } = body

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

    // 2. Determine Customer User
    let customerUser = user
    if (!customerUser) {
      // Find default customer from DB
      const defaultCustomer = await prisma.user.findFirst({
        where: { role: "customer" },
      })
      if (defaultCustomer) {
        customerUser = defaultCustomer
      } else {
        return NextResponse.json(
          { error: "يرجى تسجيل الدخول أولاً لإرسال الطلب" },
          { status: 401 }
        )
      }
    }

    // 3. Find or Create Delivery Address
    let address = await prisma.address.findFirst({
      where: { userId: customerUser.id },
    })

    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: customerUser.id,
          label: "المنزل",
          lat: 24.7136,
          lng: 46.6753,
          details: deliveryAddressDetails || "الرياض - حي الملقا",
        },
      })
    }

    // 4. Create Order and OrderItems in DB
    const newOrder = await prisma.order.create({
      data: {
        customerId: customerUser.id,
        branchId: branch.id,
        status: "pending",
        totalPrice: parseFloat(totalPrice),
        deliveryAddressId: address.id,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price),
            notes: item.notes || null,
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
    let userId = sessionUser?.id

    if (!userId) {
      const defaultCustomer = await prisma.user.findFirst({
        where: { role: "customer" },
      })
      userId = defaultCustomer?.id
    }

    if (!userId) {
      return NextResponse.json({ orders: [] })
    }

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

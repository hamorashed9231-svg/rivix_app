import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { publishOrderEvent } from "@/lib/notifications-pubsub"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بتغيير حالة الطلب" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { branch: { select: { restaurantId: true } } },
    })

    if (!existingOrder || !existingOrder.branch) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, existingOrder.branch.restaurantId)
    if (!access) {
      return NextResponse.json({ error: "غير مصرح لك بتغيير حالة الطلب" }, { status: 403 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
        branch: { select: { restaurantId: true } },
      },
    })

    if (updatedOrder.branch?.restaurantId) {
      publishOrderEvent(updatedOrder.branch.restaurantId, "order_status_changed", updatedOrder.id).catch((err) =>
        console.error("PubSub Trigger Error:", err)
      )
    }

    return NextResponse.json({ message: "تم تحديث حالة الطلب بنجاح", order: updatedOrder })
  } catch (error) {
    console.error("Order Status Update Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث حالة الطلب" }, { status: 500 })
  }
}

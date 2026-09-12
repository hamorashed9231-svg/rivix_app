import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح لك بتغيير حالة الطلب" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      },
    })

    return NextResponse.json({ message: "تم تحديث حالة الطلب بنجاح", order: updatedOrder })
  } catch (error) {
    console.error("Order Status Update Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث حالة الطلب" }, { status: 500 })
  }
}

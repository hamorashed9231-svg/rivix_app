import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET Single Order Details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        branch: { include: { restaurant: true } },
        deliveryAddress: true,
        items: { include: { menuItem: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب تفاصيل الطلب" }, { status: 500 })
  }
}

// PUT Edit Order Items & Total Price
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح لك بتعديل الطلبات" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { items, totalPrice } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "الطلب يجب أن يحتوي على عنصر واحد على الأقل" }, { status: 400 })
    }

    // Update items inside transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({ where: { orderId: id } })

      // Create new order items
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: id,
          menuItemId: item.menuItemId || item.id,
          quantity: item.quantity,
          price: parseFloat(item.price),
          notes: item.notes || null,
        })),
      })

      // Update order total price
      await tx.order.update({
        where: { id },
        data: {
          totalPrice: parseFloat(totalPrice),
        },
      })
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true } },
        deliveryAddress: true,
        items: { include: { menuItem: true } },
      },
    })

    return NextResponse.json({ message: "تم تعديل الطلب بنجاح", order: updatedOrder })
  } catch (error) {
    console.error("Order Edit Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل الطلب" }, { status: 500 })
  }
}

// DELETE Permanent Order Deletion
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح لك بحذف الطلبات" }, { status: 403 })
    }

    const { id } = await params

    // Delete order items first then order
    await prisma.orderItem.deleteMany({ where: { orderId: id } })
    await prisma.order.delete({ where: { id } })

    return NextResponse.json({ message: "تم حذف الطلب بنجاح" })
  } catch (error) {
    console.error("Order Delete Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الطلب" }, { status: 500 })
  }
}

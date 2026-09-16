import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح لك بتحويل الطلبات" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { targetSystem } = body || { targetSystem: "POS_MAIN" }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { menuItem: true } },
        branch: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
    }

    // Simulate POS / External System API Integration Dispatch
    const externalSystemRef = `POS-EXT-${Date.now()}`

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "accepted",
        posReferenceId: externalSystemRef,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      }
    })

    return NextResponse.json({
      message: `تم تحويل الطلب بنجاح إلى النظام الخارجي (${targetSystem})`,
      externalRef: externalSystemRef,
      order: updatedOrder,
    })
  } catch (error) {
    console.error("Order Forwarding Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تحويل الطلب للنظام الخارجي" }, { status: 500 })
  }
}

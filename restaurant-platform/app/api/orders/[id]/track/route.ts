import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { include: { restaurant: { select: { name: true, logo: true } } } },
        deliveryAddress: true,
        items: { include: { menuItem: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
    }

    // Determine Step Index
    let stepIndex = 1
    let statusLabel = "قيد الانتظار لموافقة الموظف 🟡"

    switch (order.status) {
      case "pending":
        stepIndex = 1
        statusLabel = "تم إرسال الطلب وبانتظار الموافقة 🟡"
        break
      case "accepted":
      case "preparing":
        stepIndex = 2
        statusLabel = "تم قبول الطلب وجاري التجهيز 🔵"
        break
      case "ready":
        stepIndex = 3
        statusLabel = "الطلب جاهز وبانتظار المندوب 📦"
        break
      case "out_for_delivery":
        stepIndex = 4
        statusLabel = "المندوب في الطريق إليك 🚚"
        break
      case "delivered":
        stepIndex = 5
        statusLabel = "تم التسليم بنجاح 🏁"
        break
      case "cancelled":
        stepIndex = 0
        statusLabel = "تم إلغاء الطلب ❌"
        break
    }

    // Mock Driver Details for API tracking
    const driverInfo = {
      driverId: order.driverAssignmentId || "DRV-8842",
      driverName: "سعد القحطاني (مندوب توصيل RIVIX)",
      driverPhone: "0533333333",
      vehicle: "تويوتا كورولا - لوحة: أ د ج 4589",
      lat: 24.7150,
      lng: 46.6780,
      estimatedMinutes: order.status === "out_for_delivery" ? 12 : 25,
    }

    return NextResponse.json({
      order,
      stepIndex,
      statusLabel,
      driverInfo,
    })
  } catch (error) {
    console.error("Track Order Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب تتبع الطلب" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDriverToken } from "@/lib/driver-auth"
import { checkAndAutoCloseShift, applyOrderStatusTransition } from "@/lib/driver-helpers"

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const authPayload = await verifyDriverToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const { orderId } = await params
    const userId = authPayload.userId as string
    const role = (authPayload.role as string) || ""

    // Run lazy 10-hour shift auto-close check
    const driverProfile = await prisma.driverProfile.findFirst({
      where: { OR: [{ userId }, { code: (authPayload.code as string) || "" }] },
    })
    if (driverProfile) {
      await checkAndAutoCloseShift(driverProfile.id)
    }

    // Check order existence and ownership
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, riderId: true, riderProfileId: true, riderDeliveryStatus: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 })
    }

    const isAuthorizedRider =
      existingOrder.riderId === userId ||
      (driverProfile && existingOrder.riderProfileId === driverProfile.id) ||
      ["admin", "control", "supermarket_control", "restaurant_owner"].includes(role)

    if (!isAuthorizedRider) {
      return NextResponse.json({ success: false, error: "غير مصرح لك بتحديث هذا الطلب" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { status, podData } = body

    if (!status) {
      return NextResponse.json({ success: false, error: "يرجى تحديد حالة الطلب الجديدة" }, { status: 400 })
    }

    const result = await applyOrderStatusTransition(orderId, status, userId, podData)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        orderId: result.order.id,
        status: result.order.riderDeliveryStatus,
        updatedAt: result.order.updatedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("PATCH Driver Order Status Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تحديث حالة الطلب" }, { status: 500 })
  }
}

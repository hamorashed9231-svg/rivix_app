import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyControlToken } from "@/lib/driver-auth"
import { sendOrderCancellationPushNotification } from "@/lib/firebase-admin"
import { publishOrderEvent } from "@/lib/notifications-pubsub"

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const authPayload = await verifyControlToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const { orderId } = await params
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: true,
        riderUser: {
          include: { driverProfile: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 })
    }

    const now = new Date()
    const cancelReason = reason || "تم الإلغاء بواسطة مسؤول الكنترول"

    // Sync both status fields (riderDeliveryStatus & order.status) to "cancelled"
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "cancelled",
        riderDeliveryStatus: "cancelled",
        cancellationReason: cancelReason,
        updatedAt: now,
      },
    })

    // If a rider was assigned, send FCM push notification for cancellation
    const fcmToken = order.riderUser?.driverProfile?.fcmToken
    if (fcmToken) {
      sendOrderCancellationPushNotification(fcmToken, order.id, cancelReason).catch((err) =>
        console.error("FCM Cancel Push Error:", err)
      )
    }

    // Publish Firestore event for real-time customer tracking
    if (order.branch?.restaurantId) {
      publishOrderEvent(order.branch.restaurantId, "order_status_changed", order.id).catch((err) =>
        console.error("PubSub error:", err)
      )
    }

    return NextResponse.json(
      {
        success: true,
        orderId: updatedOrder.id,
        status: "cancelled",
        cancelledAt: now.toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("PATCH Control Order Cancel Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء إلغاء الطلب" }, { status: 500 })
  }
}

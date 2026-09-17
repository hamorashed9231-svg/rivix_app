import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyControlToken } from "@/lib/driver-auth"
import { sendNewOrderPushNotification } from "@/lib/firebase-admin"
import { publishOrderEvent } from "@/lib/notifications-pubsub"

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const authPayload = await verifyControlToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const { orderId } = await params
    const body = await req.json().catch(() => ({}))
    const { riderId, notes } = body

    // 1. Fetch Order with Branch relation
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 })
    }

    // 2. Verify restaurant marked order ready
    if (order.status !== "ready") {
      return NextResponse.json(
        { success: false, error: "عذراً، الطلب لم يقم المطعم بتجهيزه بعد (يجب أن تكون حالة الطلب 'ready')" },
        { status: 400 }
      )
    }

    const now = new Date()

    // 3. Handle Assignment (riderId provided) vs Unassignment (riderId == null)
    if (riderId && typeof riderId === "string" && riderId.trim() !== "") {
      const targetRiderId = riderId.trim()

      // Find driver profile by userId or code or profile id
      const driverProfile = await prisma.driverProfile.findFirst({
        where: {
          OR: [{ userId: targetRiderId }, { id: targetRiderId }, { code: targetRiderId }],
        },
        include: { user: true },
      })

      if (!driverProfile || !driverProfile.user) {
        return NextResponse.json({ success: false, error: "السائق المحدد غير موجود في النظام" }, { status: 404 })
      }

      // Check rider is not offline
      if (driverProfile.status === "offline") {
        return NextResponse.json(
          { success: false, error: "عذراً، السائق غير متاح حالياً (في حالة offline)" },
          { status: 400 }
        )
      }

      // Check rider branch/restaurant affiliation if set
      if (
        driverProfile.branchId &&
        driverProfile.branchId !== order.branchId &&
        driverProfile.restaurantId !== order.branch.restaurantId
      ) {
        return NextResponse.json(
          { success: false, error: "السائق لا ينتمي لفرع أو مطعم هذا الطلب" },
          { status: 400 }
        )
      }

      // Update Order assignment
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          riderId: driverProfile.userId,
          riderProfileId: driverProfile.id,
          riderDeliveryStatus: "assigned",
          assignedAt: now,
        },
      })

      // Send FCM push notification to driver (gracefully handles missing token)
      sendNewOrderPushNotification(
        driverProfile.fcmToken,
        order.id,
        order.posReferenceId || order.id.slice(-6).toUpperCase()
      ).catch((err) => console.error("FCM Push Error:", err))

      // Publish Firestore notification event
      if (order.branch?.restaurantId) {
        publishOrderEvent(order.branch.restaurantId, "order_status_changed", order.id).catch((err) =>
          console.error("PubSub error:", err)
        )
      }

      return NextResponse.json(
        {
          success: true,
          orderId: updatedOrder.id,
          riderId: driverProfile.userId,
          status: "assigned",
          assignedAt: now.toISOString(),
          message: "تم إسناد الطلب للسائق وإرسال الإشعار بنجاح",
        },
        { status: 200 }
      )
    } else {
      // Unassign rider (riderId is null or empty)
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          riderId: null,
          riderProfileId: null,
          riderDeliveryStatus: "pending",
          assignedAt: null,
        },
      })

      if (order.branch?.restaurantId) {
        publishOrderEvent(order.branch.restaurantId, "order_status_changed", order.id).catch((err) =>
          console.error("PubSub error:", err)
        )
      }

      return NextResponse.json(
        {
          success: true,
          orderId: updatedOrder.id,
          riderId: null,
          status: "pending",
          assignedAt: null,
          message: "تم إلغاء إسناد الطلب وإعادته لقائمة الانتظار",
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("POST Control Order Assign Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء إسناد الطلب" }, { status: 500 })
  }
}

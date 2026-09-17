import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDriverToken } from "@/lib/driver-auth"
import { checkAndAutoCloseShift, applyOrderStatusTransition } from "@/lib/driver-helpers"

export async function POST(req: Request) {
  try {
    const authPayload = await verifyDriverToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const userId = authPayload.userId as string
    const body = await req.json().catch(() => ({}))
    const { queue } = body

    if (!Array.isArray(queue)) {
      return NextResponse.json({ success: false, error: "قائمة التزامن (queue) غير صحيحة" }, { status: 400 })
    }

    // Run lazy shift auto-close check
    const driverProfile = await prisma.driverProfile.findFirst({
      where: { OR: [{ userId }, { code: (authPayload.code as string) || "" }] },
    })
    if (driverProfile) {
      await checkAndAutoCloseShift(driverProfile.id)
    }

    // Sort queue by timestamp ascending (oldest timestamp first)
    const sortedQueue = [...queue].sort((a, b) => {
      const tA = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp || 0).getTime()
      const tB = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp || 0).getTime()
      return tA - tB
    })

    let syncedCount = 0
    const skipped: Array<{ orderId: string; reason: string }> = []

    for (const item of sortedQueue) {
      const { orderId, status, podData, timestamp } = item

      if (!orderId || !status) {
        skipped.push({ orderId: orderId || "unknown", reason: "بيانات الإدخال ناقصة" })
        continue
      }

      const itemDate = timestamp
        ? typeof timestamp === "number"
          ? new Date(timestamp)
          : new Date(timestamp)
        : undefined

      const result = await applyOrderStatusTransition(orderId, status, userId, podData, itemDate)

      if (result.success) {
        syncedCount++
      } else {
        skipped.push({ orderId, reason: result.error || "فشل التطبيق" })
      }
    }

    return NextResponse.json(
      {
        success: true,
        syncedCount,
        skipped,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("POST Driver Batch Sync Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء مزامنة الطلبات" }, { status: 500 })
  }
}

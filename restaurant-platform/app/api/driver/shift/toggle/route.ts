import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDriverToken } from "@/lib/driver-auth"
import { calculateDistanceMeters, checkAndAutoCloseShift } from "@/lib/driver-helpers"

export async function POST(req: Request) {
  try {
    const authPayload = await verifyDriverToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const userId = authPayload.userId as string
    const body = await req.json().catch(() => ({}))
    const { action, riderId, branchId, coords } = body

    if (!action || !["start", "end"].includes(action)) {
      return NextResponse.json({ success: false, error: "يرجى تحديد الإجراء (start أو end)" }, { status: 400 })
    }

    const driverProfile = await prisma.driverProfile.findFirst({
      where: { OR: [{ userId }, { code: (authPayload.code as string) || "" }] },
    })

    if (!driverProfile) {
      return NextResponse.json({ success: false, error: "بروفايل السائق غير موجود" }, { status: 404 })
    }

    // Run lazy shift auto-close check
    await checkAndAutoCloseShift(driverProfile.id)

    const targetBranchId = branchId || driverProfile.branchId
    const now = new Date()

    if (action === "start") {
      if (!targetBranchId) {
        return NextResponse.json({ success: false, error: "يرجى تحديد الفرع لبدء الوردية" }, { status: 400 })
      }

      const branch = await prisma.branch.findUnique({
        where: { id: targetBranchId },
      })

      if (!branch) {
        return NextResponse.json({ success: false, error: "الفرع المالي غير موجود" }, { status: 400 })
      }

      // Geofence check: 200m radius threshold
      if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
        const distance = calculateDistanceMeters(coords.lat, coords.lng, branch.lat, branch.lng)
        if (distance > 200) {
          return NextResponse.json(
            {
              success: false,
              error: `عذراً، يجب أن تكون على بعد أقل من 200 متر من الفرع لبدء وردية العمل (المسافة الحالية: ${Math.round(distance)} متر)`,
            },
            { status: 400 }
          )
        }
      }

      const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD

      // Create new Shift record
      await prisma.shift.create({
        data: {
          riderId: driverProfile.id,
          startTime: now,
          date: dateStr,
          tenantId: "default",
          restaurantId: branch.restaurantId,
          branchId: branch.id,
        },
      })

      // Update DriverProfile
      await prisma.driverProfile.update({
        where: { id: driverProfile.id },
        data: {
          status: "online",
          currentShiftStart: now,
          branchId: branch.id,
          restaurantId: branch.restaurantId,
        },
      })

      return NextResponse.json(
        {
          success: true,
          status: "online",
          shiftStart: now.toISOString(),
        },
        { status: 200 }
      )
    } else {
      // action === "end"
      const openShift = await prisma.shift.findFirst({
        where: {
          riderId: driverProfile.id,
          endTime: null,
        },
      })

      if (openShift) {
        const durationMinutes = Math.round((now.getTime() - new Date(openShift.startTime).getTime()) / 60000)
        await prisma.shift.update({
          where: { id: openShift.id },
          data: {
            endTime: now,
            durationMinutes,
          },
        })
      }

      await prisma.driverProfile.update({
        where: { id: driverProfile.id },
        data: {
          status: "offline",
          currentShiftStart: null,
        },
      })

      return NextResponse.json(
        {
          success: true,
          status: "offline",
          shiftStart: null,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("POST Driver Shift Toggle Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تغيير حالة الوردية" }, { status: 500 })
  }
}

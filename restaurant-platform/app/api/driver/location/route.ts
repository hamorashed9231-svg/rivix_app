import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDriverToken } from "@/lib/driver-auth"
import { checkAndAutoCloseShift } from "@/lib/driver-helpers"

export async function POST(req: Request) {
  try {
    const authPayload = await verifyDriverToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const userId = authPayload.userId as string
    const role = (authPayload.role as string) || ""

    const body = await req.json().catch(() => ({}))
    const { lat, lng, riderId, branchId } = body

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ success: false, error: "بيانات الموقع (lat, lng) غير صحيحة" }, { status: 400 })
    }

    // Find driver profile
    const driverProfile = await prisma.driverProfile.findFirst({
      where: { OR: [{ userId }, { code: (authPayload.code as string) || "" }] },
    })

    if (!driverProfile) {
      return NextResponse.json({ success: false, error: "بروفايل السائق غير موجود" }, { status: 404 })
    }

    // Run lazy shift auto-close check
    await checkAndAutoCloseShift(driverProfile.id)

    // Verify riderId match
    const isOwnerRider =
      riderId === userId ||
      riderId === driverProfile.id ||
      riderId === driverProfile.code ||
      ["admin", "control"].includes(role)

    if (riderId && !isOwnerRider) {
      return NextResponse.json({ success: false, error: "غير مصرح لك بتحديث موقع سائق آخر" }, { status: 403 })
    }

    const now = new Date()
    const targetBranchId = branchId || driverProfile.branchId || "default_branch"
    const targetRestaurantId = driverProfile.restaurantId || "default_restaurant"

    // Upsert single RiderLocation row (unique per rider)
    await prisma.riderLocation.upsert({
      where: { riderId: driverProfile.id },
      update: {
        lat,
        lng,
        updatedAt: now,
        branchId: targetBranchId,
        restaurantId: targetRestaurantId,
      },
      create: {
        riderId: driverProfile.id,
        lat,
        lng,
        updatedAt: now,
        tenantId: "default",
        restaurantId: targetRestaurantId,
        branchId: targetBranchId,
      },
    })

    // Update quick-read fields on DriverProfile
    await prisma.driverProfile.update({
      where: { id: driverProfile.id },
      data: {
        lastLocationLat: lat,
        lastLocationLng: lng,
        lastSeen: now,
      },
    })

    return NextResponse.json(
      {
        success: true,
        timestamp: Math.floor(now.getTime() / 1000),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("POST Driver Location Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء إرسال موقع السائق" }, { status: 500 })
  }
}

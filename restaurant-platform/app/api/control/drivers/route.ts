import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyControlToken } from "@/lib/driver-auth"

export async function GET(req: Request) {
  try {
    const authPayload = await verifyControlToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId")
    const statusFilter = searchParams.get("status")

    if (!branchId) {
      return NextResponse.json({ success: false, error: "معرف الفرع (branchId) مطلوب" }, { status: 400 })
    }

    const whereCondition: any = {
      branchId,
    }

    if (statusFilter) {
      whereCondition.status = statusFilter
    }

    const driverProfiles = await prisma.driverProfile.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        riderLocation: true,
      },
    })

    const driversFormatted = await Promise.all(
      driverProfiles.map(async (dp) => {
        // Count active assigned orders for this rider
        const activeOrdersCount = await prisma.order.count({
          where: {
            OR: [{ riderId: dp.userId }, { riderProfileId: dp.id }],
            riderDeliveryStatus: {
              notIn: ["delivered", "cancelled"],
            },
          },
        })

        const lat = dp.riderLocation?.lat ?? dp.lastLocationLat ?? null
        const lng = dp.riderLocation?.lng ?? dp.lastLocationLng ?? null
        const updatedAt = dp.riderLocation?.updatedAt ?? dp.lastSeen ?? null

        return {
          id: dp.userId,
          name: dp.user?.name || "سائق",
          code: dp.code || "",
          phone: dp.user?.phone || "",
          status: dp.status || "offline",
          activeOrdersCount,
          rating: dp.rating ?? 5.0,
          currentShiftStart: dp.currentShiftStart ? dp.currentShiftStart.toISOString() : null,
          location:
            lat !== null && lng !== null
              ? {
                  lat,
                  lng,
                  updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
                }
              : null,
        }
      })
    )

    return NextResponse.json(
      {
        success: true,
        drivers: driversFormatted,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET Control Drivers Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء استرجاع قائمة السائقين" }, { status: 500 })
  }
}

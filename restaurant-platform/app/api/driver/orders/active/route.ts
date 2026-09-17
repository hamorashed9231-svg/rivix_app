import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyDriverToken } from "@/lib/driver-auth"
import { checkAndAutoCloseShift } from "@/lib/driver-helpers"

export async function GET(req: Request) {
  try {
    const authPayload = await verifyDriverToken(req)
    if (!authPayload) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    const userId = authPayload.userId as string

    // Run lazy 10-hour shift auto-close check
    const driverProfile = await prisma.driverProfile.findFirst({
      where: { OR: [{ userId }, { code: (authPayload.code as string) || "" }] },
    })
    if (driverProfile) {
      await checkAndAutoCloseShift(driverProfile.id)
    }

    // Query active orders assigned to this rider
    const activeOrders = await prisma.order.findMany({
      where: {
        OR: [{ riderId: userId }, { riderProfileId: driverProfile?.id || "" }],
        riderDeliveryStatus: {
          notIn: ["delivered", "cancelled"],
        },
      },
      include: {
        customer: true,
        branch: {
          include: {
            restaurant: true,
          },
        },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedOrders = activeOrders.map((ord) => {
      // 1. Restaurant coordinates check (Branch.lat / Branch.lng) using nullish coalescing
      const restLat = ord.branch?.lat ?? null
      const restLng = ord.branch?.lng ?? null
      let restaurantCoords: { lat: number; lng: number } | null = null

      if (typeof restLat === "number" && typeof restLng === "number") {
        restaurantCoords = { lat: restLat, lng: restLng }
      } else {
        console.warn(
          `[GET /api/driver/orders/active] WARNING: Order ID '${ord.id}' Branch ID '${ord.branchId}' has missing/invalid coordinates (lat: ${restLat}, lng: ${restLng}). Returning null for restaurantCoords.`
        )
      }

      // 2. Customer delivery address coordinates check (Address.lat / Address.lng)
      const custLat = ord.deliveryAddress?.lat ?? null
      const custLng = ord.deliveryAddress?.lng ?? null
      let customerCoords: { lat: number; lng: number } | null = null

      if (typeof custLat === "number" && typeof custLng === "number") {
        customerCoords = { lat: custLat, lng: custLng }
      } else {
        console.warn(
          `[GET /api/driver/orders/active] WARNING: Order ID '${ord.id}' Address ID '${ord.deliveryAddressId}' has missing/invalid coordinates (lat: ${custLat}, lng: ${custLng}). Returning null for coords.`
        )
      }

      return {
        id: ord.id,
        orderNumber: ord.posReferenceId || ord.id.slice(-6).toUpperCase(),
        riderId: ord.riderId || userId,
        status: ord.riderDeliveryStatus || ord.status || "pending",
        totalPrice: ord.totalPrice,
        deliveryFee: ord.deliveryFee,
        riderEarnings: ord.riderEarnings ?? null,
        restaurantName: ord.branch?.restaurant?.name || ord.branch?.name || "المطعم",
        restaurantAddress: ord.branch?.address || "",
        restaurantCoords,
        customerName: ord.customer?.name || "عميل",
        customerPhone: ord.customer?.phone || "",
        address: ord.deliveryAddress?.details || ord.deliveryAddress?.label || "",
        coords: customerCoords,
        deliveryOtp: ord.deliveryOtp || "",
        podType: ord.podType || "otp",
      }
    })

    return NextResponse.json({ orders: formattedOrders }, { status: 200 })
  } catch (error) {
    console.error("GET Active Driver Orders Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ في استرجاع الطلبات النشطة" }, { status: 500 })
  }
}

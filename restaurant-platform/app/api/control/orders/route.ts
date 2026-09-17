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

    let whereCondition: any = {
      branchId,
    }

    if (statusFilter) {
      whereCondition.riderDeliveryStatus = statusFilter
    } else {
      // Default: surface ready unassigned orders + active assigned orders needing dispatch attention
      whereCondition.OR = [
        {
          status: "ready",
          OR: [{ riderDeliveryStatus: null }, { riderDeliveryStatus: "pending" }],
        },
        {
          riderDeliveryStatus: {
            notIn: ["delivered", "cancelled"],
          },
        },
      ]
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        customer: { select: { name: true, phone: true } },
        deliveryAddress: { select: { details: true, label: true } },
        riderUser: {
          select: {
            id: true,
            name: true,
            driverProfile: { select: { code: true } },
          },
        },
        riderProfile: {
          select: {
            id: true,
            code: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedOrders = orders.map((ord) => {
      const riderName = ord.riderUser?.name || ord.riderProfile?.user?.name || null
      const riderCode = ord.riderUser?.driverProfile?.code || ord.riderProfile?.code || null

      return {
        id: ord.id,
        orderNumber: ord.posReferenceId || ord.id.slice(-6).toUpperCase(),
        status: ord.riderDeliveryStatus || "pending",
        riderId: ord.riderId || ord.riderProfile?.userId || null,
        riderName,
        riderCode,
        customerName: ord.customer?.name || "عميل",
        customerPhone: ord.customer?.phone || "",
        deliveryAddress: ord.deliveryAddress?.details || ord.deliveryAddress?.label || "",
        totalAmount: ord.totalPrice,
        createdAt: ord.createdAt.toISOString(),
      }
    })

    return NextResponse.json(
      {
        success: true,
        orders: formattedOrders,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET Control Orders Error:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء استرجاع قائمة طلبات الكنترول" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get("restaurantId")
    const restaurantSlug = searchParams.get("restaurantSlug")

    let targetRestaurantId = restaurantId

    if (!targetRestaurantId && restaurantSlug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        select: { id: true },
      })
      if (restaurant) {
        targetRestaurantId = restaurant.id
      }
    }

    if (!targetRestaurantId) {
      return NextResponse.json({ error: "المطعم غير موجود" }, { status: 400 })
    }

    // Fetch user's latest complaint (if any) and all recent messages
    const [activeComplaint, recentMessages] = await Promise.all([
      prisma.customerMessage.findFirst({
        where: {
          customerId: user.id,
          restaurantId: targetRestaurantId,
          type: "complaint",
          status: { in: ["unread", "read"] },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customerMessage.findMany({
        where: {
          customerId: user.id,
          restaurantId: targetRestaurantId,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    return NextResponse.json({
      activeComplaint,
      isLocked: !!activeComplaint,
      recentMessages,
    })
  } catch (error) {
    console.error("Error fetching active customer messages:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات الرسائل" }, { status: 500 })
  }
}

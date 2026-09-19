import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 })
    }

    // Explicitly EXCLUDE the actual restaurant owner account from receiving/viewing customer messages
    if (user.id === restaurant.ownerId || user.role === "restaurant_owner") {
      return NextResponse.json(
        { error: "رسائل العملاء مخصصة لطاقم العمل والمدير فقط، ومستبعدة من حساب المالك" },
        { status: 403 }
      )
    }

    const access = await getRestaurantAccess(user.id, restaurantId)

    // Allow staff and manager (and platform admin)
    if (access !== "manager" && access !== "staff" && user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح لك بمشاهدة رسائل العملاء" }, { status: 403 })
    }

    const messages = await prisma.customerMessage.findMany({
      where: { restaurantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching customer messages:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الرسائل" }, { status: 500 })
  }
}

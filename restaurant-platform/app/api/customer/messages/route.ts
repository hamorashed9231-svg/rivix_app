import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول" }, { status: 401 })
    }

    const body = await req.json()
    const { restaurantId, restaurantSlug, subject, message, type = "inquiry", imageUrl } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "يرجى كتابة نص الرسالة" }, { status: 400 })
    }

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

    // Complaint Lock Enforcement: Check if customer has an open, unresolved complaint for this restaurant
    const activeComplaint = await prisma.customerMessage.findFirst({
      where: {
        customerId: user.id,
        restaurantId: targetRestaurantId,
        type: "complaint",
        status: { in: ["unread", "read"] },
      },
      orderBy: { createdAt: "desc" },
    })

    if (activeComplaint) {
      return NextResponse.json(
        {
          error: "لديك شكوى قيد المراجعة، سيتم الرد عليها قريبًا",
          activeComplaint,
        },
        { status: 400 }
      )
    }

    const newMessage = await prisma.customerMessage.create({
      data: {
        customerId: user.id,
        restaurantId: targetRestaurantId,
        subject: subject ? String(subject).trim() : null,
        message: message.trim(),
        type: type === "complaint" ? "complaint" : "inquiry",
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        status: "unread",
      },
    })

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 })
  } catch (error) {
    console.error("Error creating customer message:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال الرسالة" }, { status: 500 })
  }
}

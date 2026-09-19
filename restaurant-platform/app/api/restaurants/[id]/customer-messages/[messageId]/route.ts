import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id: restaurantId, messageId } = await params

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 })
    }

    if (user.id === restaurant.ownerId || user.role === "restaurant_owner") {
      return NextResponse.json({ error: "غير مصرح للمالك بتعديل رسائل العملاء" }, { status: 403 })
    }

    const access = await getRestaurantAccess(user.id, restaurantId)

    if (access !== "manager" && access !== "staff" && user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const body = await req.json()
    const { status, reply } = body

    const updateData: any = {}

    if (status && ["unread", "read", "resolved"].includes(status)) {
      updateData.status = status
    }

    if (reply && typeof reply === "string" && reply.trim()) {
      updateData.reply = reply.trim()
      updateData.repliedAt = new Date()
      updateData.repliedById = user.id
      // Submitting a staff reply automatically resolves the complaint and unlocks customer form
      updateData.status = "resolved"
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "لم يتم تقديم أي بيانات للتحديث" }, { status: 400 })
    }

    const updatedMessage = await prisma.customerMessage.update({
      where: { id: messageId },
      data: updateData,
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
    })

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (error) {
    console.error("Error updating message status and reply:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث حالة الرسالة والرد" }, { status: 500 })
  }
}

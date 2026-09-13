import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بتنفيذ هذه العملية. صلاحيات أدمن فقط." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !["active", "suspended", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "الحالة المدخلة غير صالحة" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: "المطعم غير موجود" },
        { status: 404 }
      )
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      message: `تم تحديث حالة المطعم إلى: ${status}`,
      restaurant: updatedRestaurant,
    })
  } catch (error) {
    console.error("Error updating restaurant status:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة المطعم" },
      { status: 500 }
    )
  }
}

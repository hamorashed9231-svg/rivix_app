import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح لك بهذه العملية" }, { status: 403 })
    }

    const body = await req.json()
    const { restaurantId, status, commissionRate } = body

    if (!restaurantId) {
      return NextResponse.json({ error: "معرف المطعم مطلوب" }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (status) dataToUpdate.status = status
    if (commissionRate !== undefined && commissionRate !== null) {
      dataToUpdate.commissionRate = parseFloat(commissionRate)
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: dataToUpdate,
    })

    return NextResponse.json({ message: "تم تحديث بيانات المطعم بنجاح", restaurant: updatedRestaurant })
  } catch (error) {
    console.error("Admin Restaurant Update Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 })
  }
}

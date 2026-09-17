import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH: Update staff member role or active status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 })
    }

    const { id: restaurantId, staffId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بتعديل بيانات الموظفين. هذه العملية للمالك فقط." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { isActive, staffRole } = body

    const existingStaff = await prisma.restaurantStaff.findUnique({
      where: { id: staffId },
    })

    if (!existingStaff || existingStaff.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "الموظف غير موجود لهذا المطعم" }, { status: 404 })
    }

    const updateData: { isActive?: boolean; staffRole?: "manager" | "staff" } = {}

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive
    }

    if (staffRole && ["manager", "staff"].includes(staffRole)) {
      updateData.staffRole = staffRole
    }

    const updatedStaff = await prisma.restaurantStaff.update({
      where: { id: staffId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "تم تحديث صلاحيات وحالة الموظف بنجاح",
      staff: updatedStaff,
    })
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: "حدث خطأ في السيرفر أثناء تعديل الموظف" }, { status: 500 })
  }
}

// DELETE: Remove staff member from restaurant
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 })
    }

    const { id: restaurantId, staffId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بحذف الموظفين. هذه العملية للمالك فقط." },
        { status: 403 }
      )
    }

    await prisma.restaurantStaff.delete({
      where: { id: staffId },
    })

    return NextResponse.json({ message: "تم إزالة الموظف من الطاقم بنجاح" })
  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إزالة الموظف" }, { status: 500 })
  }
}

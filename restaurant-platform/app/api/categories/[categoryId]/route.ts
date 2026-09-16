import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH: Edit category name or order
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { categoryId } = await params

    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        branch: { select: { restaurantId: true } },
      },
    })

    if (!category || !category.branch) {
      return NextResponse.json({ error: "القسم أو الفرع غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بتعديل أجزاء المنيو" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, order } = body

    const updateData: { name?: string; order?: number } = {}
    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim()
    }
    if (typeof order === "number") {
      updateData.order = order
    }

    const updatedCategory = await prisma.menuCategory.update({
      where: { id: categoryId },
      data: updateData,
      include: { items: true },
    })

    return NextResponse.json({ message: "تم تعديل القسم بنجاح", category: updatedCategory })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل القسم" }, { status: 500 })
  }
}

// DELETE: Remove category and all items
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { categoryId } = await params

    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        branch: { select: { restaurantId: true } },
      },
    })

    if (!category || !category.branch) {
      return NextResponse.json({ error: "القسم أو الفرع غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بحذف أجزاء المنيو" },
        { status: 403 }
      )
    }

    await prisma.menuCategory.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ message: "تم حذف القسم وكل أصنافه بنجاح" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حذف القسم" }, { status: 500 })
  }
}

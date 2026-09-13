import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH: Update item details or availability toggle
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { itemId } = await params

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            branch: { select: { restaurantId: true } },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, item.category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بتعديل بيانات الأصناف" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, price, image, isAvailable } = body

    const updateData: {
      name?: string
      description?: string | null
      price?: number
      image?: string | null
      isAvailable?: boolean
    } = {}

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim()
    }
    if (typeof description !== "undefined") {
      updateData.description = description ? description.trim() : null
    }
    if (typeof price !== "undefined") {
      const numericPrice = typeof price === "number" ? price : parseFloat(price)
      if (!isNaN(numericPrice) && numericPrice >= 0) {
        updateData.price = numericPrice
      }
    }
    if (typeof image !== "undefined") {
      updateData.image = image || null
    }
    if (typeof isAvailable === "boolean") {
      updateData.isAvailable = isAvailable
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json({ message: "تم تحديث الصنف بنجاح", item: updatedItem })
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل الصنف" }, { status: 500 })
  }
}

// DELETE: Remove item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { itemId } = await params

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            branch: { select: { restaurantId: true } },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, item.category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بحذف الأصناف" },
        { status: 403 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: "تم حذف الصنف من المنيو بنجاح" })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الصنف" }, { status: 500 })
  }
}

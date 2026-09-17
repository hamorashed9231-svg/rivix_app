import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بهذ العمل" }, { status: 401 })
    }

    const body = await req.json()
    const { action, restaurantId, branchId, categoryName, categoryId, name, description, price, image } = body

    if (action === "create_category") {
      if ((!restaurantId && !branchId) || !categoryName) {
        return NextResponse.json({ error: "بيانات التصنيف غير مكتملة" }, { status: 400 })
      }

      let targetRestaurantId = restaurantId
      if (!targetRestaurantId && branchId) {
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          select: { restaurantId: true },
        })
        targetRestaurantId = branch?.restaurantId
      }

      if (!targetRestaurantId) {
        return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 })
      }

      const access = await getRestaurantAccess(user.id, targetRestaurantId)
      if (access !== "owner" && access !== "manager" && user.role !== "admin") {
        return NextResponse.json({ error: "غير مصرح لك بهذ العمل" }, { status: 403 })
      }

      const newCategory = await prisma.menuCategory.create({
        data: {
          restaurantId: targetRestaurantId,
          branchId: branchId || null,
          name: categoryName,
          order: 1,
        },
      })

      return NextResponse.json({ message: "تمت إضافة التصنيف بنجاح", category: newCategory }, { status: 201 })
    }

    if (action === "create_item") {
      if (!categoryId || !name || !price) {
        return NextResponse.json({ error: "بيانات الصنف غير مكتملة" }, { status: 400 })
      }

      const category = await prisma.menuCategory.findUnique({
        where: { id: categoryId },
        select: { restaurantId: true, branch: { select: { restaurantId: true } } },
      })

      const targetRestaurantId = category?.restaurantId || category?.branch?.restaurantId
      if (!targetRestaurantId) {
        return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 })
      }

      const access = await getRestaurantAccess(user.id, targetRestaurantId)
      if (access !== "owner" && access !== "manager" && user.role !== "admin") {
        return NextResponse.json({ error: "غير مصرح لك بهذ العمل" }, { status: 403 })
      }

      const newItem = await prisma.menuItem.create({
        data: {
          categoryId,
          name,
          description: description || null,
          price: parseFloat(price),
          image: image || null,
          isAvailable: true,
        },
      })

      return NextResponse.json({ message: "تمت إضافة الصنف بنجاح", item: newItem }, { status: 201 })
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 })
  } catch (error) {
    console.error("Menu API Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 })
    }

    const body = await req.json()
    const { itemId, isAvailable, price } = body

    if (!itemId) {
      return NextResponse.json({ error: "معرف الصنف مطلوب" }, { status: 400 })
    }

    const existingItem = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: {
        category: {
          select: { restaurantId: true, branch: { select: { restaurantId: true } } },
        },
      },
    })

    const targetRestaurantId = existingItem?.category?.restaurantId || existingItem?.category?.branch?.restaurantId
    if (!targetRestaurantId) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, targetRestaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 })
    }

    const dataToUpdate: any = {}
    if (isAvailable !== undefined) dataToUpdate.isAvailable = isAvailable
    if (price !== undefined) dataToUpdate.price = parseFloat(price)

    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: dataToUpdate,
    })

    return NextResponse.json({ message: "تم تحديث الصنف", item: updatedItem })
  } catch (error) {
    console.error("Menu Patch Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 })
  }
}

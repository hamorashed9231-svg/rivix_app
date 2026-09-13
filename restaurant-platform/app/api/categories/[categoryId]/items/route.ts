import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Create a new MenuItem under a category
export async function POST(
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

    if (!category) {
      return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة أصناف جديدة للمنيو. هذه العملية للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, price, image, isAvailable } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "اسم الصنف مطلوب" }, { status: 400 })
    }

    const numericPrice = typeof price === "number" ? price : parseFloat(price)
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "سعر الصنف يجب أن يكون رقم صحيح أو عشري موجب" }, { status: 400 })
    }

    const newItem = await prisma.menuItem.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: numericPrice,
        image: image || null,
        isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
      },
    })

    return NextResponse.json({ message: "تم إضافة الصنف للمنيو بنجاح", item: newItem }, { status: 201 })
  } catch (error) {
    console.error("Error creating menu item:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة الصنف" }, { status: 500 })
  }
}

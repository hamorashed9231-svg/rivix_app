import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fetch all categories with items for a branch
export async function GET(
  req: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const { branchId } = await params

    const categories = await prisma.menuCategory.findMany({
      where: { branchId },
      include: {
        items: true,
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الأقسام" }, { status: 500 })
  }
}

// POST: Create a new category for a branch
export async function POST(
  req: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { branchId } = await params

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { restaurantId: true },
    })

    if (!branch) {
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة أقسام للمنيو. هذه العملية للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, order } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 })
    }

    const newCategory = await prisma.menuCategory.create({
      data: {
        branchId,
        name: name.trim(),
        order: typeof order === "number" ? order : 0,
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({ message: "تم إضافة القسم بنجاح", category: newCategory }, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة القسم" }, { status: 500 })
  }
}

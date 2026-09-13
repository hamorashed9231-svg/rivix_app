import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fetch all staff members for a specific restaurant
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك باستعراض طاقم العمل. هذه الصفحة للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const staffMembers = await prisma.restaurantStaff.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ staffMembers })
  } catch (error) {
    console.error("Error fetching restaurant staff:", error)
    return NextResponse.json({ error: "حدث خطأ في السيرفر أثناء جلب بيانات الطاقم" }, { status: 500 })
  }
}

// POST: Add a new staff member to the restaurant by email
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح، يرجى تسجيل الدخول" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة موظفين جدد. هذه العملية للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, staffRole } = body

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "البريد الإلكتروني للموظف مطلوب" }, { status: 400 })
    }

    const roleToAssign = staffRole === "manager" ? "manager" : "staff"

    // 1. Find target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "يجب أن يسجل المستخدم حساب أولاً في النظام بنفس البريد الإلكتروني" },
        { status: 404 }
      )
    }

    // 2. Check if target user is restaurant owner
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    })

    if (restaurant?.ownerId === targetUser.id) {
      return NextResponse.json(
        { error: "هذا المستخدم هو بالفعل صاحب هذا المطعم" },
        { status: 400 }
      )
    }

    // 3. Check if target user is already staff in this restaurant
    const existingStaff = await prisma.restaurantStaff.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: targetUser.id,
        },
      },
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: "المستخدم مضاف بالفعل لطاقم هذا المطعم" },
        { status: 400 }
      )
    }

    // 4. Add staff member
    const newStaff = await prisma.restaurantStaff.create({
      data: {
        restaurantId,
        userId: targetUser.id,
        staffRole: roleToAssign,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: "تم إضافة الموظف لطاقم العمل بنجاح", staff: newStaff },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding restaurant staff:", error)
    return NextResponse.json({ error: "حدث خطأ في السيرفر أثناء إضافة الموظف" }, { status: 500 })
  }
}

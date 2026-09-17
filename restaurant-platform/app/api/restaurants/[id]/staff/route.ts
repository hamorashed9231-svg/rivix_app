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
    if (access !== "owner" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة موظفين جدد. هذه العملية للمالك فقط." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, email, password, phone, staffRole } = body

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "البريد الإلكتروني للموظف مطلوب" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const roleToAssign = staffRole === "manager" ? "manager" : "staff"

    // 1. Find or create target user
    let targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (!targetUser) {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "كلمة المرور مطلوبة لموظف جديد (6 أحرف على الأقل)" },
          { status: 400 }
        )
      }

      const bcrypt = (await import("bcryptjs")).default
      const hashedPassword = await bcrypt.hash(password, 10)

      targetUser = await prisma.user.create({
        data: {
          name: (name && typeof name === "string" && name.trim()) ? name.trim() : cleanEmail.split("@")[0],
          email: cleanEmail,
          password: hashedPassword,
          phone: phone || null,
          role: "customer",
          accountStatus: "approved",
        },
      })
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

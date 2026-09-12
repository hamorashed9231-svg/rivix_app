import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، كلمة المرور) يجب تقديمها" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userRole = Object.values(Role).includes(role) ? role : Role.customer

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء إنشاء الحساب" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { signDriverToken } from "@/lib/driver-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: "جميع الحقول المطلوبة (الاسم، رقم الهاتف، البريد الإلكتروني، كلمة المرور) يجب إدخالها" },
        { status: 400 }
      )
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanPhone = String(phone).trim()

    const egyptPhoneRegex = /^01\d{9}$/
    if (!egyptPhoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { message: "رقم الهاتف يجب أن يكون رقم محمول مصري مكون من 11 رقم يبدأ بـ 01" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل بحساب آخر" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        role: Role.customer,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    })

    const token = await signDriverToken({
      id: user.id,
      userId: user.id,
      name: user.name,
      role: user.role,
    })

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Mobile Register Error:", error)
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً" },
      { status: 500 }
    )
  }
}

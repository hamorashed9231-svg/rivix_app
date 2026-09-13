import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role, AccountStatus } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة (الاسم، رقم الهاتف، البريد الإلكتروني، كلمة المرور) يجب تقديمها" },
        { status: 400 }
      )
    }

    const egyptPhoneRegex = /^01\d{9}$/
    if (!egyptPhoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: "رقم الهاتف إجباري ويجب أن يكون رقم محمول مصري مكون من 11 رقم يبدأ بـ 01" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role: Role.restaurant_owner,
        accountStatus: AccountStatus.pending,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: "تم إنشاء حسابك بنجاح، سيتم مراجعته من قبل إدارة المنصة والتواصل معك قريبًا",
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register Restaurant Owner Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء إنشاء الحساب" },
      { status: 500 }
    )
  }
}

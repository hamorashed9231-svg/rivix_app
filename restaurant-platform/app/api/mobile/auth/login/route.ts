import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signDriverToken } from "@/lib/driver-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: "البريد الإلكتروني/رقم الهاتف وكلمة المرور مطلوبان" },
        { status: 400 }
      )
    }

    const cleanIdentifier = String(email).trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier }
        ],
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      )
    }

    const token = await signDriverToken({
      id: user.id,
      userId: user.id,
      name: user.name || "",
      role: user.role,
    })

    return NextResponse.json(
      {
        message: "تم التسجيل بنجاح",
        token,
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Mobile Login Error:", error)
    return NextResponse.json(
      { message: "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً" },
      { status: 500 }
    )
  }
}

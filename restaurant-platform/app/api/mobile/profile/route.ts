import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyMobileToken } from "@/lib/driver-auth"

export async function GET(req: Request) {
  try {
    const payload = await verifyMobileToken(req)

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "غير مصرح (تذكرة غير صالحة)" },
        { status: 401 }
      )
    }

    const userId = String(payload.userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      },
    })
  } catch (error) {
    console.error("Mobile Profile Error:", error)
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب بيانات الملف الشخصي" },
      { status: 500 }
    )
  }
}

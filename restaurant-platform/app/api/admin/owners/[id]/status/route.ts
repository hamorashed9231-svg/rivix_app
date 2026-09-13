import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AccountStatus } from "@prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول لوظائف الأدمن" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(AccountStatus).includes(status)) {
      return NextResponse.json(
        { error: "حالة الحساب غير صحيحة" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: status as AccountStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: "تم تحديث حالة الحساب بنجاح",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update Owner Status Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الحساب" },
      { status: 500 }
    )
  }
}

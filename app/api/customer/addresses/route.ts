import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء جلب العناوين" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    let userId = user?.id

    if (!userId) {
      const defaultCust = await prisma.user.findFirst({ where: { role: "customer" } })
      if (defaultCust) userId = defaultCust.id
    }

    if (!userId) {
      return NextResponse.json({ error: "يرجى تسجيل الدخول" }, { status: 401 })
    }

    const body = await req.json()
    const { label, details, lat, lng } = body

    if (!label || !details) {
      return NextResponse.json({ error: "تسمية وتفاصيل العنوان مطلوبة" }, { status: 400 })
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label: label || "المنزل",
        details,
        lat: parseFloat(lat || "24.7136"),
        lng: parseFloat(lng || "46.6753"),
      },
    })

    return NextResponse.json({ message: "تم إحفظ العنوان بنجاح", address: newAddress }, { status: 201 })
  } catch (error) {
    console.error("Create Address Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة العنوان" }, { status: 500 })
  }
}

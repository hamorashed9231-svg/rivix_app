import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Fetch Addresses Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب العناوين" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req)

    if (!user?.id) {
      return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً لإضافة عنوان" }, { status: 401 })
    }

    const userId = user.id

    const body = await req.json()
    const {
      label,
      details,
      lat,
      lng,
      streetName,
      buildingNumber,
      floor,
      apartment,
      landmark,
      phone,
    } = body

    const cleanStreet = streetName ? String(streetName).trim() : null
    const cleanBuilding = buildingNumber ? String(buildingNumber).trim() : null
    const cleanFloor = floor ? String(floor).trim() : null
    const cleanApartment = apartment ? String(apartment).trim() : null
    const cleanLandmark = landmark ? String(landmark).trim() : null
    const cleanPhone = phone ? String(phone).trim() : null

    const autoParts = [
      cleanStreet ? `شارع: ${cleanStreet}` : null,
      cleanBuilding ? `عمارة: ${cleanBuilding}` : null,
      cleanFloor ? `دور: ${cleanFloor}` : null,
      cleanApartment ? `شقة: ${cleanApartment}` : null,
      cleanLandmark ? `علامة مميزة: ${cleanLandmark}` : null,
      cleanPhone ? `تليفون: ${cleanPhone}` : null,
    ].filter(Boolean)

    const computedDetails =
      details && String(details).trim()
        ? String(details).trim()
        : autoParts.join(" - ")

    const computedLabel =
      label && String(label).trim()
        ? String(label).trim()
        : cleanStreet
        ? `شارع ${cleanStreet}`
        : "عنوان التوصيل"

    if (!computedDetails) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم الشارع ورقم العمارة والشقة وتفاصيل العنوان" },
        { status: 400 }
      )
    }

    const parsedLat = typeof lat === "number" ? lat : parseFloat(String(lat || "31.2156"))
    const parsedLng = typeof lng === "number" ? lng : parseFloat(String(lng || "29.9553"))

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label: computedLabel,
        details: computedDetails,
        lat: isNaN(parsedLat) ? 31.2156 : parsedLat,
        lng: isNaN(parsedLng) ? 29.9553 : parsedLng,
        streetName: cleanStreet,
        buildingNumber: cleanBuilding,
        floor: cleanFloor,
        apartment: cleanApartment,
        landmark: cleanLandmark,
        phone: cleanPhone,
      },
    })

    if (cleanPhone) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { phone: cleanPhone },
        })
      } catch {}
    }

    return NextResponse.json(
      { message: "تم حفظ العنوان بنجاح", address: newAddress },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Address Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة العنوان" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "معرف العنوان مطلوب" }, { status: 400 })
    }

    await prisma.address.deleteMany({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true, message: "تم حذف العنوان بنجاح" })
  } catch (error) {
    console.error("Delete Address Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حذف العنوان" }, { status: 500 })
  }
}

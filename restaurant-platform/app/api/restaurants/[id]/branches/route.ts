import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    const isAdmin = user.role === "admin"

    if (!access && !isAdmin) {
      return NextResponse.json({ error: "غير مصرح بالوصول لهذا المطعم" }, { status: 403 })
    }

    const branches = await prisma.branch.findMany({
      where: { restaurantId },
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { menuCategories: true, orders: true },
        },
      },
    })

    return NextResponse.json(branches)
  } catch (error: any) {
    console.error("GET /api/restaurants/[id]/branches error:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء جلب الفروع" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    const isAdmin = user.role === "admin"

    if (access !== "owner" && access !== "manager" && !isAdmin) {
      return NextResponse.json(
        { error: "عذراً، يمتلك الصلاحية فقط صاحب المطعم أو المدير" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, address, phone, lat, lng, isActive, openingHours } = body

    if (!name || !address || !phone || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "يرجى تقديم جميع البيانات المطلوبة (الاسم، العنوان، الهاتف، الإحداثيات)" },
        { status: 400 }
      )
    }

    const branch = await prisma.branch.create({
      data: {
        restaurantId,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        isActive: isActive ?? true,
        openingHours: openingHours || { open: "10:00 AM", close: "12:00 AM" },
      },
      include: {
        _count: {
          select: { menuCategories: true, orders: true },
        },
      },
    })

    revalidatePath("/dashboard/restaurant/branches")
    revalidatePath("/dashboard/restaurant")
    revalidatePath("/restaurant/[slug]", "page")

    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/restaurants/[id]/branches error:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء إضافة الفرع" },
      { status: 500 }
    )
  }
}

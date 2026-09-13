import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      )
    }

    if (user.role !== "restaurant_owner" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك بإنشاء مطعم جديد" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, slug, logo, primaryColor, secondaryColor, description, coverImage } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "اسم المطعم مطلوب" },
        { status: 400 }
      )
    }

    // Auto-generate or sanitize slug
    const finalSlug =
      (slug && typeof slug === "string" && slug.trim())
        ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
        : name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")

    if (!finalSlug) {
      return NextResponse.json(
        { error: "رابط المطعم (slug) غير صالح" },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug: finalSlug },
    })

    if (existingRestaurant) {
      return NextResponse.json(
        { error: "اسم الرابط (slug) مستخدم بالفعل، يرجى اختيار رابط آخر" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: user.id,
        name: name.trim(),
        slug: finalSlug,
        logo: logo || "/logo.jpg",
        primaryColor: primaryColor || "#2196F3",
        secondaryColor: secondaryColor || "#0A1A3C",
        description: description || null,
        coverImage: coverImage || null,
        status: "pending",
        branches: {
          create: {
            address: "الفرع الرئيسي",
            phone: user.phone || "0500000000",
            lat: 24.7136,
            lng: 46.6753,
            openingHours: { open: "10:00 AM", close: "12:00 AM" },
            isActive: true,
          },
        },
      },
      include: {
        branches: true,
      },
    })

    return NextResponse.json(
      {
        message: "تم إنشاء المطعم والفرع الرئيسي بنجاح وفي انتظار المراجعة والاعتماد",
        restaurant,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء إنشاء المطعم" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      )
    }

    let restaurants
    if (user.role === "admin") {
      restaurants = await prisma.restaurant.findMany({
        orderBy: { createdAt: "desc" },
      })
    } else {
      restaurants = await prisma.restaurant.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات المطاعم" },
      { status: 500 }
    )
  }
}

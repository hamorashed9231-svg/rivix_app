import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentUser()
    let userId = sessionUser?.id

    if (!userId) {
      const defaultCustomer = await prisma.user.findFirst({
        where: { role: "customer" },
      })
      userId = defaultCustomer?.id
    }

    if (!userId) {
      return NextResponse.json({ error: "يرجى تسجيل الدخول لتقديم التقييم" }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, rating, foodRating, deliveryRating, comment } = body

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "بيانات التقييم غير صالحة" }, { status: 400 })
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: true },
    })

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
    }

    // Check if order is already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    })

    if (existingReview) {
      return NextResponse.json({ error: "لقد قمت بتقييم هذا الطلب من قبل" }, { status: 400 })
    }

    // Create review in DB
    const newReview = await prisma.review.create({
      data: {
        orderId,
        userId,
        restaurantId: order.branch.restaurantId,
        rating: parseInt(rating),
        foodRating: parseInt(foodRating || rating),
        deliveryRating: parseInt(deliveryRating || rating),
        comment: comment || null,
      },
    })

    return NextResponse.json({
      message: "شكراً لك! تم تسليم تقييمك بنجاح 🌟",
      review: newReview,
    }, { status: 201 })
  } catch (error) {
    console.error("Submit Review Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ التقييم" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "يرجى تحديد المطعم" }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalCount = reviews.length
    const averageRating = totalCount > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : "5.0"

    const ratingCounts = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }

    return NextResponse.json({
      reviews,
      totalCount,
      averageRating: parseFloat(averageRating),
      ratingCounts,
    })
  } catch (error) {
    console.error("Fetch Reviews Error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التقييمات" }, { status: 500 })
  }
}

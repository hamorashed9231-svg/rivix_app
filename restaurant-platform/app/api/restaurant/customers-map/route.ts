import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const isAdmin = user.role === "admin"
    const isOwner = user.role === "restaurant_owner"

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "غير مصرح لك باستعراض خريطة العملاء" }, { status: 403 })
    }

    // 1. Get owner's restaurant IDs
    const ownerRestaurants = await prisma.restaurant.findMany({
      where: isAdmin ? {} : { ownerId: user.id },
      select: { id: true, name: true },
    })

    const restaurantIds = ownerRestaurants.map((r) => r.id)

    if (restaurantIds.length === 0) {
      return NextResponse.json({ customers: [] })
    }

    // 2. Fetch all orders for owner's restaurants with customer, deliveryAddress, and reviews
    const orders = await prisma.order.findMany({
      where: {
        branch: {
          restaurantId: { in: restaurantIds },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        deliveryAddress: true,
        review: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // 3. Aggregate customer analytics & pins
    const customerMap: { [customerId: string]: any } = {}

    orders.forEach((order) => {
      const cust = order.customer
      if (!cust) return

      if (!customerMap[cust.id]) {
        customerMap[cust.id] = {
          id: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone || "غير محدد",
          lat: order.deliveryAddress?.lat || 24.7136,
          lng: order.deliveryAddress?.lng || 46.6753,
          addressDetails: order.deliveryAddress?.details || "عنوان غير محدد",
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalSpent: 0,
          cancellationReasons: [],
          reviews: [],
        }
      }

      const record = customerMap[cust.id]
      record.totalOrders += 1

      if (order.status === "delivered") {
        record.completedOrders += 1
        record.totalSpent += order.totalPrice
      } else if (order.status === "cancelled") {
        record.cancelledOrders += 1
        record.cancellationReasons.push({
          orderId: order.id,
          date: new Date(order.createdAt).toLocaleDateString("ar-EG"),
          reason: order.cancellationReason || "لم يتم توضيح السبب من العميل",
        })
      }

      if (order.review) {
        record.reviews.push({
          rating: order.review.rating,
          comment: order.review.comment || "بدون تعليق",
          date: new Date(order.review.createdAt).toLocaleDateString("ar-EG"),
        })
      }
    })

    const customers = Object.values(customerMap)

    return NextResponse.json({
      customers,
      totalCount: customers.length,
    })
  } catch (error) {
    console.error("Error fetching customers map data:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات خريطة العملاء" }, { status: 500 })
  }
}

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { OrderBoard } from "./OrderBoard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrdersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  let orders: any[] = []
  let activeRestaurantId: string | null = null

  if (user.role === "admin") {
    orders = await prisma.order.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true, name: true, restaurantId: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" },
    })
    activeRestaurantId = orders[0]?.branch?.restaurantId || null
  } else {
    // Check owned restaurant first, then active Call Center Manager / Staff membership
    let restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: user.id },
      include: { branches: { select: { id: true } } },
    })

    if (!restaurant) {
      const staffMembership = await prisma.restaurantStaff.findFirst({
        where: { userId: user.id, isActive: true },
        include: {
          restaurant: {
            include: { branches: { select: { id: true } } },
          },
        },
      })
      if (staffMembership?.restaurant) {
        restaurant = staffMembership.restaurant
      }
    }

    if (!restaurant) {
      redirect("/login")
    }

    activeRestaurantId = restaurant.id
    const branchIds = restaurant.branches.map((b) => b.id)

    orders = await prisma.order.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true, name: true, restaurantId: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">شاشة استقبال واستلام الطلبات (Order Dispatch Center)</h1>
        <p className="text-sm text-slate-400 mt-1">استقبال طلبات العملاء فوراً، الموافقة عليها وتجهيزها، أو تحويلها إلى النظام الخارجي (POS Integration).</p>
      </div>

      <OrderBoard initialOrders={orders} restaurantId={activeRestaurantId} />
    </div>
  )
}


import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { OrderBoard } from "./OrderBoard"

export default async function OrdersPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
    redirect("/login")
  }

  let orders = []

  if (user.role === "admin") {
    orders = await prisma.order.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" }
    })
  } else {
    // Owner orders
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: user.id },
      include: { branches: { select: { id: true } } }
    })

    const branchIds = restaurant?.branches.map((b) => b.id) || []

    orders = await prisma.order.findMany({
      where: { branchId: { in: branchIds } },
      include: {
        customer: { select: { name: true, phone: true } },
        branch: { select: { address: true } },
        items: { include: { menuItem: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: "desc" }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">شاشة المطبخ والطلبات المباشرة (Live Kitchen Board)</h1>
        <p className="text-sm text-slate-400 mt-1">متابعة وتحديث حالات الطلبات لحظياً وتنظيم مراحل التجهيز والتوصيل.</p>
      </div>

      <OrderBoard initialOrders={orders} />
    </div>
  )
}

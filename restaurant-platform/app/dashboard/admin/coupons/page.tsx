import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CouponManager } from "./CouponManager"

export default async function AdminCouponsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  let isAuthorized = user.role === "admin" || user.role === "restaurant_owner"
  if (!isAuthorized) {
    const staff = await prisma.restaurantStaff.findFirst({
      where: { userId: user.id, isActive: true, staffRole: "manager" },
    })
    if (staff) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    redirect("/dashboard/orders")
  }

  const coupons = await prisma.coupon.findMany({
    include: { restaurant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة أكواد الخصم والكوبونات والعروض الإشعارية</h1>
        <p className="text-sm text-slate-400 mt-1">إنشاء أكواد الخصم، تحديد نوع الخصم (نسبة % / مبلغ ثابت)، وإرسال إشعار فوري لجميع العملاء المحملين للتطبيق.</p>
      </div>

      <CouponManager initialCoupons={coupons} />
    </div>
  )
}

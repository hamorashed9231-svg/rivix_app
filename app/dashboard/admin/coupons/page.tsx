import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CouponManager } from "./CouponManager"

export default async function AdminCouponsPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "restaurant_owner")) {
    redirect("/login")
  }

  const coupons = await prisma.coupon.findMany({
    include: { restaurant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة أكواد الخصم والكوبونات (Promo Codes Manager)</h1>
        <p className="text-sm text-slate-400 mt-1">إنشاء أكواد الخصم، تحديد نوع الخصم (نسبة % / مبلغ ثابت)، وضبط الحد الأدنى للطلب.</p>
      </div>

      <CouponManager initialCoupons={coupons} />
    </div>
  )
}

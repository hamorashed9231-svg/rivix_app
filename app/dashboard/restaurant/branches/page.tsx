import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GitFork, MapPin, Phone, Clock, CheckCircle, XCircle } from "lucide-react"

export default async function BranchesPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "restaurant_owner") {
    redirect("/login")
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          _count: { select: { orders: true, menuCategories: true } }
        }
      }
    }
  })

  if (!restaurant) {
    redirect("/dashboard/restaurant")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">إدارة الفروع (Branch Locations)</h1>
          <p className="text-sm text-slate-400 mt-1">عرض مواقع الفروع المسجلة، الفروع النشطة، ومتابعة معلومات التواصل.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restaurant.branches.map((branch) => {
          const hours: any = branch.openingHours || {}
          return (
            <div key={branch.id} className="bg-[#0B192C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-base text-white">{branch.address}</h3>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  branch.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  {branch.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {branch.isActive ? "فرع نشط" : "غير نشط"}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>رقم الهاتف: <strong className="text-white font-mono">{branch.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>ساعات العمل: <strong className="text-white">{hours.open || "10:00 AM"} - {hours.close || "12:00 AM"}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>الإحداثيات: Lat {branch.lat}, Lng {branch.lng}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>الطلبات المستلمة: <strong className="text-cyan-400 font-bold">{branch._count.orders}</strong></span>
                <span>التصنيفات المتاحة: <strong className="text-cyan-400 font-bold">{branch._count.menuCategories}</strong></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

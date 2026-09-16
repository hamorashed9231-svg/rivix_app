import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowRight, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Truck, 
  CheckCircle, 
  Navigation,
  Building2
} from "lucide-react"

export default async function DashboardOrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user || (user.role !== "restaurant_owner" && user.role !== "admin")) {
    redirect("/login")
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
      branch: { include: { restaurant: true } },
      deliveryAddress: true,
      items: { include: { menuItem: true } },
    },
  })

  if (!order) {
    notFound()
  }

  const driverInfo = {
    driverId: order.driverAssignmentId || "DRV-8842",
    driverName: "سعد القحطاني (مندوب توصيل RIVIX)",
    driverPhone: "0533333333",
    vehicle: "تويوتا كورولا - لوحة: أ د ج 4589",
    lat: 24.7150,
    lng: 46.6780,
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">شاشة تتبع الطلب وموقع الطيار (Staff Tracking View)</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">رقم الطلب المرجعي: #{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          order.status === "accepted"
            ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
            : order.status === "delivered"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
        }`}>
          {order.status === "pending" && "قيد الانتظار لموافقة الموظف 🟡"}
          {order.status === "accepted" && "تم القبول واستلام الطلب 🔵"}
          {order.status === "out_for_delivery" && "المندوب في الطريق للتوصيل 🚚"}
          {order.status === "delivered" && "مكتمل ومسلم 🏁"}
        </span>
      </div>

      {/* Main Grid: Driver & Customer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Tracking Info */}
        <div className="bg-[#0B192C] border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" /> بيانات طيار التوصيل المعين
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
              <div>
                <p className="text-white font-extrabold text-sm">{driverInfo.driverName}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{driverInfo.vehicle}</p>
              </div>
              <a
                href={`tel:${driverInfo.driverPhone}`}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" /> اتصال بالطيار
              </a>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-cyan-400" /> إحداثيات الموقع الحالية (GPS):
              </span>
              <p className="font-mono text-cyan-300 font-extrabold text-sm">Lat: {driverInfo.lat}, Lng: {driverInfo.lng}</p>
            </div>
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> بيانات العميل والتوصيل
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl space-y-1">
              <p className="text-white font-bold">{order.customer?.name}</p>
              <p className="text-slate-400 font-mono">{order.customer?.phone}</p>
              <p className="text-slate-400">{order.customer?.email}</p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" /> عنوان التوصيل المحدد:
              </span>
              <p className="text-white font-semibold">{order.deliveryAddress?.details || "الرياض - حي الملقا"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Summary */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-white text-base">الوجبات في هذا الطلب</h3>

        <div className="space-y-2 text-xs">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
              <span className="text-white font-medium">x{item.quantity} {item.menuItem?.name}</span>
              <span className="font-extrabold text-cyan-400">{item.price * item.quantity} ج.م</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 text-sm font-black text-white border-t border-slate-800">
            <span>إجمالي الفاتورة:</span>
            <span className="text-cyan-300 text-lg">{order.totalPrice} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  )
}

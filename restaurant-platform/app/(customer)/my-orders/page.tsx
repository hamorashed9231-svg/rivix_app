import { MyOrdersList } from "@/components/MyOrdersList"

export const metadata = {
  title: "سجل طلباتي - RIVIX Platform",
  description: "سجل الطلبات الحية والسابقة مع خاصية إعادة الطلب بنقرة واحدة",
}

export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-3xl mx-auto">
      <MyOrdersList />
    </div>
  )
}

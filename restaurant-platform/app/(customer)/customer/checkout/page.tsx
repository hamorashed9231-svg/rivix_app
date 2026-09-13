import Link from "next/link"
import { ShoppingBag, ArrowRight, Clock } from "lucide-react"

export default function CustomerCheckoutPlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950">
      <div className="w-full max-w-md mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-500/20">
          <ShoppingBag className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد التطوير والتجهيز</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            صفحة إتمام الطلب - قريباً 🚀
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            سيتم ربط نظام العناوين، اختيار طريقة الدفع، وتوجيه الطلب للمطعم في التحديث القادم.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-cyan-500/20"
          >
            <ArrowRight className="w-4 h-4" /> العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}

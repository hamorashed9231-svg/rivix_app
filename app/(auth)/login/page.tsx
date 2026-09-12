"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Store, UserCheck, ArrowRight, KeyRound } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPass,
        redirect: false,
      })

      if (res?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      } else {
        if (callbackUrl && callbackUrl !== "/") {
          router.push(callbackUrl)
        } else if (loginEmail.includes("admin")) {
          router.push("/dashboard/admin")
        } else if (loginEmail.includes("owner")) {
          router.push("/dashboard/restaurant")
        } else {
          router.push("/dashboard/restaurant")
        }
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(email, password)
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl bg-[#0B192C] border border-cyan-500/30 p-8 shadow-2xl shadow-cyan-500/10 text-slate-100">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">
          RIVIX AUTHENTICATION
        </span>
        <h2 className="text-2xl font-black tracking-tight text-white">
          تسجيل الدخول للنظام
        </h2>
        <p className="text-xs text-slate-400">
          ادخل بيانات حسابك للوصول إلى لوحة التحكم والعمليات
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 font-bold text-center">
          {error}
        </div>
      )}

      {/* Quick Demo Login Buttons */}
      <div className="space-y-2 pt-1">
        <label className="text-[11px] font-bold text-slate-400 block">دخول سريع بنقرة واحدة (Demo Login):</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail("owner@rivix.com")
              setPassword("password123")
              handleLogin("owner@rivix.com", "password123")
            }}
            className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Store className="w-4 h-4" /> صاحب مطعم 🔑
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail("admin@rivix.com")
              setPassword("password123")
              handleLogin("admin@rivix.com", "password123")
            }}
            className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" /> أدمن المنصة 👑
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-800 w-full"></div>
        <span className="bg-[#0B192C] px-3 text-[11px] text-slate-500 font-mono">أو يدويًا</span>
      </div>

      {/* Manual Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              placeholder="owner@rivix.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {loading ? "جاري الدخول..." : "تسجيل الدخول الآن 🚀"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" /> العودة للتطبيق
        </Link>
        <Link href="/register" className="font-bold text-cyan-400 hover:underline">
          إنشاء حساب جديد
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Suspense fallback={<div className="text-center text-slate-400 text-xs">جاري تحميل واجهة الدخول...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

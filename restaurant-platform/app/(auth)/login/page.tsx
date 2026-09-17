"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Utensils,
  Sparkles,
} from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""
  const paramError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(paramError || "")
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
        if (res.error === "CredentialsSignin") {
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
        } else {
          setError(res.error)
        }
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
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Mobile Brand Header */}
      <div className="lg:hidden text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-sky/10 border border-brand-sky/20 text-brand-sky mb-2">
          <Utensils className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-brand-white tracking-tight">RIVIX</h1>
        <p className="text-xs text-brand-gray-400">Restaurant Operations Platform</p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-3xl bg-brand-navy/90 border border-brand-sky/20 p-8 shadow-2xl backdrop-blur-xl space-y-6 text-brand-white">
        {/* Form Header */}
        <div className="space-y-1.5 text-center lg:text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تسجيل الدخول للنظام</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-brand-white pt-1">
            أهلاً بك مجدداً 👋
          </h2>
          <p className="text-xs text-brand-gray-400">
            ادخل بيانات حسابك للوصول إلى لوحة التحكم والعمليات
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl bg-brand-danger/10 border border-brand-danger/30 p-3.5 text-xs text-brand-danger font-bold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Buttons */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-bold text-brand-gray-400 block">
            دخول سريع بنقرة واحدة (Demo Login):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("owner@rivix.com")
                setPassword("password123")
                handleLogin("owner@rivix.com", "password123")
              }}
              className="p-2.5 rounded-xl bg-brand-sky/10 border border-brand-sky/30 hover:bg-brand-sky/20 text-brand-sky font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>صاحب مطعم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("staff@rivix.com")
                setPassword("password123")
                handleLogin("staff@rivix.com", "password123")
              }}
              className="p-2.5 rounded-xl bg-brand-success/10 border border-brand-success/30 hover:bg-brand-success/20 text-brand-success font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>مدير أصطاف</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("rivix@admin.com")
                setPassword("password123")
                handleLogin("rivix@admin.com", "password123")
              }}
              className="p-2.5 rounded-xl bg-brand-sky-light/10 border border-brand-sky-light/30 hover:bg-brand-sky-light/20 text-brand-sky-light font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>أدمن المنصة</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-brand-gray-800 w-full"></div>
          <span className="bg-brand-navy px-3 text-[11px] text-brand-gray-500 font-medium shrink-0">
            أو يدويًا عبر البريد
          </span>
        </div>

        {/* Manual Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-brand-gray-900/80 border border-brand-gray-800 pr-10 pl-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                  placeholder="owner@rivix.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-brand-gray-900/80 border border-brand-gray-800 pr-10 pl-10 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-gray-400 hover:text-brand-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full mt-2 text-sm font-extrabold shadow-lg shadow-brand-sky/20 cursor-pointer"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول الآن 🚀"}
          </Button>
        </form>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-brand-gray-400 pt-3 border-t border-brand-gray-800 flex items-center justify-between">
          <Link
            href="/"
            className="hover:text-brand-sky transition-colors flex items-center gap-1 font-semibold"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للتطبيق
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/register-restaurant" className="font-bold text-brand-sky hover:underline">
              صاحب مطعم؟ سجل هنا
            </Link>
            <span className="text-brand-gray-700">|</span>
            <Link href="/register" className="font-bold text-brand-sky hover:underline">
              سجل الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-brand-navy">
      {/* Form Section (Left Column in RTL -> displays on right/center side) */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-12 bg-brand-navy">
        <Suspense
          fallback={
            <div className="text-center text-brand-gray-400 text-xs">
              جاري تحميل واجهة الدخول...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Decorative Branding Section (Right Column in Desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-navy via-[#0e224e] to-brand-sky relative overflow-hidden border-r border-brand-sky/10">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-navy/60 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-white/10 backdrop-blur-md border border-brand-white/20 text-brand-white">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-white tracking-tight">RIVIX</h2>
            <p className="text-[10px] text-brand-sky-light font-mono">OPERATIONS PLATFORM</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-white/10 backdrop-blur-md border border-brand-white/20 text-brand-sky-light text-xs font-bold">
            <Sparkles className="w-4 h-4 text-brand-sky-light" />
            <span>منصة إدارة المطاعم الجيل الجديد</span>
          </div>

          <h1 className="text-4xl font-extrabold text-brand-white leading-tight">
            تحكم كامل في عمليات مطعمك <br />
            <span className="text-brand-sky-light">بسرعة واحترافية عالية</span>
          </h1>

          <p className="text-sm text-brand-gray-300 leading-relaxed">
            منظومة متكاملة تتيح لك استقبال الطلبات، إدارة الطاولات، متابعة المخزون، وتوجيه فريق العمل
            لحظة بلحظة وبكل سهولة.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-white/10">
            <div>
              <div className="text-2xl font-black text-brand-white">99.9%</div>
              <div className="text-[11px] text-brand-gray-300">استقرار النظام</div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-sky-light">⚡ سريعة</div>
              <div className="text-[11px] text-brand-gray-300">معالجة اللحظية</div>
            </div>
            <div>
              <div className="text-2xl font-black text-brand-white">24/7</div>
              <div className="text-[11px] text-brand-gray-300">دعم متواصل</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-brand-gray-400">
          © {new Date().getFullYear()} Rivix Platform. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  )
}

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
  Utensils,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { AuthShell } from "@/components/auth/AuthShell"

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialClick = (provider: string) => {
    setToastMessage(`ميزة الدخول عبر ${provider} ستكون متاح قريباً! 🚀`)
    setTimeout(() => setToastMessage(""), 3000)
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-brand-navy via-slate-900 to-brand-sky/20 border-2 border-brand-sky/40 p-1 shadow-2xl shadow-brand-sky/25 group transition-transform duration-300 hover:scale-105 flex items-center justify-center overflow-hidden">
          <img
            src="/logo.jpg"
            alt="Rivix Logo"
            className="w-full h-full object-cover rounded-2xl"
          />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
        </div>
        
        <div className="space-y-1.5 pt-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            أهلاً بيك 👋
          </h1>
          <p className="text-xs text-slate-400">
            سجل دخولك واطلب أشهى المأكولات والمشويات مباشرة عبر منصة <span className="text-brand-sky font-bold">Rivix</span>
          </p>

          {/* Title Accent Line */}
          <div className="flex items-center justify-center gap-2 pt-1.5">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-sky/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-sky shadow-[0_0_8px_#2196F3]" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-sky/50" />
          </div>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl bg-brand-danger/10 border border-brand-danger/30 p-4 text-xs text-brand-danger font-bold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Social Toast Notification */}
        {toastMessage && (
          <div className="rounded-2xl bg-brand-sky/10 border border-brand-sky/30 p-3.5 text-xs text-brand-sky font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-brand-sky">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 pr-11 pl-4 py-3.5 text-xs text-white placeholder-slate-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-brand-sky">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 pr-11 pl-11 py-3.5 text-xs text-white placeholder-slate-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            roundedFull
            isLoading={loading}
            className="w-full py-4 text-sm font-extrabold bg-gradient-to-r from-brand-sky via-[#38bdf8] to-brand-sky-light text-slate-950 hover:brightness-110 shadow-lg shadow-brand-sky/25 border-none cursor-pointer mt-2"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول الآن 🚀"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-bold shrink-0">
            أو
          </span>
        </div>

        {/* Social Placeholder Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleSocialClick("Google")}
            className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>متابعة بواسطة Google (قريباً)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialClick("Apple")}
            className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.9-14.4-6.1-3.81-3.05-7.75-7.76-11.82-14.14-7.41-11.53-13.06-24.89-16.94-40.08-3.88-15.19-5.83-29.35-5.83-42.48 0-16.14 3.73-29.74 11.19-40.8 7.46-11.06 17.06-16.71 28.8-16.95 4.34 0 9.28 1.12 14.83 3.35 5.55 2.23 9.42 3.35 11.61 3.35 1.94 0 5.86-1.12 11.77-3.35 5.91-2.23 10.7-3.23 14.37-3.01 12.98.61 23.36 5.52 31.13 14.73-11.45 6.94-17.06 16.54-16.83 28.8.23 9.77 4.1 17.84 11.61 24.21 7.51 6.37 16.48 9.87 26.9 10.5-2.23 7.02-5.19 14.42-8.87 22.21zM119.22 31.09c0-7.39 2.67-14.52 8.01-21.39 5.34-6.87 12.11-11.16 20.31-12.87.23 1.05.35 2.04.35 2.97 0 7.28-2.73 14.46-8.19 21.55-5.46 7.09-12.27 11.47-20.43 13.14-.05-.8-.05-1.93-.05-3.4z" />
            </svg>
            <span>متابعة بواسطة Apple (قريباً)</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="pt-3 border-t border-slate-800 text-center text-xs space-y-3">
          <div className="text-slate-400">
            <span>معندكش حساب؟ </span>
            <Link href="/customer/register" className="font-extrabold text-brand-sky hover:underline">
              سجل دلوقتي
            </Link>
          </div>

          <div>
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1 font-semibold"
            >
              <ArrowRight className="w-3.5 h-3.5" /> العودة للتطبيق الرئيسي
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomerLoginPage() {
  return (
    <AuthShell dir="rtl">
      <Suspense fallback={<div className="text-center text-slate-400 text-xs">جاري تحميل واجهة الدخول...</div>}>
        <CustomerLoginForm />
      </Suspense>
    </AuthShell>
  )
}

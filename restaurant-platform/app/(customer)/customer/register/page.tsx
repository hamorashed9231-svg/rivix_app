"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Utensils,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { AuthShell } from "@/components/auth/AuthShell"

export default function CustomerRegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePhone = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return "رقم الهاتف إجباري"
    }
    const egyptPhoneRegex = /^01\d{9}$/
    if (!egyptPhoneRegex.test(trimmed)) {
      return "رقم الهاتف يجب أن يكون رقم مصري مكون من 11 رقم ويبدأ بـ 01 (مثال: 01012345678)"
    }
    return ""
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPhone(val)
    if (phoneError) {
      setPhoneError(validatePhone(val))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate phone number before submitting
    const phoneValError = validatePhone(phone)
    if (phoneValError) {
      setPhoneError(phoneValError)
      return
    }
    setPhoneError("")
    setLoading(true)

    try {
      // 1. Create Customer Account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إنشاء الحساب")
        setLoading(false)
        return
      }

      // 2. Automatically Sign In on Success
      const signInRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        // Fallback redirect to login page
        router.push("/customer/login?registered=true")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر")
      setLoading(false)
    }
  }

  return (
    <AuthShell dir="rtl">
      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        {/* Header */}
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
              حساب جديد ✨
            </h1>
            <p className="text-xs text-slate-400">
              انضم إلى منصة <span className="text-brand-sky font-bold">RIVIX</span> واستمتع بطلب الطعام بأسرع طريقة
            </p>

            {/* Title Accent Line */}
            <div className="flex items-center justify-center gap-2 pt-1.5">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-sky/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-sky shadow-[0_0_8px_#2196F3]" />
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-sky/50" />
            </div>
          </div>
        </div>

        {/* Card Wrapper */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Error Alert */}
          {error && (
            <div className="rounded-2xl bg-brand-danger/10 border border-brand-danger/30 p-4 text-xs text-brand-danger font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                  الاسم بالكامل <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-brand-sky">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 pr-11 pl-4 py-3.5 text-xs text-white placeholder-slate-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                  رقم الهاتف (مصري) <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-brand-sky">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="01012345678"
                    className={`w-full rounded-2xl bg-slate-950 border pr-11 pl-4 py-3.5 text-xs text-white placeholder-slate-500 focus:ring-1 outline-none transition-all dir-ltr text-right ${
                      phoneError
                        ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger"
                        : "border-slate-800 focus:border-brand-sky focus:ring-brand-sky"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1.5 text-[11px] text-brand-danger font-medium px-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                  البريد الإلكتروني <span className="text-brand-danger">*</span>
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

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1.5 px-1">
                  كلمة المرور <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-brand-sky">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
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
              {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب الآن 🚀"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="pt-3 border-t border-slate-800 text-center text-xs space-y-3">
            <div className="text-slate-400">
              <span>عندك حساب بالفعل؟ </span>
              <Link href="/customer/login" className="font-extrabold text-brand-sky hover:underline">
                سجل دخول
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
    </AuthShell>
  )
}

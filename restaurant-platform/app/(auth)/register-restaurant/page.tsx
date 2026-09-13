"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  Utensils,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react"

export default function RegisterRestaurantPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

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

    const pErr = validatePhone(phone)
    if (pErr) {
      setPhoneError(pErr)
      return
    }
    setPhoneError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register-restaurant-owner", {
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
        setError(data.error || "حدث خطأ أثناء إرسال طلب الانضمام")
      } else {
        setSuccessMessage(data.message)
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-brand-navy">
      {/* Form Section (Left column in desktop RTL) */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-12 bg-brand-navy">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-sky/10 border border-brand-sky/20 text-brand-sky mb-2">
              <Utensils className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-brand-white tracking-tight">RIVIX</h1>
            <p className="text-xs text-brand-gray-400">Restaurant Owner Portal</p>
          </div>

          {/* Main Form or Success Card */}
          <div className="rounded-3xl bg-brand-navy/90 border border-brand-sky/20 p-8 shadow-2xl backdrop-blur-xl space-y-6 text-brand-white">
            {successMessage ? (
              /* Success State Card */
              <div className="text-center space-y-5 py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-sky/10 border-2 border-brand-sky/30 text-brand-sky shadow-xl shadow-brand-sky/20">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-brand-sky" />
                    <span>تم استقبال طلبك بنجاح</span>
                  </div>

                  <h2 className="text-2xl font-black tracking-tight text-brand-white pt-2">
                    طلب الحساب قيد المراجعة 📋
                  </h2>

                  <p className="text-xs text-brand-gray-300 leading-relaxed px-2">
                    {successMessage}
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-gray-800">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-brand-gray-900 border border-brand-gray-800 hover:bg-brand-gray-800 text-brand-white font-bold text-xs transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" /> العودة لصفحة تسجيل الدخول
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
                <div className="space-y-1.5 text-center lg:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold">
                    <Store className="w-3.5 h-3.5" />
                    <span>انضم كصاحب مطعم</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-brand-white pt-1">
                    إنشاء حساب صاحب مطعم 🏢
                  </h2>
                  <p className="text-xs text-brand-gray-400">
                    أدخل بياناتك للتسجيل وسيقوم فريق المنصة بمراجعة وتفعيل حسابك
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-brand-danger/10 border border-brand-danger/30 p-3.5 text-xs text-brand-danger font-bold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                        اسم صاحب المطعم <span className="text-brand-danger">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-sky">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl bg-brand-gray-900/80 border border-brand-gray-800 pr-10 pl-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                          placeholder="مثال: د. أحمد فؤاد"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                        رقم الهاتف المحمول (مصري) <span className="text-brand-danger">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-sky">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={handlePhoneChange}
                          className={`w-full rounded-xl bg-brand-gray-900/80 border pr-10 pl-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:ring-1 outline-none transition-all dir-ltr text-right ${
                            phoneError
                              ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger"
                              : "border-brand-gray-800 focus:border-brand-sky focus:ring-brand-sky"
                          }`}
                          placeholder="01012345678"
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
                      <label htmlFor="email" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                        البريد الإلكتروني <span className="text-brand-danger">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-sky">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl bg-brand-gray-900/80 border border-brand-gray-800 pr-10 pl-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky focus:ring-1 focus:ring-brand-sky outline-none transition-all"
                          placeholder="owner@restaurant.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                        كلمة المرور <span className="text-brand-danger">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-sky">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
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
                    {loading ? "جاري تقديم الطلب..." : "تقديم طلب الانضمام الآن 🚀"}
                  </Button>
                </form>

                {/* Footer Navigation */}
                <div className="text-center text-xs text-brand-gray-400 pt-3 border-t border-brand-gray-800 flex items-center justify-between">
                  <Link
                    href="/login"
                    className="hover:text-brand-sky transition-colors flex items-center gap-1 font-semibold"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> عندك حساب بالفعل؟ سجل دخول
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Branding Section (Right column in Desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-navy via-[#0e224e] to-brand-sky relative overflow-hidden border-r border-brand-sky/10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-navy/60 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-white/10 backdrop-blur-md border border-brand-white/20 text-brand-white">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-white tracking-tight">RIVIX</h2>
            <p className="text-[10px] text-brand-sky-light font-mono">RESTAURANT OWNER NETWORK</p>
          </div>
        </div>

        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-white/10 backdrop-blur-md border border-brand-white/20 text-brand-sky-light text-xs font-bold">
            <Sparkles className="w-4 h-4 text-brand-sky-light" />
            <span>انضم لأقوى شبكة مطاعم في المنصة</span>
          </div>

          <h1 className="text-4xl font-extrabold text-brand-white leading-tight">
            وسع نطاق عملك وحقق <br />
            <span className="text-brand-sky-light">أعلى نسبة مبيعات يومية</span>
          </h1>

          <p className="text-sm text-brand-gray-300 leading-relaxed">
            منصة Rivix توفر لك أدوات التشغيل الرقمي المتقدمة، متابعة الفروع، إدارة المنيو الديناميكي،
            واستقبال أوردرات العملاء بأعلى سرعة وأقل تكلفة تشغيل.
          </p>
        </div>

        <div className="relative z-10 text-xs text-brand-gray-400">
          © {new Date().getFullYear()} Rivix Platform. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  Store,
  Palette,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function NewRestaurantPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugCustomized, setIsSlugCustomized] = useState(false)
  const [logo, setLogo] = useState("")
  const [description, setDescription] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2196F3")
  const [secondaryColor, setSecondaryColor] = useState("#0A1A3C")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!isSlugCustomized) {
      setSlug(generateSlug(val) || val.trim().toLowerCase().replace(/\s+/g, "-"))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          logo,
          description,
          primaryColor,
          secondaryColor,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إنشاء المطعم")
      } else {
        setSuccess("تم إرسال طلب إنشاء المطعم بنجاح! جاري التوجيه...")
        setTimeout(() => {
          router.push("/dashboard/restaurant")
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6 pb-24 text-brand-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-brand-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة التحكم
          </Link>
          <h1 className="text-2xl font-black text-brand-white flex items-center gap-2">
            <Store className="w-6 h-6 text-brand-sky" /> إضافة مطعم جديد
          </h1>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-xs font-bold font-mono">
          RIVIX BRANDING
        </span>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="rounded-xl bg-brand-danger/10 border border-brand-danger/30 p-4 text-xs text-brand-danger font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-brand-success/10 border border-brand-success/30 p-4 text-xs text-brand-success font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-brand-navy/90 border border-brand-sky/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-brand-white border-b border-brand-gray-800 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-sky" /> البيانات الأساسية للمطعم
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                اسم المطعم <span className="text-brand-danger">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="مثال: مطعم أبو طارق للكشري"
                className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-xs font-bold text-brand-gray-300 mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-brand-sky" /> الرابط المختصر (Slug)
              </label>
              <input
                id="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setIsSlugCustomized(true)
                }}
                placeholder="koshary-abo-tarek"
                className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white dir-ltr text-left placeholder-brand-gray-500 focus:border-brand-sky outline-none transition-all font-mono"
              />
              <p className="text-[10px] text-brand-gray-400 mt-1">
                سيكون الرابط: /restaurant/{slug || "slug-name"}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
              وصف قصير عن المطعم (اختياري)
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أشهر المأكولات الشعبية والمشويات الطازجة..."
              className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 2: Logo */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-brand-white border-b border-brand-gray-800 pb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-sky" /> شعار المطعم (Logo)
          </h2>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-gray-900 border-2 border-dashed border-brand-gray-700 flex items-center justify-center overflow-hidden shrink-0 relative">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-brand-gray-500" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="logo-file" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-sky/10 border border-brand-sky/30 text-brand-sky hover:bg-brand-sky/20 text-xs font-bold cursor-pointer transition-all">
                <ImageIcon className="w-4 h-4" /> رفع صورة اللوجو
                <input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-brand-gray-400">
                اختر صورة بدقة جيدة (PNG/JPG). سيتم حفظها محلياً مؤقتاً.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Dynamic Branding & Colors */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-brand-white border-b border-brand-gray-800 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-sky" /> الهوية البصرية والألوان (Dynamic Branding)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Color */}
            <div className="p-4 rounded-2xl bg-brand-gray-900/60 border border-brand-gray-800 space-y-2">
              <label htmlFor="primaryColor" className="block text-xs font-bold text-brand-gray-300">
                اللون الأساسي (Primary Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-28 rounded-lg bg-brand-gray-900 border border-brand-gray-800 px-3 py-1.5 text-xs text-brand-white dir-ltr font-mono text-center outline-none"
                />
              </div>
              <p className="text-[10px] text-brand-gray-400">
                يستخدم لتمييز الأزرار والهيدر الرئيسي لصفحتك.
              </p>
            </div>

            {/* Secondary Color */}
            <div className="p-4 rounded-2xl bg-brand-gray-900/60 border border-brand-gray-800 space-y-2">
              <label htmlFor="secondaryColor" className="block text-xs font-bold text-brand-gray-300">
                اللون الثانوي (Secondary Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-28 rounded-lg bg-brand-gray-900 border border-brand-gray-800 px-3 py-1.5 text-xs text-brand-white dir-ltr font-mono text-center outline-none"
                />
              </div>
              <p className="text-[10px] text-brand-gray-400">
                يستخدم لخلفية الأطراف والتمييزات الثانوية.
              </p>
            </div>
          </div>

          {/* Color Live Preview Card */}
          <div className="mt-4 p-4 rounded-2xl border space-y-2" style={{ backgroundColor: secondaryColor, borderColor: primaryColor }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray-300">معاينة فورية لطابع المطعم</span>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">{name || "اسم مطعمك هنا"}</h3>
              <button
                type="button"
                className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                زر المنيو
              </button>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full text-sm font-extrabold shadow-lg shadow-brand-sky/20 cursor-pointer"
          >
            {loading ? "جاري الإنشاء..." : "حفظ وإنشاء المطعم 🚀"}
          </Button>
        </div>
      </form>
    </div>
  )
}

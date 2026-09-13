"use client"

import React, { useState } from "react"
import { Star, X, CheckCircle2, ThumbsUp, UtensilsCrossed, Truck, MessageSquare } from "lucide-react"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  restaurantName: string
  onSubmitted?: () => void
}

export function ReviewModal({
  isOpen,
  onClose,
  orderId,
  restaurantName,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [foodRating, setFoodRating] = useState(5)
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const quickTags = [
    "طعام ساخن ♨️",
    "توصيل سريع ⚡️",
    "تغليف ممتاز 📦",
    "طعم رائع 😋",
    "خدمة ممتازة ⭐",
    "أطعم تجربة 🔥",
  ]

  const handleAddTag = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev} - ${tag}` : tag))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          foodRating,
          deliveryRating,
          comment,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء إرسال التقييم")
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSubmitted) onSubmitted()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0B192C] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl shadow-cyan-500/10 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            تقييم الطلب التجريبي
          </span>
          <h2 className="text-xl font-black text-white">تقييم تجربتك مع {restaurantName}</h2>
          <p className="text-xs text-slate-400">رأيك يهمنا ويساعدنا في تحسين جودة الخدمة دائماً</p>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-white">تم إرسال التقييم بنجاح!</h3>
            <p className="text-xs text-slate-400">شكراً لك على تقييم التجربة 🌟</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-bold">
                {error}
              </div>
            )}

            {/* Overall Rating Stars */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <label className="text-xs font-extrabold text-slate-200 block">التقييم العام للتجربة</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                          : "text-slate-700 fill-slate-900"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400 block mt-1">
                {rating === 5 && "ممتاز جداً! 🌟🌟🌟🌟🌟"}
                {rating === 4 && "جيد جداً 👍"}
                {rating === 3 && "مقبول 😐"}
                {rating === 2 && "ضعيف 👎"}
                {rating === 1 && "سيء جداً ❌"}
              </span>
            </div>

            {/* Specific Ratings: Food & Delivery */}
            <div className="grid grid-cols-2 gap-3">
              {/* Food Rating */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-center">
                <span className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-cyan-400" /> جودة الوجبة
                </span>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFoodRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          foodRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Rating */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-center">
                <span className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" /> سرعة التوصيل
                </span>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDeliveryRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          deliveryRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Feedback Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block">عبارات سريعة لإضافتها:</label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> ملاحظاتك وتعليقك التفصيلي (اختياري)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : "إرسال التقييم الآن 🌟"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

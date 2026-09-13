"use client"

import React, { useState, useEffect } from "react"
import { Star, MessageSquare, ShieldCheck, UtensilsCrossed, Truck, ThumbsUp } from "lucide-react"

interface Review {
  id: string
  rating: number
  foodRating: number
  deliveryRating: number
  comment?: string | null
  createdAt: string
  user: {
    name: string
  }
}

interface RestaurantReviewsSectionProps {
  restaurantId: string
}

export function RestaurantReviewsSection({ restaurantId }: RestaurantReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCount: 0,
    averageRating: 5.0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })

  useEffect(() => {
    fetchReviews()
  }, [restaurantId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reviews?restaurantId=${restaurantId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setStats({
          totalCount: data.totalCount || 0,
          averageRating: data.averageRating || 5.0,
          ratingCounts: data.ratingCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        })
      }
    } catch (e) {
      console.error("Failed to fetch reviews:", e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#0B192C] border border-slate-800 rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-slate-900 rounded-2xl" />
        <div className="h-32 bg-slate-900 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="bg-[#0B192C] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> تقييمات وآراء العملاء (Customer Reviews)
        </h3>
        <span className="text-xs text-slate-400 font-mono">إجمالي التقييمات: {stats.totalCount}</span>
      </div>

      {/* Overview Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        {/* Left: Main Score */}
        <div className="text-center md:border-l md:border-slate-800 flex flex-col items-center justify-center space-y-1">
          <span className="text-4xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            {stats.averageRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  Math.round(stats.averageRating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium mt-1">بناءً على {stats.totalCount} طلبات مؤكدة</span>
        </div>

        {/* Middle: Rating Distribution Bars */}
        <div className="space-y-1.5 justify-center flex flex-col col-span-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (stats.ratingCounts as any)[star] || 0
            const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : star === 5 ? 100 : 0
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-300 flex items-center gap-1">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-slate-500 text-end font-mono text-[11px]">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
            <p>لا توجد تقييمات مكتوبة لهذا المطعم بعد. كن أول من يضع تقييمه!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-xs">
                    {review.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{review.user.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> مشتري مؤكد
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {new Date(review.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-white">{review.rating}.0</span>
                </div>
              </div>

              {review.comment && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

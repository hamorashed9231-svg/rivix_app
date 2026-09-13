"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Check, X, Ban, ExternalLink, AlertCircle } from "lucide-react"

interface RestaurantItem {
  id: string
  name: string
  slug: string
  logo: string | null
  status: "pending" | "active" | "suspended"
  createdAt: string | Date
  owner: {
    name: string
    email: string
  }
}

export function RestaurantApprovalTable({
  initialRestaurants,
}: {
  initialRestaurants: RestaurantItem[]
}) {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>(initialRestaurants)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  const handleUpdateStatus = async (id: string, newStatus: "active" | "suspended" | "pending") => {
    setLoadingId(id)
    setError("")

    try {
      const res = await fetch(`/api/admin/restaurants/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء تحديث حالة المطعم")
      } else {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        )
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-brand-danger/10 border border-brand-danger/30 p-3.5 text-xs text-brand-danger font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl bg-brand-navy/90 border border-brand-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-brand-gray-900/80 text-brand-gray-400 font-bold border-b border-brand-gray-800">
              <tr>
                <th className="p-4">اسم المطعم والرابط</th>
                <th className="p-4">صاحب المطعم (Owner)</th>
                <th className="p-4">الحالة الحالية</th>
                <th className="p-4">تاريخ الانضمام</th>
                <th className="p-4 text-center">إجراءات الترخيص والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-800/60">
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-gray-400">
                    لا توجد مطاعم مسجلة حالياً.
                  </td>
                </tr>
              ) : (
                restaurants.map((res) => {
                  const isLoading = loadingId === res.id

                  const statusStyles = {
                    pending: "bg-brand-warning/10 text-brand-warning border-brand-warning/30",
                    active: "bg-brand-success/10 text-brand-success border-brand-success/30",
                    suspended: "bg-brand-danger/10 text-brand-danger border-brand-danger/30",
                  }

                  const statusLabels = {
                    pending: "قيد المراجعة ⏳",
                    active: "نشط ومعتمد ✅",
                    suspended: "معلق ⛔",
                  }

                  return (
                    <tr key={res.id} className="hover:bg-brand-gray-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-gray-900 border border-brand-gray-800 flex items-center justify-center font-bold text-brand-sky overflow-hidden shrink-0">
                            {res.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={res.logo} alt={res.name} className="w-full h-full object-cover" />
                            ) : (
                              res.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-brand-white text-sm">{res.name}</div>
                            {res.slug && (
                              <Link
                                href={`/restaurant/${res.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-[11px] text-brand-sky hover:underline mt-0.5"
                              >
                                <span>/restaurant/{res.slug}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-brand-gray-300">
                        <div className="font-bold text-brand-white">{res.owner.name}</div>
                        <div className="text-[10px] text-brand-gray-500 font-mono">{res.owner.email}</div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl font-bold border text-[11px] ${
                            statusStyles[res.status] || "bg-brand-gray-800 text-brand-white"
                          }`}
                        >
                          {statusLabels[res.status] || res.status}
                        </span>
                      </td>

                      <td className="p-4 text-brand-gray-400 font-mono dir-ltr text-right">
                        {new Date(res.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {res.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={isLoading}
                                onClick={() => handleUpdateStatus(res.id, "active")}
                                className="bg-brand-success hover:bg-brand-success/90 border-0 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 ml-1" /> قبول وترخيص
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                isLoading={isLoading}
                                onClick={() => handleUpdateStatus(res.id, "suspended")}
                                className="cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 ml-1" /> رفض الطلب
                              </Button>
                            </>
                          )}

                          {res.status === "active" && (
                            <Button
                              size="sm"
                              variant="danger"
                              isLoading={isLoading}
                              onClick={() => handleUpdateStatus(res.id, "suspended")}
                              className="bg-brand-warning hover:bg-brand-warning/90 text-brand-navy border-0 font-extrabold cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5 ml-1" /> تعليق الحساب
                            </Button>
                          )}

                          {res.status === "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={isLoading}
                              onClick={() => handleUpdateStatus(res.id, "active")}
                              className="cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 ml-1" /> إعادة تفعيل
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

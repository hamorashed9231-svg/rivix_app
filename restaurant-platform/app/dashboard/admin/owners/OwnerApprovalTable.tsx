"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Check, X, Clock, ShieldCheck, User, Phone, Mail, Calendar, AlertCircle } from "lucide-react"

interface OwnerUser {
  id: string
  name: string
  email: string
  phone: string | null
  accountStatus: "approved" | "pending" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

interface OwnerApprovalTableProps {
  pendingOwners: OwnerUser[]
  recentOwners: OwnerUser[]
}

export function OwnerApprovalTable({
  pendingOwners,
  recentOwners,
}: OwnerApprovalTableProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleUpdateStatus = async (
    userId: string,
    newStatus: "approved" | "rejected"
  ) => {
    setError("")
    setUpdatingId(userId)

    try {
      const res = await fetch(`/api/admin/owners/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء تغيير حالة الحساب")
      } else {
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-400 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">طلبات أصحاب المطاعم المعلقة</h2>
              <p className="text-xs text-slate-400">
                حسابات بانتظار موافقة الإدارة لبدء تفعيل واستخدام المنصة
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            {pendingOwners.length} طلب معلق
          </span>
        </div>

        {pendingOwners.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400 text-xs">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
            <p className="font-semibold">لا توجد طلبات معلقة حالياً</p>
            <p className="text-[11px] text-slate-500 mt-1">جميع طلبات أصحاب المطاعم تمت معالجتها</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">صاحب المطعم</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">تاريخ التسجيل</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
                {pendingOwners.map((owner) => {
                  const isLoading = updatingId === owner.id
                  return (
                    <tr key={owner.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <span>{owner.name}</span>
                        </div>
                      </td>
                      <td className="p-4 dir-ltr text-right">
                        <div className="flex items-center gap-1.5 justify-end text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{owner.email}</span>
                        </div>
                      </td>
                      <td className="p-4 dir-ltr text-right">
                        {owner.phone ? (
                          <div className="flex items-center gap-1.5 justify-end text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{owner.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">غير محدد</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(owner.createdAt).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            isLoading={isLoading}
                            onClick={() => handleUpdateStatus(owner.id, "approved")}
                            className="px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>قبول</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            isLoading={isLoading}
                            onClick={() => handleUpdateStatus(owner.id, "rejected")}
                            className="px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Processed Accounts History Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">سجل الحسابات المعالجة مؤخراً</h2>
            <p className="text-xs text-slate-400">آخر 10 طلبات تمت الموافقة عليها أو رفضها</p>
          </div>
        </div>

        {recentOwners.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 text-center text-slate-500 text-xs">
            لا يوجد سجل للحسابات المعالجة سابقاً
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">صاحب المطعم</th>
                  <th className="p-3.5">البريد الإلكتروني</th>
                  <th className="p-3.5">رقم الهاتف</th>
                  <th className="p-3.5 text-center">الحالة الحالية</th>
                  <th className="p-3.5 text-center">الإجراء المتاح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 font-medium">
                {recentOwners.map((owner) => {
                  const isLoading = updatingId === owner.id
                  const isApproved = owner.accountStatus === "approved"
                  return (
                    <tr key={owner.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-white">{owner.name}</td>
                      <td className="p-3.5 dir-ltr text-right text-slate-400">{owner.email}</td>
                      <td className="p-3.5 dir-ltr text-right text-slate-400">{owner.phone || "—"}</td>
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <Check className="w-3 h-3" /> مقبول
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                            <X className="w-3 h-3" /> مرفوض
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isApproved ? (
                          <Button
                            size="sm"
                            variant="danger"
                            isLoading={isLoading}
                            onClick={() => handleUpdateStatus(owner.id, "rejected")}
                            className="px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                          >
                            تغيير إلى مرفوض
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            isLoading={isLoading}
                            onClick={() => handleUpdateStatus(owner.id, "approved")}
                            className="px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                          >
                            تغيير إلى مقبول
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

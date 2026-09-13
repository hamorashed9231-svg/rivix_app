"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Ban,
  Check,
  Mail,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react"

interface StaffItem {
  id: string
  staffRole: "manager" | "staff"
  isActive: boolean
  createdAt: string | Date
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

interface StaffManagementClientProps {
  restaurantId: string
  restaurantName: string
  initialStaff: StaffItem[]
}

export function StaffManagementClient({
  restaurantId,
  restaurantName,
  initialStaff,
}: StaffManagementClientProps) {
  const router = useRouter()
  const [staffList, setStaffList] = useState<StaffItem[]>(initialStaff)
  const [email, setEmail] = useState("")
  const [staffRole, setStaffRole] = useState<"manager" | "staff">("staff")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), staffRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إضافة الموظف")
      } else {
        setSuccess("تم إضافة الموظف لطاقم المطعم بنجاح! 🎉")
        setEmail("")
        setStaffList((prev) => [data.staff, ...prev])
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    setActionLoadingId(staffId)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء تحديث حالة الموظف")
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, isActive: !currentStatus } : s))
        )
        setSuccess(`تم ${!currentStatus ? "تفعيل" : "تعطيل"} حساب الموظف بنجاح`)
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء تحديث الموظف")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm("هل أنت تأكد من إزالة هذا الموظف من طاقم العمل؟")) return

    setActionLoadingId(staffId)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/staff/${staffId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إزالة الموظف")
      } else {
        setStaffList((prev) => prev.filter((s) => s.id !== staffId))
        setSuccess("تم إزالة الموظف من الطاقم بنجاح")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الحذف")
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-8 text-brand-white">
      {/* Alert Messages */}
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

      {/* Add New Staff Form */}
      <div className="bg-brand-navy/90 border border-brand-sky/20 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <h2 className="text-base font-bold text-brand-white flex items-center gap-2 border-b border-brand-gray-800 pb-3">
          <UserPlus className="w-5 h-5 text-brand-sky" /> إضافة موظف جديد لطاقم {restaurantName}
        </h2>

        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="staff-email" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
              البريد الإلكتروني للموظف <span className="text-brand-danger">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="staff-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 pr-10 pl-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-brand-gray-400 mt-1">
              يجب أن يملك الموظف حساباً مسجلاً بالفعل بالنظام.
            </p>
          </div>

          <div>
            <label htmlFor="staff-role" className="block text-xs font-bold text-brand-gray-300 mb-1.5">
              دور وصلاحيات الموظف <span className="text-brand-danger">*</span>
            </label>
            <select
              id="staff-role"
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as "manager" | "staff")}
              className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white outline-none focus:border-brand-sky transition-all"
            >
              <option value="staff">موظف تشغيل (Staff) — إدارة الطلبات فقط</option>
              <option value="manager">مدير مطعم (Manager) — إدارة شاملة للمنيو والطلبات والموظفين</option>
            </select>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full text-xs font-extrabold cursor-pointer py-3"
            >
              إضافة الموظف الآن ➕
            </Button>
          </div>
        </form>
      </div>

      {/* Staff Members List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-brand-gray-800 pb-2">
          <h2 className="text-base font-bold text-brand-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-sky" /> قائمة طاقم العمل الحالي ({staffList.length})
          </h2>
        </div>

        <div className="rounded-2xl bg-brand-navy/90 border border-brand-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-brand-gray-900/80 text-brand-gray-400 font-bold border-b border-brand-gray-800">
                <tr>
                  <th className="p-4">اسم الموظف</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">الدور والمستوى</th>
                  <th className="p-4">حالة الحساب</th>
                  <th className="p-4 text-center">التحكم والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-800/60">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-brand-gray-400">
                      لا يوجد موظفون مضافون لطاقم هذا المطعم بعد.
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => {
                    const isActionLoading = actionLoadingId === staff.id

                    return (
                      <tr key={staff.id} className="hover:bg-brand-gray-900/40 transition-colors">
                        <td className="p-4 font-extrabold text-brand-white flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand-sky/10 border border-brand-sky/30 text-brand-sky flex items-center justify-center font-bold">
                            {staff.user.name.charAt(0)}
                          </div>
                          <span>{staff.user.name}</span>
                        </td>

                        <td className="p-4 text-brand-gray-300 font-mono">{staff.user.email}</td>

                        <td className="p-4">
                          {staff.staffRole === "manager" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" /> مدير مطعم (Manager)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-sky/10 border border-brand-sky/30 text-brand-sky font-bold text-[11px]">
                              <UserCheck className="w-3.5 h-3.5" /> موظف (Staff)
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {staff.isActive ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-success/10 border border-brand-success/30 text-brand-success font-bold text-[11px]">
                              مفعل ✅
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-danger/10 border border-brand-danger/30 text-brand-danger font-bold text-[11px]">
                              معطل ⛔
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant={staff.isActive ? "danger" : "outline"}
                              isLoading={isActionLoading}
                              onClick={() => handleToggleActive(staff.id, staff.isActive)}
                              className="cursor-pointer"
                            >
                              {staff.isActive ? (
                                <>
                                  <Ban className="w-3.5 h-3.5 ml-1" /> تعطيل
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 ml-1" /> تفعيل
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={isActionLoading}
                              onClick={() => handleRemoveStaff(staff.id)}
                              className="text-brand-danger hover:bg-brand-danger/10 cursor-pointer"
                              title="إزالة الموظف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
    </div>
  )
}

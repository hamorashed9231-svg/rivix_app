"use client"

import React, { useState } from "react"
import Button from "@/components/ui/Button"
import { BranchForm, BranchData } from "@/components/restaurant/BranchForm"
import {
  GitFork,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react"

export interface BranchWithCounts extends BranchData {
  id: string
  name: string
  _count?: {
    orders: number
    menuCategories: number
  }
}

interface BranchesClientProps {
  restaurantId: string
  initialBranches: BranchWithCounts[]
}

export function BranchesClient({
  restaurantId,
  initialBranches,
}: BranchesClientProps) {
  const [branches, setBranches] = useState<BranchWithCounts[]>(initialBranches)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchWithCounts | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setEditingBranch(null)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (branch: BranchWithCounts) => {
    setEditingBranch(branch)
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBranch(null)
  }

  const handleFormSuccess = (savedBranch: BranchWithCounts) => {
    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) => (b.id === savedBranch.id ? { ...b, ...savedBranch } : b))
      )
    } else {
      setBranches((prev) => [...prev, savedBranch])
    }
    handleCloseModal()
  }

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (!confirm(`هل أنت تأكد من رغبتك في حذف ${branchName}؟`)) return

    setErrorMsg(null)

    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "فشل حذف الفرع")
      }

      setBranches((prev) => prev.filter((b) => b.id !== branchId))
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء حذف الفرع")
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B192C] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" /> فروع المطعم المسجلة
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة كافة فروع مطعمك، تحديث مواقعهم الجغرافي وحالة العمل.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAddModal}
          className="shrink-0"
        >
          <Plus className="w-4 h-4" /> إضافة فرع جديد
        </Button>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Branch Cards Grid */}
      {branches.length === 0 ? (
        <div className="text-center py-16 bg-[#0B192C] border border-dashed border-slate-800 rounded-2xl">
          <GitFork className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-bold text-base">لا يوجد أي فروع مضافة حالياً</p>
          <p className="text-slate-400 text-xs mt-1">قم بإضافة فرعك الأول لبدء استقبال الطلبات.</p>
          <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="mt-4">
            إضافة فرع الآن
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {branches.map((branch) => {
            const hours: any = branch.openingHours || {}
            return (
              <div
                key={branch.id}
                className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">
                          {branch.name || branch.address || "فرع جديد"}
                        </h3>
                        <p className="text-[11px] text-slate-400">{branch.address}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        branch.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {branch.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {branch.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  {/* Branch Details */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        الهاتف: <strong className="text-white font-mono dir-ltr inline-block">{branch.phone}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        ساعات العمل:{" "}
                        <strong className="text-white">
                          {hours.open || "10:00 AM"} - {hours.close || "12:00 AM"}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-mono text-slate-400">
                        الإحداثيات: Lat {branch.lat.toFixed(4)}, Lng {branch.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Counts and Action Buttons */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 space-x-3 space-x-reverse">
                    <span>
                      الطلبات:{" "}
                      <strong className="text-cyan-400 font-bold">
                        {branch._count?.orders ?? 0}
                      </strong>
                    </span>
                    <span>
                      التصنيفات:{" "}
                      <strong className="text-cyan-400 font-bold">
                        {branch._count?.menuCategories ?? 0}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(branch)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> تعديل
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handleDeleteBranch(
                          branch.id,
                          branch.name || branch.address
                        )
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-cyan-400" />
                {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BranchForm
              restaurantId={restaurantId}
              initialData={editingBranch}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}

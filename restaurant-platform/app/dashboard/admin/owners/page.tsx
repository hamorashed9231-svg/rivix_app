import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AccountStatus, Role } from "@prisma/client"
import { OwnerApprovalTable } from "./OwnerApprovalTable"
import { ShieldCheck, UserCheck } from "lucide-react"

export default async function AdminOwnerApprovalsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard/restaurant")
  }

  // Fetch all pending owner accounts
  const pendingOwners = await prisma.user.findMany({
    where: {
      role: Role.restaurant_owner,
      accountStatus: AccountStatus.pending,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Fetch recent approved/rejected owner accounts (last 10)
  const recentOwners = await prisma.user.findMany({
    where: {
      role: Role.restaurant_owner,
      accountStatus: {
        in: [AccountStatus.approved, AccountStatus.rejected],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-black text-white">طلبات وموافقات أصحاب المطاعم</h1>
          </div>
          <p className="text-xs text-slate-400">
            راجع واعتمد حسابات أصحاب المطاعم الجدد للسماح لهم بالوصول للوحة التحكم وإنشاء مطاعمهم
          </p>
        </div>
      </div>

      {/* Main Approval Table Client Component */}
      <OwnerApprovalTable
        pendingOwners={pendingOwners}
        recentOwners={recentOwners}
      />
    </div>
  )
}

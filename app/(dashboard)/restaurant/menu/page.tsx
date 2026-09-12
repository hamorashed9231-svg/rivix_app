import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MenuManager } from "./MenuManager"

export default async function MenuPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "restaurant_owner") {
    redirect("/login")
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: {
      branches: {
        include: {
          menuCategories: {
            include: { items: true },
            orderBy: { order: "asc" }
          }
        }
      }
    }
  })

  if (!restaurant || restaurant.branches.length === 0) {
    return (
      <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-white">لم يتم العثور على فروع للمطعم</h2>
        <p className="text-sm text-slate-400 mt-2">يرجى إضافة فرع أولاً من صفحة الفروع لتتمكن من إضافة أصناف المنيو.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة المنيو والتصنيفات (Menu Builder)</h1>
        <p className="text-sm text-slate-400 mt-1">إضافة التصنيفات، أصناف المأكولات، التحكم بالأسعار وتوفر الأصناف الفوري.</p>
      </div>

      <MenuManager branches={restaurant.branches} />
    </div>
  )
}

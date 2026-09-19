import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, ArrowRight, Store, ShieldAlert } from "lucide-react"
import { CustomerMessagesClient } from "./CustomerMessagesClient"

export default async function CustomerMessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Find restaurant associated with user (owner or staff)
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
  })

  if (!restaurant) {
    const staffRecord = await prisma.restaurantStaff.findFirst({
      where: { userId: user.id, isActive: true },
      select: { restaurantId: true },
    })

    if (staffRecord) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: staffRecord.restaurantId },
      })
    }
  }

  if (!restaurant) {
    redirect("/dashboard/restaurant")
  }

  // 2. Recipient scoping check: Exclude true owner account from customer messages inbox
  const isTrueOwner = restaurant.ownerId === user.id || user.role === "restaurant_owner"
  const access = await getRestaurantAccess(user.id, restaurant.id)

  // Only manager, staff (or admin) can manage customer messages
  if (isTrueOwner) {
    return (
      <div className="space-y-6 text-brand-white">
        <div className="flex items-center gap-2 border-b border-brand-gray-800 pb-4">
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">صندوق رسائل العملاء مخصص لطاقم العمل والمدير</h2>
          <p className="text-sm text-brand-gray-300">
            وفقًا لسياسة النطاق والخصوصية، يتم تلقي رسائل العملاء ومتابعتها بواسطة المدير وطاقم العمل بالمطعم فقط، وتُستبعد من حساب المالك بشكل مباشر.
          </p>
        </div>
      </div>
    )
  }

  if (access !== "manager" && access !== "staff" && user.role !== "admin") {
    redirect("/dashboard/restaurant")
  }

  // 3. Fetch customer messages for this restaurant
  const initialMessages = await prisma.customerMessage.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 text-brand-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-gray-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-brand-gray-400 hover:text-brand-sky transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
          <h1 className="text-2xl font-black text-brand-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-sky" /> رسائل العملاء وخدمة الدعم
          </h1>
          <p className="text-xs text-brand-gray-400 mt-1">
            مطعم: <span className="font-bold text-brand-white">{restaurant.name}</span>
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold font-mono flex items-center gap-1.5">
          <Store className="w-4 h-4" />
          <span>STAFF & MANAGER INBOX</span>
        </span>
      </div>

      {/* Interactive Messages Client */}
      <CustomerMessagesClient
        restaurantId={restaurant.id}
        initialMessages={initialMessages}
      />
    </div>
  )
}

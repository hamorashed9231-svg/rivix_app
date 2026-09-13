import { getCurrentUser, getRestaurantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckSquare, ArrowRight, Store } from "lucide-react";
import { PaymentVerificationClient } from "./PaymentVerificationClient";

export default async function PaymentVerificationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Find restaurant owned by user or where user is manager/staff
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: { branches: { select: { id: true } } },
  });

  if (!restaurant) {
    const staffRecord = await prisma.restaurantStaff.findFirst({
      where: { userId: user.id, isActive: true },
      select: { restaurantId: true },
    });

    if (staffRecord) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: staffRecord.restaurantId },
        include: { branches: { select: { id: true } } },
      });
    }
  }

  if (!restaurant) {
    redirect("/dashboard/restaurant");
  }

  // 2. Access check: Owner or Manager ONLY
  const access = await getRestaurantAccess(user.id, restaurant.id);
  if (access !== "owner" && access !== "manager" && user.role !== "admin") {
    redirect("/dashboard/restaurant");
  }

  const branchIds = restaurant.branches.map((b) => b.id);

  // 3. Fetch pending verification orders
  const pendingOrders = await prisma.order.findMany({
    where: {
      branchId: { in: branchIds },
      paymentStatus: "pending_verification",
    },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 4. Fetch last 10 reviewed orders (verified or rejected)
  const reviewedOrders = await prisma.order.findMany({
    where: {
      branchId: { in: branchIds },
      paymentStatus: { in: ["verified", "rejected"] },
    },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6 text-brand-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link
            href="/dashboard/restaurant"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة المطعم
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" /> مراجعة إيصالات التحويل اليدوي
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مطعم: <span className="font-bold text-white">{restaurant.name}</span>
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5">
          <Store className="w-4 h-4" />
          <span>PAYMENT VERIFICATION</span>
        </span>
      </div>

      {/* Client Interactive Component */}
      <PaymentVerificationClient
        initialPending={pendingOrders}
        initialReviewed={reviewedOrders}
      />
    </div>
  );
}

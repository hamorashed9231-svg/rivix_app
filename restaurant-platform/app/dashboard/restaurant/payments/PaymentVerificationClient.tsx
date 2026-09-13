"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  FileCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

interface OrderCustomer {
  name: string;
  email: string;
  phone?: string | null;
}

interface OrderItem {
  id: string;
  totalPrice: number;
  paymentMethod: "cash_on_delivery" | "vodafone_cash" | "instapay";
  paymentProofImage?: string | null;
  paymentStatus: "not_required" | "pending_verification" | "verified" | "rejected";
  createdAt: Date | string;
  customer: OrderCustomer;
}

interface PaymentVerificationClientProps {
  initialPending: OrderItem[];
  initialReviewed: OrderItem[];
}

export function PaymentVerificationClient({
  initialPending,
  initialReviewed,
}: PaymentVerificationClientProps) {
  const [pendingOrders, setPendingOrders] = useState<OrderItem[]>(initialPending);
  const [reviewedOrders, setReviewedOrders] = useState<OrderItem[]>(initialReviewed);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: "verified" | "rejected"
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل تحديث حالة التحويل");
      }

      const updatedOrder = await res.json();

      // Remove from pending list
      const targetOrder = pendingOrders.find((o) => o.id === orderId);
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Add to reviewed list
      if (targetOrder) {
        const newlyReviewedItem = { ...targetOrder, paymentStatus: newStatus };
        setReviewedOrders((prev) => [newlyReviewedItem, ...prev.slice(0, 9)]);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء المراجعة");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Modal for full size image preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> إثبات التحويل
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              <img
                src={selectedImage}
                alt="إثبات التحويل"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Section */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> إيصالات بانتظار المراجعة والاعتماد
          </span>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
            {pendingOrders.length} طلبات معلقة
          </span>
        </h2>

        {pendingOrders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">لا توجد تحويلات معلقة للمراجعة حالياً</p>
            <p className="text-xs text-slate-500 mt-1">سيتم إدراج أي طلب جديد يتم الدفع فيه عبر فودافون كاش أو إنستاباي هنا فوراً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">رقم الطلب</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">وسيلة الدفع</th>
                  <th className="px-4 py-3 text-center">إثبات التحويل</th>
                  <th className="px-4 py-3 text-center">المراجعة والقرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-cyan-300">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{order.customer.name}</p>
                      <p className="text-xs text-slate-400 dir-ltr text-right">
                        {order.customer.phone || order.customer.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-bold text-emerald-400">
                      {order.totalPrice} جنيه
                    </td>

                    <td className="px-4 py-4">
                      {order.paymentMethod === "vodafone_cash" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                          <Smartphone className="w-3.5 h-3.5" /> فودافون كاش
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                          <Wallet className="w-3.5 h-3.5" /> إنستاباي
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {order.paymentProofImage ? (
                        <button
                          onClick={() => setSelectedImage(order.paymentProofImage!)}
                          className="relative group inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-colors"
                        >
                          <img
                            src={order.paymentProofImage}
                            alt="إثبات التحويل"
                            className="w-14 h-14 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">لا توجد صورة</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, "verified")}
                          className="bg-emerald-600 hover:bg-emerald-500 shadow-none text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={updatingId === order.id}
                          onClick={() => handleUpdateStatus(order.id, "rejected")}
                          className="text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> رفض
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reviewed Orders History (Last 10) */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> آخر المدفوعات التي تمت مراجعتها
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
            آخر 10 عمليات
          </span>
        </h2>

        {reviewedOrders.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">لم يتم مراجعة أي طلبات إلكترونية بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">رقم الطلب</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">وسيلة الدفع</th>
                  <th className="px-4 py-3 text-center">القرار والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviewedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-cyan-300">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-white">
                      {order.customer.name}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-200">
                      {order.totalPrice} جنيه
                    </td>

                    <td className="px-4 py-3.5">
                      {order.paymentMethod === "vodafone_cash" ? "فودافون كاش" : "إنستاباي"}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {order.paymentStatus === "verified" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> مقبولة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> مرفوضة
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

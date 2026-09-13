"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { CreditCard, Plus, Trash2, CheckCircle2, XCircle, Smartphone, Wallet } from "lucide-react";

interface PaymentNumberItem {
  id: string;
  restaurantId: string;
  label: string;
  type: "vodafone_cash" | "instapay";
  number: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface PaymentNumbersClientProps {
  restaurantId: string;
  initialNumbers: PaymentNumberItem[];
}

export function PaymentNumbersClient({
  restaurantId,
  initialNumbers,
}: PaymentNumbersClientProps) {
  const [numbers, setNumbers] = useState<PaymentNumberItem[]>(initialNumbers);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [numberValue, setNumberValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !numberValue.trim()) {
      setError("يرجى ملء جميع البيانات المطلوب");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/payment-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          type,
          number: numberValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل إضافة رقم الدفع");
      }

      setNumbers([data, ...numbers]);
      setLabel("");
      setNumberValue("");
      setSuccess("تم إضافة رقم وسيلة الدفع بنجاح");
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/payment-numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل تحديث الحالة");
      }

      setNumbers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: !currentStatus } : item))
      );
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تعديل الحالة");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا الرقم؟")) return;

    try {
      const res = await fetch(`/api/payment-numbers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل حذف رقم الدفع");
      }

      setNumbers((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" /> إضافة رقم تحويل جديد
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleAddNumber} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نوع وسيلة التحويل
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("vodafone_cash")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === "vodafone_cash"
                    ? "bg-rose-500/20 border-rose-500 text-rose-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" /> فودافون كاش
              </button>

              <button
                type="button"
                onClick={() => setType("instapay")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === "instapay"
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Wallet className="w-4 h-4" /> إنستاباي InstaPay
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              التسمية التوضيحية (الاسم المكتوب للعميل)
            </label>
            <input
              type="text"
              placeholder="مثال: فودافون كاش الفرع الرئيسي"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الرقم أو اسم الحساب (رقم الهاتف / رابط إنستاباي)
            </label>
            <input
              type="text"
              placeholder={type === "vodafone_cash" ? "01012345678" : "username@instapay"}
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            حفظ وسيلة الدفع
          </Button>
        </form>
      </div>

      {/* Numbers Table / List Section */}
      <div className="lg:col-span-2 bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" /> الأرقام والحسابات المضافة
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            العدد: {numbers.length}
          </span>
        </h2>

        {numbers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">لم يتم إضافة أي أرقام تحويل بعد</p>
            <p className="text-xs text-slate-500 mt-1">أضف رقم فودافون كاش أو إنستاباي لبدء استقبال التحويلات من العملاء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">التسمية</th>
                  <th className="px-4 py-3">الرقم / الحساب</th>
                  <th className="px-4 py-3 text-center">الحالة</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {numbers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.type === "vodafone_cash" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                          <Smartphone className="w-3.5 h-3.5" /> فودافون كاش
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                          <Wallet className="w-3.5 h-3.5" /> إنستاباي
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-white">
                      {item.label}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-cyan-300 dir-ltr text-right">
                      {item.number}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> مفعل
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-500" /> معطل
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Image as ImageIcon,
  AlertTriangle,
  HelpCircle,
} from "lucide-react"

interface CustomerMessageItem {
  id: string
  subject: string | null
  message: string
  type: string
  imageUrl: string | null
  reply: string | null
  repliedAt: string | Date | null
  status: string
  createdAt: string | Date
  customer: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

interface CustomerMessagesClientProps {
  restaurantId: string
  initialMessages: CustomerMessageItem[]
}

export function CustomerMessagesClient({
  restaurantId,
  initialMessages,
}: CustomerMessagesClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<CustomerMessageItem[]>(initialMessages)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("all") // "all" | "inquiry" | "complaint" | "unread"
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleUpdateStatus = async (messageId: string, newStatus: string) => {
    setUpdatingId(messageId)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/customer-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: newStatus } : msg))
        )
        router.refresh()
      }
    } catch (err) {
      console.error("Error updating message status:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSendReply = async (messageId: string) => {
    const replyText = replyInputs[messageId]?.trim()
    if (!replyText) return

    setUpdatingId(messageId)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/customer-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText, status: "resolved" }),
      })

      const data = await res.json()

      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? data.message : msg))
        )
        setReplyInputs((prev) => ({ ...prev, [messageId]: "" }))
        router.refresh()
      }
    } catch (err) {
      console.error("Error sending staff reply:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredMessages = messages.filter((msg) => {
    if (filterType === "all") return true
    if (filterType === "inquiry") return msg.type === "inquiry"
    if (filterType === "complaint") return msg.type === "complaint"
    if (filterType === "unread") return msg.status === "unread"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-gray-800 pb-3">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterType === "all"
              ? "bg-brand-sky text-white"
              : "bg-brand-gray-900 text-brand-gray-400 hover:text-white"
          }`}
        >
          جميع الرسائل ({messages.length})
        </button>
        <button
          onClick={() => setFilterType("complaint")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            filterType === "complaint"
              ? "bg-rose-600 text-white"
              : "bg-brand-gray-900 text-rose-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          الشكاوى ({messages.filter((m) => m.type === "complaint").length})
        </button>
        <button
          onClick={() => setFilterType("inquiry")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            filterType === "inquiry"
              ? "bg-blue-600 text-white"
              : "bg-brand-gray-900 text-blue-400 hover:text-white"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          الاستفسارات ({messages.filter((m) => m.type === "inquiry").length})
        </button>
        <button
          onClick={() => setFilterType("unread")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            filterType === "unread"
              ? "bg-amber-500 text-white"
              : "bg-brand-gray-900 text-amber-400 hover:text-white"
          }`}
        >
          غير مقروء ({messages.filter((m) => m.status === "unread").length})
        </button>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-brand-gray-900/50 border border-brand-gray-800 rounded-2xl p-12 text-center text-brand-gray-400 space-y-3">
          <MessageSquare className="w-10 h-10 mx-auto opacity-40 text-brand-sky" />
          <p className="font-bold">لا توجد رسائل من العملاء في هذا التصنيف حاليًا</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`border rounded-2xl p-5 transition-all space-y-4 ${
                msg.type === "complaint"
                  ? "bg-rose-500/5 border-rose-500/30"
                  : msg.status === "unread"
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-brand-gray-900/60 border-brand-gray-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-gray-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{msg.customer.name}</span>

                    {/* Message Type Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        msg.type === "complaint"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                      }`}
                    >
                      {msg.type === "complaint" ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> شكوى عميل
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-3 h-3 text-sky-400" /> استفسار عام
                        </>
                      )}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        msg.status === "unread"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : msg.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {msg.status === "unread"
                        ? "رسالة جديدة"
                        : msg.status === "resolved"
                        ? "تم الحل والرد"
                        : "تمت المراجعة"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-brand-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-brand-sky" /> {msg.customer.email}
                    </span>
                    {msg.customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> {msg.customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-brand-gray-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(msg.createdAt).toLocaleString("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              {/* Subject & Message Content */}
              <div className="space-y-2">
                {msg.subject && (
                  <h3 className="font-bold text-brand-sky text-sm">الموضوع: {msg.subject}</h3>
                )}
                <p className="text-sm text-brand-gray-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                  {msg.message}
                </p>

                {/* Attached Photo for Complaints */}
                {msg.imageUrl && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-brand-gray-400 flex items-center gap-1 mb-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" /> الصورة المرفقة مع الشكوى:
                    </span>
                    <button
                      onClick={() => setSelectedImage(msg.imageUrl)}
                      className="group relative overflow-hidden rounded-xl border border-amber-500/30 max-w-xs block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="مرفق الشكوى"
                        className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        تكبير الصورة 🔍
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Staff Reply Section */}
              {msg.reply ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> رد طاقم العمل:
                    </span>
                    {msg.repliedAt && (
                      <span className="text-emerald-500/80 font-normal">
                        {new Date(msg.repliedAt).toLocaleString("ar-EG", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-100 whitespace-pre-line">{msg.reply}</p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-brand-gray-800/60">
                  <label className="text-xs font-bold text-brand-gray-300 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-brand-sky" /> الرد على الرسالة (سيصل للعميل ويفك قفل الشكوى):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="اكتب رد طاقم العمل هنا..."
                      value={replyInputs[msg.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendReply(msg.id)
                      }}
                      className="flex-1 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sky transition-colors"
                    />
                    <button
                      disabled={updatingId === msg.id || !replyInputs[msg.id]?.trim()}
                      onClick={() => handleSendReply(msg.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {updatingId === msg.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      إرسال الرد
                    </button>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-brand-gray-800/40">
                {msg.status === "unread" && (
                  <button
                    disabled={updatingId === msg.id}
                    onClick={() => handleUpdateStatus(msg.id, "read")}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {updatingId === msg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    تعليم كـ "تمت المراجعة"
                  </button>
                )}

                {msg.status !== "resolved" && (
                  <button
                    disabled={updatingId === msg.id}
                    onClick={() => handleUpdateStatus(msg.id, "resolved")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {updatingId === msg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    تعليم كـ "تم الحل"
                  </button>
                )}

                {msg.status === "resolved" && (
                  <button
                    disabled={updatingId === msg.id}
                    onClick={() => handleUpdateStatus(msg.id, "unread")}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {updatingId === msg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    إعادة كـ "غير مقروء"
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="مرفق مكبر" className="w-full h-full object-contain max-h-[80vh] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

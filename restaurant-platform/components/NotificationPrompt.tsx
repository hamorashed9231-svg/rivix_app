"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, CheckCircle, Sparkles } from "lucide-react"

export function NotificationPrompt() {
  const [permission, setPermission] = useState<string>("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("خاصية الإشعارات غير مدعومة في جهازك")
      return
    }

    try {
      const res = await Notification.requestPermission()
      setPermission(res)

      if (res === "granted") {
        new Notification("RIVIX Restaurant Platform 🔔", {
          body: "تم تفعيل الإشعارات الفورية! ستتلقى تنبيهات فورية لمراحل طلبك.",
          icon: "/logo.jpg",
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (permission === "granted") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
        <span className="flex items-center gap-2 font-bold">
          <BellRing className="w-4 h-4 text-emerald-400" />
          إشعارات الوجبات والطلبات الفورية مفعلة
        </span>
        <CheckCircle className="w-4 h-4 text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">تنبيهات استلام وتوصيل الوجبات</span>
          <p className="font-bold text-white text-xs">تفعيل إشعارات الهاتف الفورية 🔔</p>
        </div>
      </div>

      <button
        onClick={requestNotificationPermission}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
        <span>تفعيل الآن</span>
      </button>
    </div>
  )
}

"use client"

import React from "react"
import { useCart } from "./CartContext"
import { ShoppingBag, ArrowLeft } from "lucide-react"

export function FloatingCartButton() {
  const { totalItems, subtotal, openCartDrawer } = useCart()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-sm sm:max-w-xs mx-auto animate-in slide-in-from-bottom duration-300">
      <button
        type="button"
        onClick={openCartDrawer}
        className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-slate-950 p-3.5 px-5 rounded-2xl shadow-2xl shadow-cyan-500/30 flex items-center justify-between font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer border border-cyan-300/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 font-extrabold relative">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="bg-slate-950 text-cyan-300 px-2.5 py-0.5 rounded-full text-[11px] font-black">
            {totalItems} {totalItems === 1 ? "وجبة" : "وجبات"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-950">{subtotal} ج.م</span>
          <span className="bg-slate-950/20 p-1 rounded-lg text-slate-950">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </div>
      </button>
    </div>
  )
}

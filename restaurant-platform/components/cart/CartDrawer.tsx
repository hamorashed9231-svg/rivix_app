"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "./CartContext"
import { Button } from "@/components/ui/Button"
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Utensils,
  Store,
} from "lucide-react"

export function CartDrawer() {
  const {
    items,
    restaurantName,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  } = useCart()

  if (!isCartDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-10 rtl:pl-0 rtl:pr-10">
        <div className="w-screen max-w-md bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">عربة التسوق</h2>
                {restaurantName && (
                  <p className="text-[11px] text-cyan-400 font-bold flex items-center gap-1">
                    <Store className="w-3 h-3" /> {restaurantName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={closeCartDrawer}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">عربتك فارغة حالياً</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    تصفح المنيو واضف أشهى الوجبات والأطباق للبدء بالطلب
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 shadow-md"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Utensils className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-black text-cyan-400 mt-1">
                        {item.price} ر.س
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-white w-5 text-center">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>

                    {/* Remove Item Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold px-1">
                <span className="text-slate-400">المجموع الفرعي ({totalItems} عناصر):</span>
                <span className="text-base font-black text-cyan-400">{subtotal} ر.س</span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/customer/checkout"
                  onClick={closeCartDrawer}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <span>متابعة الطلب (Checkout)</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-2 text-[11px] font-semibold text-slate-500 hover:text-red-400 transition-colors cursor-pointer text-center"
                >
                  إفراغ العربة بالكامل
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

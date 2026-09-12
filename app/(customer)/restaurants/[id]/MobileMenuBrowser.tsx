"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Check, Utensils, ShoppingBag, ArrowLeft } from "lucide-react"
import { useCart } from "@/components/CartProvider"

interface MenuBrowserProps {
  restaurantId: string
  restaurantName: string
  categories: any[]
}

export function MobileMenuBrowser({
  restaurantId,
  restaurantName,
  categories,
}: MenuBrowserProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "")
  const { addItem, totalCount, totalPrice } = useCart()
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({})

  const handleAddItem = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      restaurantId,
      restaurantName,
    })

    setAddedIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }))
    }, 1200)
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Category Tabs */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-2 border-y border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "bg-[#0B192C] text-slate-300 hover:text-white border border-slate-800"
            }`}
          >
            {cat.name} ({cat.items?.length || 0})
          </button>
        ))}
      </div>

      {/* Category Food Items */}
      <div className="px-4 space-y-6">
        {categories.map((cat) => {
          if (activeCategory && cat.id !== activeCategory) return null

          return (
            <div key={cat.id} className="space-y-3">
              <h3 className="text-sm font-extrabold text-cyan-400">{cat.name}</h3>

              <div className="space-y-3">
                {cat.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-[#0B192C] border border-slate-800/80 rounded-2xl p-3.5 flex gap-3 items-center justify-between shadow-xl"
                  >
                    <div className="flex gap-3 items-center flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden relative shrink-0 border border-slate-800">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description || "أكلة شهية طازجة"}</p>
                        <p className="text-xs font-black text-cyan-400 mt-1.5">{item.price} ر.س</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddItem(item)}
                      disabled={!item.isAvailable}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-md shrink-0 ${
                        addedIds[item.id]
                          ? "bg-emerald-500 text-slate-950 scale-110"
                          : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                      }`}
                    >
                      {addedIds[item.id] ? <Check className="w-5 h-5 stroke-[3]" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Cart Bar (Bottom Mobile) */}
      {totalCount > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto">
          <Link
            href="/cart"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-cyan-500/30 flex items-center justify-between font-black text-xs hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-950/20 flex items-center justify-center text-slate-950">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="bg-slate-950 text-cyan-300 px-2 py-0.5 rounded-full text-[11px]">
                {totalCount} وجبات
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">{totalPrice} ر.س</span>
              <span className="text-slate-950 font-bold flex items-center gap-0.5">
                متابعة السلة <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

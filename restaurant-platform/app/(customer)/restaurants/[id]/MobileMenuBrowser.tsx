"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, Check, Utensils } from "lucide-react"
import { useCart } from "@/components/cart/CartContext"

interface MenuItemData {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isAvailable: boolean
}

interface MenuCategoryData {
  id: string
  name: string
  items: MenuItemData[]
}

interface MenuBrowserProps {
  restaurantId: string
  restaurantName: string
  branchId?: string
  categories: MenuCategoryData[]
}

export function MobileMenuBrowser({
  restaurantId,
  restaurantName,
  branchId,
  categories,
}: MenuBrowserProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "")
  const { addItem, items, updateQuantity } = useCart()
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({})

  const handleAddItem = (item: MenuItemData) => {
    addItem({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      restaurantId,
      restaurantName,
      branchId,
    })

    setAddedIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }))
    }, 1200)
  }

  // Helper to find quantity in current cart
  const getItemCartQty = (itemId: string) => {
    const cartItem = items.find((i) => i.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  return (
    <div className="space-y-5 pt-2">
      {/* Category Tabs Bar */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md py-3 px-1 border-b border-slate-800/80 flex gap-2.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          const availableCount = cat.items?.filter((i) => i.isAvailable)?.length || 0

          if (availableCount === 0) return null

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--restaurant-primary, #2196F3)",
                      color: "#ffffff",
                    }
                  : {}
              }
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "shadow-lg shadow-[var(--restaurant-primary)]/20 scale-105"
                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              {cat.name} ({availableCount})
            </button>
          )
        })}
      </div>

      {/* Category Food Items Cards Grid */}
      <div className="space-y-6">
        {categories.map((cat) => {
          if (activeCategory && cat.id !== activeCategory) return null

          const availableItems = cat.items?.filter((i) => i.isAvailable) || []
          if (availableItems.length === 0) return null

          return (
            <div key={cat.id} className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--restaurant-primary, #2196F3)" }}
                  />
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {availableItems.length} أصناف
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {availableItems.map((item) => {
                  const cartQty = getItemCartQty(item.id)
                  const isRecentlyAdded = addedIds[item.id]

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 flex gap-3.5 items-center justify-between shadow-xl backdrop-blur-md transition-all group"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl bg-slate-950 overflow-hidden relative shrink-0 border border-slate-800 shadow-md">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">
                            <Utensils className="w-7 h-7" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-extrabold text-sm text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description || "طبق شهي طازج يجهز بعناية فائقة"}
                        </p>
                        <div className="pt-1 flex items-center justify-between">
                          <span
                            className="text-xs font-black"
                            style={{ color: "var(--restaurant-primary, #2196F3)" }}
                          >
                            {item.price} ر.س
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector / Add to Cart Button */}
                      <div className="flex flex-col items-end justify-center shrink-0">
                        {cartQty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-2xl">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{ backgroundColor: "var(--restaurant-primary, #2196F3)" }}
                              className="w-7 h-7 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer font-bold shadow-md"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddItem(item)}
                            style={
                              isRecentlyAdded
                                ? { backgroundColor: "#22C55E", color: "#ffffff" }
                                : { backgroundColor: "var(--restaurant-primary, #2196F3)", color: "#ffffff" }
                            }
                            className="px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
                          >
                            {isRecentlyAdded ? (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>تمت الإضافة</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>إضافة</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

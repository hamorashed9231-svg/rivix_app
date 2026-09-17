"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, Check, Utensils, X, Layers, Tag } from "lucide-react"
import { useCart, SelectedOption } from "@/components/cart/CartContext"

export interface ItemOptionData {
  id: string
  name: string
  price: number
  isDefault?: boolean
}

export interface ItemOptionGroupData {
  id: string
  name: string
  selectionType: "single" | "multiple" | string
  isRequired: boolean
  options: ItemOptionData[]
}

export interface MenuItemData {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isAvailable: boolean
  optionGroups?: ItemOptionGroupData[]
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

  // Modal State for Item Options Customization
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItemData | null>(null)
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{ [groupId: string]: string[] }>({})
  const [itemQuantity, setItemQuantity] = useState(1)

  const openCustomizationModal = (item: MenuItemData) => {
    setSelectedItemForCustomization(item)
    setItemQuantity(1)

    // Pre-select default options if specified
    const initialMap: { [groupId: string]: string[] } = {}
    item.optionGroups?.forEach((group) => {
      const defaultOption = group.options.find((o) => o.isDefault)
      if (defaultOption) {
        initialMap[group.id] = [defaultOption.id]
      } else if (group.isRequired && group.options.length > 0) {
        initialMap[group.id] = [group.options[0].id]
      } else {
        initialMap[group.id] = []
      }
    })
    setSelectedOptionsMap(initialMap)
  }

  const closeCustomizationModal = () => {
    setSelectedItemForCustomization(null)
    setSelectedOptionsMap({})
  }

  const toggleOption = (group: ItemOptionGroupData, optionId: string) => {
    setSelectedOptionsMap((prev) => {
      const current = prev[group.id] || []
      if (group.selectionType === "single") {
        return { ...prev, [group.id]: [optionId] }
      } else {
        // multiple selection
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) }
        } else {
          return { ...prev, [group.id]: [...current, optionId] }
        }
      }
    })
  }

  const calculateCustomizedItemPrice = (item: MenuItemData): number => {
    let price = item.price
    item.optionGroups?.forEach((group) => {
      const selectedIds = selectedOptionsMap[group.id] || []
      selectedIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId)
        if (option) {
          price += option.price
        }
      })
    })
    return price
  }

  const handleConfirmCustomizedAdd = () => {
    if (!selectedItemForCustomization) return
    const item = selectedItemForCustomization

    // Build selectedOptions array
    const selectedOptionsList: SelectedOption[] = []
    let optionIdsKey: string[] = []

    item.optionGroups?.forEach((group) => {
      const selectedIds = selectedOptionsMap[group.id] || []
      selectedIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId)
        if (option) {
          optionIdsKey.push(option.id)
          selectedOptionsList.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            price: option.price,
          })
        }
      })
    })

    const unitPrice = calculateCustomizedItemPrice(item)
    // Unique ID for cart item depending on selected options
    const uniqueCartId = optionIdsKey.length > 0 ? `${item.id}_${optionIdsKey.sort().join("_")}` : item.id

    addItem(
      {
        id: uniqueCartId,
        menuItemId: item.id,
        name: item.name,
        price: unitPrice,
        image: item.image,
        restaurantId,
        restaurantName,
        branchId,
        selectedOptions: selectedOptionsList.length > 0 ? selectedOptionsList : undefined,
      },
      itemQuantity
    )

    setAddedIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }))
    }, 1200)

    closeCustomizationModal()
  }

  const handleAddItemDirectly = (item: MenuItemData) => {
    // If item has option groups, open customization modal instead of adding directly
    if (item.optionGroups && item.optionGroups.length > 0) {
      openCustomizationModal(item)
      return
    }

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

  // Helper to find total quantity in current cart for a menu item
  const getItemCartQty = (itemId: string) => {
    return items
      .filter((i) => i.menuItemId === itemId || i.id === itemId)
      .reduce((sum, i) => sum + i.quantity, 0)
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
                  const hasOptions = item.optionGroups && item.optionGroups.length > 0

                  // Extract size/portion badges (e.g., ثُمُن, رُبُع, نِصْف, كِيلو)
                  const sizeOptions = item.optionGroups
                    ?.flatMap((g) => g.options)
                    .map((o) => o.name) || []

                  return (
                    <div
                      key={item.id}
                      onClick={() => hasOptions && openCustomizationModal(item)}
                      className={`bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 flex gap-3.5 items-center justify-between shadow-xl backdrop-blur-md transition-all group ${
                        hasOptions ? "cursor-pointer" : ""
                      }`}
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
                        <h4 className="font-extrabold text-sm text-white truncate" style={{ color: "#ffffff" }}>
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {item.description || "طبق شهي طازج يجهز بعناية فائقة"}
                        </p>

                        {/* Portion & Size Badges (ثُمُن، رُبُع، نِصْف، كِيلو، إلخ) */}
                        {sizeOptions.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sizeOptions.slice(0, 4).map((sizeName, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-[10px] font-bold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-400" />
                                {sizeName}
                              </span>
                            ))}
                            {sizeOptions.length > 4 && (
                              <span className="px-1 py-0.5 text-[9px] text-slate-400 font-bold">
                                +{sizeOptions.length - 4} المزيد
                              </span>
                            )}
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between">
                          <span
                            className="text-xs font-black"
                            style={{ color: "var(--restaurant-primary, #f37f20)" }}
                          >
                            {hasOptions ? `تبدأ من ${item.price} ج.م` : `${item.price} ج.م`}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector / Add to Cart Button */}
                      <div className="flex flex-col items-end justify-center shrink-0">
                        {cartQty > 0 && !hasOptions ? (
                          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-2xl">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, -1)
                              }}
                              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, 1)
                              }}
                              style={{ backgroundColor: "var(--restaurant-primary, #f37f20)" }}
                              className="w-7 h-7 rounded-xl text-white flex items-center justify-center transition-all cursor-pointer font-bold shadow-md"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddItemDirectly(item)
                            }}
                            style={
                              isRecentlyAdded
                                ? { backgroundColor: "#22C55E", color: "#ffffff" }
                                : { backgroundColor: "var(--restaurant-primary, #f37f20)", color: "#ffffff" }
                            }
                            className="px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer hover:brightness-110 active:scale-95 text-white"
                          >
                            {isRecentlyAdded ? (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>تمت الإضافة</span>
                              </>
                            ) : hasOptions ? (
                              <>
                                <Layers className="w-4 h-4 stroke-[2.5]" />
                                <span>اختر الحجم</span>
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

      {/* Item Customization Modal (الأحجام والإضافات والأوزان) */}
      {selectedItemForCustomization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                {selectedItemForCustomization.image && (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden shrink-0">
                    <Image
                      src={selectedItemForCustomization.image}
                      alt={selectedItemForCustomization.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedItemForCustomization.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    حدد الحجم / الوزن والخيارات المفضلين لطلبك
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomizationModal}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Option Groups */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {selectedItemForCustomization.optionGroups?.map((group) => {
                const selectedIds = selectedOptionsMap[group.id] || []

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "var(--restaurant-primary, #f37f20)" }}
                        />
                        {group.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {group.selectionType === "single"
                          ? "اختر خيار واحد"
                          : "يمكنك اختيار أكثر من خيار"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((option) => {
                        const isSelected = selectedIds.includes(option.id)

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleOption(group, option.id)}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: "rgba(243, 127, 32, 0.12)",
                                    borderColor: "var(--restaurant-primary, #f37f20)",
                                    color: "#ffffff",
                                  }
                                : {}
                            }
                            className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "shadow-md"
                                : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: "var(--restaurant-primary, #f37f20)",
                                        borderColor: "var(--restaurant-primary, #f37f20)",
                                        color: "#ffffff",
                                      }
                                    : {}
                                }
                                className={`w-4 h-4 rounded-${
                                  group.selectionType === "single" ? "full" : "md"
                                } border flex items-center justify-center transition-colors ${
                                  isSelected ? "text-white" : "border-slate-600"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-xs font-bold">{option.name}</span>
                            </div>

                            <span
                              className="text-xs font-black"
                              style={{ color: "var(--restaurant-primary, #f37f20)" }}
                            >
                              {option.price > 0 ? `+${option.price} ج.م` : "متضمن"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer - Quantity & Confirm */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center text-xs font-black text-white">
                  {itemQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setItemQuantity((q) => q + 1)}
                  style={{ backgroundColor: "var(--restaurant-primary, #f37f20)" }}
                  className="w-8 h-8 rounded-xl text-white flex items-center justify-center transition-colors cursor-pointer font-bold"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmCustomizedAdd}
                style={{ backgroundColor: "var(--restaurant-primary, #f37f20)" }}
                className="flex-1 py-3 px-4 rounded-2xl text-white font-black text-xs transition-all shadow-xl hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>إضافة إلى العربة</span>
                <span className="bg-slate-950/30 px-2 py-0.5 rounded-lg text-white font-extrabold">
                  {calculateCustomizedItemPrice(selectedItemForCustomization) * itemQuantity} ج.م
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

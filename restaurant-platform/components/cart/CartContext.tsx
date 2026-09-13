"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: string
  menuItemId?: string
  name: string
  price: number
  quantity: number
  image?: string | null
  notes?: string
}

interface ConflictModalState {
  isOpen: boolean
  pendingItem: (Omit<CartItem, "quantity"> & { restaurantId: string; restaurantName: string; branchId?: string }) | null
}

interface CartContextType {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
  branchId: string | null
  addItem: (
    item: Omit<CartItem, "quantity"> & { restaurantId: string; restaurantName: string; branchId?: string },
    qty?: number
  ) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  clearCart: () => void
  replaceCart: (newItems: CartItem[], rId?: string | null, rName?: string | null, bId?: string | null) => void
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  openCartDrawer: () => void
  closeCartDrawer: () => void
  totalCount: number
  totalItems: number
  totalPrice: number
  subtotal: number
  conflictModalState: ConflictModalState
  cancelVendorChange: () => void
  confirmVendorChange: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [conflictModalState, setConflictModalState] = useState<ConflictModalState>({
    isOpen: false,
    pendingItem: null,
  })

  // 1. Load cart from localStorage on client mount
  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = localStorage.getItem("rivix_cart_data")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.items) setItems(parsed.items)
        if (parsed.restaurantId) setRestaurantId(parsed.restaurantId)
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName)
        if (parsed.branchId) setBranchId(parsed.branchId)
      } else {
        // Fallback check legacy key
        const legacySaved = localStorage.getItem("rivix_cart")
        if (legacySaved) {
          const parsedLegacy = JSON.parse(legacySaved)
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            setItems(parsedLegacy)
            setRestaurantId(parsedLegacy[0].restaurantId || null)
            setRestaurantName(parsedLegacy[0].restaurantName || null)
          }
        }
      }
    } catch (e) {
      console.error("Error loading cart from localStorage:", e)
    }
  }, [])

  // 2. Save cart to localStorage on change
  useEffect(() => {
    if (!isMounted) return
    try {
      const cartData = {
        items,
        restaurantId,
        restaurantName,
        branchId,
      }
      localStorage.setItem("rivix_cart_data", JSON.stringify(cartData))
      // Also update legacy key for backward compatibility
      localStorage.setItem("rivix_cart", JSON.stringify(items))
    } catch (e) {
      console.error("Error saving cart to localStorage:", e)
    }
  }, [items, restaurantId, restaurantName, branchId, isMounted])

  const openCartDrawer = () => setIsCartDrawerOpen(true)
  const closeCartDrawer = () => setIsCartDrawerOpen(false)

  const addItem = (
    newItem: Omit<CartItem, "quantity"> & { restaurantId: string; restaurantName: string; branchId?: string },
    qty = 1
  ) => {
    // Check Multi-vendor Conflict: If cart has items from another restaurant
    if (items.length > 0 && restaurantId && restaurantId !== newItem.restaurantId) {
      setConflictModalState({
        isOpen: true,
        pendingItem: newItem,
      })
      return
    }

    // Set restaurant metadata if empty
    if (!restaurantId || items.length === 0) {
      setRestaurantId(newItem.restaurantId)
      setRestaurantName(newItem.restaurantName)
      if (newItem.branchId) setBranchId(newItem.branchId)
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === newItem.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += qty
        return updated
      }
      return [
        ...prev,
        {
          id: newItem.id,
          menuItemId: newItem.menuItemId || newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: qty,
          image: newItem.image,
          notes: newItem.notes,
        },
      ]
    })
  }

  const confirmVendorChange = () => {
    if (!conflictModalState.pendingItem) return
    const pending = conflictModalState.pendingItem

    // Clear cart and start fresh with new restaurant
    setItems([
      {
        id: pending.id,
        menuItemId: pending.menuItemId || pending.id,
        name: pending.name,
        price: pending.price,
        quantity: 1,
        image: pending.image,
        notes: pending.notes,
      },
    ])
    setRestaurantId(pending.restaurantId)
    setRestaurantName(pending.restaurantName)
    setBranchId(pending.branchId || null)

    setConflictModalState({ isOpen: false, pendingItem: null })
  }

  const cancelVendorChange = () => {
    setConflictModalState({ isOpen: false, pendingItem: null })
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id)
      if (filtered.length === 0) {
        setRestaurantId(null)
        setRestaurantName(null)
        setBranchId(null)
      }
      return filtered
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => {
      const updated = prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]

      if (updated.length === 0) {
        setRestaurantId(null)
        setRestaurantName(null)
        setBranchId(null)
      }

      return updated
    })
  }

  const clearCart = () => {
    setItems([])
    setRestaurantId(null)
    setRestaurantName(null)
    setBranchId(null)
  }

  const replaceCart = (
    newItems: CartItem[],
    rId: string | null = null,
    rName: string | null = null,
    bId: string | null = null
  ) => {
    setItems(newItems)
    setRestaurantId(rId)
    setRestaurantName(rName)
    setBranchId(bId)
  }

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        branchId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        replaceCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        totalCount,
        totalItems: totalCount,
        totalPrice,
        subtotal: totalPrice,
        conflictModalState,
        cancelVendorChange,
        confirmVendorChange,
      }}
    >
      {children}

      {/* Multi-Vendor Conflict Confirmation Modal */}
      {conflictModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl">
              ⚠️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-white">تغيير المطعم؟</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                عربتك تحتوي حالياً على وجبات من{" "}
                <span className="font-bold text-cyan-400">"{restaurantName}"</span>. هل تريد إفراغ العربة والبدء بطلب جديد من{" "}
                <span className="font-bold text-amber-400">"{conflictModalState.pendingItem?.restaurantName}"</span>؟
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={cancelVendorChange}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء الإضافة
              </button>
              <button
                type="button"
                onClick={confirmVendorChange}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
              >
                إفراغ والبدء
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

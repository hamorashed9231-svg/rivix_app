"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  image?: string | null
  restaurantId: string
  restaurantName: string
  quantity: number
  notes?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
  restaurantId: string | null
  restaurantName: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rivix_cart")
      if (saved) setItems(JSON.parse(saved))
    } catch (e) {}
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("rivix_cart", JSON.stringify(items))
    } catch (e) {}
  }, [items])

  const restaurantId = items.length > 0 ? items[0].restaurantId : null
  const restaurantName = items.length > 0 ? items[0].restaurantName : null

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      // If adding from a different restaurant, reset cart to new restaurant
      if (prev.length > 0 && prev[0].restaurantId !== newItem.restaurantId) {
        if (!confirm(`السلة تحتوي على أصناف من مطعم "${prev[0].restaurantName}". هل تريد مسح السلة والبدء من "${newItem.restaurantName}"؟`)) {
          return prev
        }
        return [{ ...newItem, quantity: 1 }]
      }

      const existingIndex = prev.findIndex((i) => i.id === newItem.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta
            return newQty > 0 ? { ...i, quantity: newQty } : null
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
        restaurantId,
        restaurantName,
      }}
    >
      {children}
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

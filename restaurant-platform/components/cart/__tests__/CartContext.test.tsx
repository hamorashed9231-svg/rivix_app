import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../CartContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

describe('CartContext - Web Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([])
    expect(result.current.totalCount).toBe(0)
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.subtotal).toBe(0)
    expect(result.current.restaurantId).toBeNull()
  })

  it('adds an item to the cart and calculates subtotal correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        name: 'Shawarma Burger',
        price: 150,
        restaurantId: 'rest-1',
        restaurantName: 'Rivix Express',
      })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('Shawarma Burger')
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.totalCount).toBe(1)
    expect(result.current.totalPrice).toBe(150)
    expect(result.current.subtotal).toBe(150)
    expect(result.current.restaurantId).toBe('rest-1')
  })

  it('increments quantity when adding the same item again', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        name: 'Shawarma Burger',
        price: 150,
        restaurantId: 'rest-1',
        restaurantName: 'Rivix Express',
      })
    })

    act(() => {
      result.current.addItem(
        {
          id: 'item-1',
          name: 'Shawarma Burger',
          price: 150,
          restaurantId: 'rest-1',
          restaurantName: 'Rivix Express',
        },
        2
      )
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.totalCount).toBe(3)
    expect(result.current.totalPrice).toBe(450)
  })

  it('updates quantity and removes item when quantity reaches 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        name: 'Pizza Margherita',
        price: 200,
        restaurantId: 'rest-1',
        restaurantName: 'Rivix Express',
      })
    })

    act(() => {
      result.current.updateQuantity('item-1', 1)
    })
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.totalPrice).toBe(400)

    act(() => {
      result.current.updateQuantity('item-1', -2)
    })
    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.restaurantId).toBeNull()
  })

  it('triggers multi-vendor conflict modal when adding item from a different restaurant', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        name: 'Item Restaurant 1',
        price: 100,
        restaurantId: 'rest-1',
        restaurantName: 'Restaurant One',
      })
    })

    act(() => {
      result.current.addItem({
        id: 'item-2',
        name: 'Item Restaurant 2',
        price: 120,
        restaurantId: 'rest-2',
        restaurantName: 'Restaurant Two',
      })
    })

    // Cart items should NOT be updated yet; conflict modal should open
    expect(result.current.items).toHaveLength(1)
    expect(result.current.conflictModalState.isOpen).toBe(true)
    expect(result.current.conflictModalState.pendingItem?.restaurantId).toBe('rest-2')

    // Confirm vendor change
    act(() => {
      result.current.confirmVendorChange()
    })

    expect(result.current.conflictModalState.isOpen).toBe(false)
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('item-2')
    expect(result.current.restaurantId).toBe('rest-2')
  })

  it('clears cart completely', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        name: 'Fries',
        price: 50,
        restaurantId: 'rest-1',
        restaurantName: 'Rivix Express',
      })
    })

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totalPrice).toBe(0)
    expect(result.current.restaurantId).toBeNull()
  })
})

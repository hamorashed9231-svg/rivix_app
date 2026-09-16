import { describe, it, expect } from 'vitest';
import {
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  calculateCartTotal,
  calculateCartItemCount,
  CartItem,
} from '../cart-helpers';
import { MenuItem } from '@/services/restaurant';

describe('Mobile Cart Logic Unit Tests', () => {
  const item1: MenuItem = {
    id: 'menu-1',
    name: 'Burger Big Mac',
    price: 150,
    isAvailable: true,
  };

  const item2: MenuItem = {
    id: 'menu-2',
    name: 'French Fries',
    price: 50,
    isAvailable: true,
  };

  it('starts with empty list and zero totals', () => {
    const items: CartItem[] = [];
    expect(calculateCartTotal(items)).toBe(0);
    expect(calculateCartItemCount(items)).toBe(0);
  });

  it('adds new item to cart', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Burger Big Mac');
    expect(items[0].quantity).toBe(1);
    expect(calculateCartTotal(items)).toBe(150);
    expect(calculateCartItemCount(items)).toBe(1);
  });

  it('increments quantity when adding existing item', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);
    items = addCartItem(items, item1);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(calculateCartTotal(items)).toBe(300);
    expect(calculateCartItemCount(items)).toBe(2);
  });

  it('handles multiple distinct items', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);
    items = addCartItem(items, item2);

    expect(items).toHaveLength(2);
    expect(calculateCartTotal(items)).toBe(200);
    expect(calculateCartItemCount(items)).toBe(2);
  });

  it('updates item quantity directly', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);
    items = updateCartItemQuantity(items, 'menu-1', 4);

    expect(items[0].quantity).toBe(4);
    expect(calculateCartTotal(items)).toBe(600);
  });

  it('removes item when quantity is set to 0 or negative', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);
    items = updateCartItemQuantity(items, 'menu-1', 0);

    expect(items).toHaveLength(0);
    expect(calculateCartTotal(items)).toBe(0);
  });

  it('removes item explicitly by id', () => {
    let items: CartItem[] = [];
    items = addCartItem(items, item1);
    items = addCartItem(items, item2);

    items = removeCartItem(items, 'menu-1');
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe('menu-2');
    expect(calculateCartTotal(items)).toBe(50);
  });
});

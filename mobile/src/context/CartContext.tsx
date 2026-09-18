import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem } from '@/services/restaurant';
import {
  CartItem,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
  calculateCartTotal,
  calculateCartItemCount,
} from './cart-helpers';

import { AppliedCouponData } from '@/services/coupon';

export type { CartItem };

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (menuItemId: string) => number;
  isLoading: boolean;

  // Coupon state
  appliedCoupon: AppliedCouponData | null;
  discountAmount: number;
  couponCode: string;
  applyCoupon: (coupon: AppliedCouponData, amount: number, code: string) => void;
  removeCoupon: () => void;
}

const STORAGE_KEY = '@mobile_cart_items_v1';
const COUPON_STORAGE_KEY = '@mobile_cart_coupon_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponData | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');

  // Load stored cart & coupon on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }

        const storedCoupon = await AsyncStorage.getItem(COUPON_STORAGE_KEY);
        if (storedCoupon) {
          const parsedCoupon = JSON.parse(storedCoupon);
          if (parsedCoupon && parsedCoupon.coupon) {
            setAppliedCoupon(parsedCoupon.coupon);
            setDiscountAmount(parsedCoupon.discountAmount || 0);
            setCouponCode(parsedCoupon.couponCode || '');
          }
        }
      } catch (error) {
        console.error('Failed to load cart/coupon from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Save cart to AsyncStorage whenever items change
  const saveCart = useCallback(async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to save cart to AsyncStorage:', error);
    }
  }, []);

  const applyCoupon = useCallback((coupon: AppliedCouponData, amount: number, code: string) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(amount);
    setCouponCode(code);
    AsyncStorage.setItem(
      COUPON_STORAGE_KEY,
      JSON.stringify({ coupon, discountAmount: amount, couponCode: code })
    ).catch((err) => console.error('Failed to persist coupon:', err));
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    AsyncStorage.removeItem(COUPON_STORAGE_KEY).catch((err) =>
      console.error('Failed to clear coupon storage:', err)
    );
  }, []);

  const addItem = useCallback(
    (item: MenuItem) => {
      setItems((prevItems) => {
        const updated = addCartItem(prevItems, item);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      setItems((prevItems) => {
        const updated = removeCartItem(prevItems, menuItemId);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      setItems((prevItems) => {
        const updated = updateCartItemQuantity(prevItems, menuItemId, quantity);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(COUPON_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart storage:', error);
    }
  }, []);

  const getTotal = useCallback(() => {
    return calculateCartTotal(items);
  }, [items]);

  const getItemCount = useCallback(() => {
    return calculateCartItemCount(items);
  }, [items]);

  const getItemQuantity = useCallback(
    (menuItemId: string) => {
      const found = items.find((ci) => ci.menuItemId === menuItemId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemQuantity,
        isLoading,
        appliedCoupon,
        discountAmount,
        couponCode,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

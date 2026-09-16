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
}

const STORAGE_KEY = '@mobile_cart_items_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load stored cart on mount
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
      } catch (error) {
        console.error('Failed to load cart from AsyncStorage:', error);
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
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
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

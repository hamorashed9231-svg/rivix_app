import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem } from '@/services/restaurant';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

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

  // Save cart to AsyncStorage whenever items change (after initial load)
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
        const existingIndex = prevItems.findIndex((ci) => ci.menuItemId === item.id);
        let updated: CartItem[];
        if (existingIndex > -1) {
          updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
        } else {
          updated = [
            ...prevItems,
            {
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
              image: item.image,
            },
          ];
        }
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      setItems((prevItems) => {
        const updated = prevItems.filter((ci) => ci.menuItemId !== menuItemId);
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(menuItemId);
        return;
      }
      setItems((prevItems) => {
        const updated = prevItems.map((ci) =>
          ci.menuItemId === menuItemId ? { ...ci, quantity } : ci
        );
        saveCart(updated);
        return updated;
      });
    },
    [removeItem, saveCart]
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
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
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

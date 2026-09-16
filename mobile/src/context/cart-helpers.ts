import { MenuItem } from '@/services/restaurant';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export function addCartItem(prevItems: CartItem[], item: MenuItem): CartItem[] {
  const existingIndex = prevItems.findIndex((ci) => ci.menuItemId === item.id);
  if (existingIndex > -1) {
    const updated = [...prevItems];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + 1,
    };
    return updated;
  }
  return [
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

export function removeCartItem(prevItems: CartItem[], menuItemId: string): CartItem[] {
  return prevItems.filter((ci) => ci.menuItemId !== menuItemId);
}

export function updateCartItemQuantity(prevItems: CartItem[], menuItemId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeCartItem(prevItems, menuItemId);
  }
  return prevItems.map((ci) =>
    ci.menuItemId === menuItemId ? { ...ci, quantity } : ci
  );
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

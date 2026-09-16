import { api } from './api';

export interface OrderItemData {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  selectedOptions?: any[];
  menuItem?: {
    name: string;
    image?: string;
  };
}

export interface OrderDetails {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  totalPrice: number;
  deliveryFee?: number;
  distanceKm?: number;
  createdAt: string;
  cancellationReason?: string;
  items: OrderItemData[];
  branch?: {
    name: string;
    phone: string;
    address: string;
  };
  deliveryAddress?: {
    details: string;
  };
}

// Fetch customer's past orders list
export const fetchCustomerOrders = async (): Promise<OrderDetails[]> => {
  try {
    const response = await api.get('/api/customer/orders');
    return response.data.orders || [];
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
};

// Fetch single order tracking details by id
export const fetchOrderTracking = async (orderId: string): Promise<OrderDetails | null> => {
  try {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data.order || null;
  } catch (error) {
    console.error(`Error fetching tracking for order ${orderId}:`, error);
    return null;
  }
};

// Submit rating and review for a delivered order
export const submitOrderReview = async (payload: {
  orderId: string;
  restaurantId: string;
  rating: number;
  foodRating?: number;
  deliveryRating?: number;
  comment?: string;
}): Promise<boolean> => {
  try {
    const response = await api.post('/api/reviews', payload);
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Error submitting order review:', error);
    return false;
  }
};

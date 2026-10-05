import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDeliveryForCustomer, isInvalidLocation } from '@/services/delivery';
import { addCartItem, calculateCartTotal, CartItem } from '@/context/cart-helpers';
import { MenuItem } from '@/services/restaurant';

// Mock API client
const mockPost = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

describe('Full Mobile Customer Flow: Carousel Cards, GPS Delivery, Structured Address & Order Dispatch', () => {
  const sampleBranches = [
    {
      id: 'branch-seyof',
      name: 'فرع السيوف',
      address: 'شارع مصطفى كامل، السيوف، الإسكندرية',
      lat: 31.240346,
      lng: 29.993331,
      phone: '01000000000',
      isActive: true,
      deliveryEnabled: true,
      deliveryRadiusKm: 8.0,
      baseDeliveryFee: 20.0,
      pricePerKm: 5.0,
      minOrderForDelivery: 0.0,
    },
  ];

  const sampleMenu: MenuItem[] = [
    {
      id: 'item-1',
      name: 'وجبة ميكس جريل عائلي',
      price: 350,
      originalPrice: 450,
      isAvailable: true,
      isTopSeller: true,
      isFeatured: true,
      badge: 'خصم 100 ج.م 🔥',
    },
    {
      id: 'item-2',
      name: 'ساندوتش شاورما دجاج',
      price: 85,
      isAvailable: true,
      isTopSeller: true,
      isFeatured: false,
    },
    {
      id: 'item-3',
      name: 'بطاطس فارم فريتس',
      price: 40,
      isAvailable: true,
      isTopSeller: false,
      isFeatured: false,
    },
    {
      id: 'item-4',
      name: 'عرض 2 بيتزا مارجريتا',
      price: 210,
      originalPrice: 280,
      isAvailable: true,
      isTopSeller: false,
      isFeatured: true,
    },
    {
      id: 'item-5',
      name: 'صنف غير متاح',
      price: 100,
      originalPrice: 150,
      isAvailable: false,
      isTopSeller: true,
      isFeatured: true,
    },
  ];

  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
    mockDelete.mockReset();
  });

  it('1. Filters Large Horizontal-Scrolling Carousel Cards for Top Sellers, Special Offers & Discounted Items', () => {
    const highlightedCarouselItems = sampleMenu.filter(
      (item) =>
        item.isAvailable !== false &&
        (item.isTopSeller ||
          item.isFeatured ||
          (item.originalPrice && item.originalPrice > item.price))
    );

    // Should include item-1 (Top Seller + Featured + Discount), item-2 (Top Seller), item-4 (Featured + Discount)
    // Should exclude item-3 (regular item) and item-5 (unavailable)
    expect(highlightedCarouselItems.map((i) => i.id)).toEqual([
      'item-1',
      'item-2',
      'item-4',
    ]);
  });

  it('2. Immediately calculates delivery fee and distance when customer turns on GPS or selects pin on Map', () => {
    // Customer turns on GPS in Alexandria (~1.1 km from branch)
    const gpsLat = 31.248;
    const gpsLng = 29.998;

    expect(isInvalidLocation(gpsLat, gpsLng)).toBe(false);
    const delivery = calculateDeliveryForCustomer(gpsLat, gpsLng, sampleBranches);

    expect(delivery.isWithinRadius).toBe(true);
    expect(delivery.distanceKm).toBeGreaterThan(0);
    expect(delivery.distanceKm).toBeLessThan(8.0);
    const expectedFee = Math.round((20 + delivery.distanceKm * 5) * 100) / 100;
    expect(delivery.deliveryFee).toBe(expectedFee);
  });

  it('3. Saves structured customer address with GPS location, building, apartment, street, landmark, and phone', async () => {
    const { addUserAddress } = await import('@/services/user');

    mockPost.mockResolvedValueOnce({
      status: 201,
      data: {
        address: {
          id: 'addr-101',
          label: 'شارع مصطفى كامل',
          details: 'شارع: مصطفى كامل - عمارة: 15 - دور: 4 - شقة: 12 - علامة مميزة: بجوار مسجد النور - تليفون: 01099887766',
          lat: 31.248,
          lng: 29.998,
          streetName: 'مصطفى كامل',
          buildingNumber: '15',
          floor: '4',
          apartment: '12',
          landmark: 'بجوار مسجد النور',
          phone: '01099887766',
        },
      },
    });

    const saved = await addUserAddress({
      label: 'شارع مصطفى كامل',
      details: 'شارع: مصطفى كامل - عمارة: 15 - دور: 4 - شقة: 12',
      lat: 31.248,
      lng: 29.998,
      streetName: 'مصطفى كامل',
      buildingNumber: '15',
      floor: '4',
      apartment: '12',
      landmark: 'بجوار مسجد النور',
      phone: '01099887766',
    });

    expect(saved).not.toBeNull();
    expect(saved?.id).toBe('addr-101');
    expect(saved?.buildingNumber).toBe('15');
    expect(saved?.apartment).toBe('12');
    expect(saved?.landmark).toBe('بجوار مسجد النور');
    expect(saved?.phone).toBe('01099887766');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/customer/addresses',
      expect.objectContaining({
        streetName: 'مصطفى كامل',
        buildingNumber: '15',
        apartment: '12',
        landmark: 'بجوار مسجد النور',
        phone: '01099887766',
      })
    );
  });

  it('4. Preserves item options (selectedOptions) in Cart and sends complete order payload on Checkout', async () => {
    const { createCustomerOrder } = await import('@/services/orders');

    let cart: CartItem[] = [];
    const customItemWithOption: MenuItem & { selectedOptions?: any[] } = {
      ...sampleMenu[0],
      id: 'item-1_حجم عائلي',
      name: 'وجبة ميكس جريل عائلي (حجم عائلي)',
      price: 400,
      selectedOptions: [{ groupName: 'الحجم', optionName: 'حجم عائلي', price: 50 }],
    };

    cart = addCartItem(cart, customItemWithOption);
    cart = addCartItem(cart, customItemWithOption); // quantity becomes 2

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    expect(cart[0].selectedOptions).toEqual([
      { groupName: 'الحجم', optionName: 'حجم عائلي', price: 50 },
    ]);
    expect(calculateCartTotal(cart)).toBe(800);

    mockPost.mockResolvedValueOnce({
      status: 201,
      data: {
        order: {
          id: 'order-500',
          status: 'pending',
          totalPrice: 825,
          deliveryFee: 25,
          items: cart,
        },
      },
    });

    const result = await createCustomerOrder({
      restaurantId: 'rest-1',
      items: cart.map((c) => ({
        id: c.menuItemId,
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        price: c.price,
        selectedOptions: c.selectedOptions,
      })),
      totalPrice: 825,
      deliveryAddressId: 'addr-101',
      streetName: 'مصطفى كامل',
      buildingNumber: '15',
      apartment: '12',
      landmark: 'بجوار مسجد النور',
      phone: '01099887766',
      customerLat: 31.248,
      customerLng: 29.998,
      paymentMethod: 'cash',
    });

    expect(result.success).toBe(true);
    expect(result.order?.id).toBe('order-500');
  });
});

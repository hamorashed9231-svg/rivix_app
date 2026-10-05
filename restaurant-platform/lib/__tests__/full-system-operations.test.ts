// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signDriverToken } from '../driver-auth';

// Mock next-auth getServerSession
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Mock notifications pubsub
vi.mock('@/lib/notifications-pubsub', () => ({
  publishOrderEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock opening hours check so tests pass regardless of current clock time
vi.mock('@/lib/opening-hours', () => ({
  checkBranchOpenStatus: vi.fn().mockReturnValue({ isOpen: true }),
}));

// Mock promo notifications broadcast
vi.mock('@/lib/promo-notifications', () => ({
  broadcastPromoNotification: vi.fn().mockResolvedValue({
    notificationId: 'promo-notif-1',
    pushedCount: 25,
  }),
}));

// Mock Prisma client with in-memory state for end-to-end operational testing
const mockDb = {
  users: new Map<string, any>(),
  addresses: [] as any[],
  restaurants: new Map<string, any>(),
  branches: [] as any[],
  staff: [] as any[],
  menuItems: new Map<string, any>(),
  coupons: new Map<string, any>(),
  orders: [] as any[],
  deviceTokens: [] as any[],
  promoNotifications: [] as any[],
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return mockDb.users.get(where.id) || null;
        if (where.email) {
          for (const u of mockDb.users.values()) {
            if (u.email === where.email) return u;
          }
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const u = mockDb.users.get(where.id);
        if (u) {
          Object.assign(u, data);
          return u;
        }
        return null;
      }),
    },
    address: {
      findMany: vi.fn(async ({ where }: any) =>
        mockDb.addresses.filter((a) => a.userId === where.userId)
      ),
      findFirst: vi.fn(async ({ where }: any) =>
        mockDb.addresses.find(
          (a) =>
            (!where.id || a.id === where.id) &&
            (!where.userId || a.userId === where.userId)
        ) || null
      ),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `addr-${mockDb.addresses.length + 1}`, ...data };
        mockDb.addresses.push(created);
        return created;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const before = mockDb.addresses.length;
        mockDb.addresses = mockDb.addresses.filter(
          (a) => !(a.id === where.id && a.userId === where.userId)
        );
        return { count: before - mockDb.addresses.length };
      }),
    },
    restaurant: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return mockDb.restaurants.get(where.id) || null;
        if (where.slug) {
          for (const r of mockDb.restaurants.values()) {
            if (r.slug === where.slug) return r;
          }
        }
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const r of mockDb.restaurants.values()) {
          if (where.ownerId && r.ownerId === where.ownerId) {
            return {
              ...r,
              branches: mockDb.branches.filter((b) => b.restaurantId === r.id),
            };
          }
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const r = mockDb.restaurants.get(where.id);
        if (r) Object.assign(r, data);
        return r;
      }),
    },
    restaurantStaff: {
      findUnique: vi.fn(async ({ where }: any) => {
        const { restaurantId, userId } = where.restaurantId_userId || {};
        return (
          mockDb.staff.find(
            (s) => s.restaurantId === restaurantId && s.userId === userId
          ) || null
        );
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        const found = mockDb.staff.find(
          (s) =>
            s.userId === where.userId &&
            (where.isActive === undefined || s.isActive === where.isActive) &&
            (!where.staffRole || s.staffRole === where.staffRole)
        );
        if (!found) return null;
        const rest = mockDb.restaurants.get(found.restaurantId);
        return {
          ...found,
          restaurant: rest
            ? {
                ...rest,
                branches: mockDb.branches.filter((b) => b.restaurantId === rest.id),
              }
            : null,
        };
      }),
    },
    branch: {
      findFirst: vi.fn(async ({ where }: any) =>
        mockDb.branches.find(
          (b) =>
            b.restaurantId === where.restaurantId &&
            (where.isActive === undefined || b.isActive === where.isActive)
        ) || null
      ),
    },
    menuItem: {
      findUnique: vi.fn(async ({ where }: any) => mockDb.menuItems.get(where.id) || null),
      findMany: vi.fn(async ({ where }: any) => {
        const ids: string[] = where?.id?.in || [];
        return ids.map((id) => mockDb.menuItems.get(id)).filter(Boolean);
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = mockDb.menuItems.get(where.id);
        if (item) Object.assign(item, data);
        return item;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const item = mockDb.menuItems.get(where.id);
        if (item) Object.assign(item, data);
        return { count: item ? 1 : 0 };
      }),
    },
    coupon: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.code) return mockDb.coupons.get(where.code) || null;
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `coupon-${mockDb.coupons.size + 1}`, ...data };
        mockDb.coupons.set(created.code, created);
        return created;
      }),
    },
    order: {
      findFirst: vi.fn(async ({ where }: any) => {
        return (
          mockDb.orders.find(
            (o) =>
              o.customerId === where.customerId &&
              o.branchId === where.branchId &&
              o.status === where.status &&
              o.totalPrice === where.totalPrice &&
              o.createdAt >= where.createdAt.gte
          ) || null
        );
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const found = mockDb.orders.find((o) => o.id === where.id);
        if (!found) return null;
        const branch = mockDb.branches.find((b) => b.id === found.branchId);
        return {
          ...found,
          branch: branch
            ? { ...branch, restaurant: mockDb.restaurants.get(branch.restaurantId) }
            : null,
        };
      }),
      findMany: vi.fn(async ({ where }: any) => {
        if (where?.customerId) {
          return mockDb.orders.filter((o) => o.customerId === where.customerId);
        }
        if (where?.branchId?.in) {
          return mockDb.orders.filter((o) => where.branchId.in.includes(o.branchId));
        }
        return mockDb.orders;
      }),
      create: vi.fn(async ({ data }: any) => {
        const newOrder = {
          id: `order-${mockDb.orders.length + 1}`,
          customerId: data.customerId,
          branchId: data.branchId,
          status: data.status,
          totalPrice: data.totalPrice,
          discountAmount: data.discountAmount,
          couponId: data.couponId,
          deliveryFee: data.deliveryFee,
          distanceKm: data.distanceKm,
          deliveryAddressId: data.deliveryAddressId,
          paymentMethod: data.paymentMethod,
          items: data.items?.create || [],
          createdAt: new Date(),
        };
        mockDb.orders.push(newOrder);
        return newOrder;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = mockDb.orders.findIndex((o) => o.id === where.id);
        if (idx === -1) return null;
        mockDb.orders[idx] = { ...mockDb.orders[idx], ...data };
        const branch = mockDb.branches.find((b) => b.id === mockDb.orders[idx].branchId);
        return {
          ...mockDb.orders[idx],
          branch: branch ? { restaurantId: branch.restaurantId, address: branch.address } : null,
        };
      }),
      delete: vi.fn(async ({ where }: any) => {
        mockDb.orders = mockDb.orders.filter((o) => o.id !== where.id);
        return { id: where.id };
      }),
    },
    orderItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    devicePushToken: {
      upsert: vi.fn(async ({ create }: any) => {
        mockDb.deviceTokens.push(create);
        return create;
      }),
    },
    promoNotification: {
      findMany: vi.fn(async () => mockDb.promoNotifications),
    },
    $transaction: vi.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        const { prisma } = await import('@/lib/prisma');
        return await arg(prisma);
      }
      return await Promise.all(arg);
    }),
  },
}));

describe('End-to-End System Operations: Customer App, Call Center Manager, Staff & Owner', () => {
  let customerToken: string;
  let ownerToken: string;
  let managerToken: string;
  let staffToken: string;
  let hackerToken: string;

  beforeEach(async () => {
    mockDb.users.clear();
    mockDb.addresses = [];
    mockDb.restaurants.clear();
    mockDb.branches = [];
    mockDb.staff = [];
    mockDb.menuItems.clear();
    mockDb.coupons.clear();
    mockDb.orders = [];
    mockDb.deviceTokens = [];
    mockDb.promoNotifications = [];

    // 1. Seed Users
    mockDb.users.set('cust-1', {
      id: 'cust-1',
      name: 'زياد راشد',
      email: 'ziad@example.com',
      phone: '01012345678',
      role: 'customer',
    });
    mockDb.users.set('owner-1', {
      id: 'owner-1',
      name: 'أونر المطعم',
      email: 'owner@rivix.com',
      role: 'restaurant_owner',
    });
    mockDb.users.set('manager-1', {
      id: 'manager-1',
      name: 'مدير الكول سنتر',
      email: 'manager@rivix.com',
      role: 'customer',
    });
    mockDb.users.set('staff-1', {
      id: 'staff-1',
      name: 'موظف الكول سنتر',
      email: 'staff@rivix.com',
      role: 'customer',
    });
    mockDb.users.set('hacker-1', {
      id: 'hacker-1',
      name: 'مستخدم خارجي',
      email: 'other@example.com',
      role: 'customer',
    });

    // 2. Seed Restaurant, Active Branch (Alexandria), Staff, and MenuItems
    mockDb.restaurants.set('rest-1', {
      id: 'rest-1',
      ownerId: 'owner-1',
      name: 'مطعم ريفيكس',
      slug: 'rivix-rest',
      status: 'active',
    });

    mockDb.branches.push({
      id: 'branch-1',
      restaurantId: 'rest-1',
      name: 'فرع السيوف',
      address: 'السيوف، الإسكندرية',
      lat: 31.240346,
      lng: 29.993331,
      phone: '01000000000',
      openingHours: {},
      isActive: true,
      deliveryEnabled: true,
      deliveryRadiusKm: 10.0,
      baseDeliveryFee: 20.0,
      pricePerKm: 5.0,
      minOrderForDelivery: 0,
    });

    mockDb.staff.push(
      {
        id: 'st-mgr',
        restaurantId: 'rest-1',
        userId: 'manager-1',
        staffRole: 'manager',
        isActive: true,
      },
      {
        id: 'st-emp',
        restaurantId: 'rest-1',
        userId: 'staff-1',
        staffRole: 'staff',
        isActive: true,
      }
    );

    mockDb.menuItems.set('item-burger', {
      id: 'item-burger',
      name: 'برجر دبل تشيز',
      price: 150,
      originalPrice: 180,
      isAvailable: true,
      isTopSeller: true,
      isFeatured: true,
      category: { id: 'cat-1', restaurantId: 'rest-1' },
    });

    mockDb.coupons.set('RIVIX20', {
      id: 'coup-1',
      code: 'RIVIX20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 100,
      maxDiscount: 100,
      expiresAt: null,
      isActive: true,
      restaurantId: 'rest-1',
      targetScope: 'order',
      targetMenuItemId: null,
    });

    // 3. Sign Mobile / API JWT Tokens
    customerToken = await signDriverToken({
      id: 'cust-1',
      userId: 'cust-1',
      name: 'زياد راشد',
      role: 'customer',
    });
    ownerToken = await signDriverToken({
      id: 'owner-1',
      userId: 'owner-1',
      name: 'أونر المطعم',
      role: 'restaurant_owner',
    });
    managerToken = await signDriverToken({
      id: 'manager-1',
      userId: 'manager-1',
      name: 'مدير الكول سنتر',
      role: 'customer',
    });
    staffToken = await signDriverToken({
      id: 'staff-1',
      userId: 'staff-1',
      name: 'موظف الكول سنتر',
      role: 'customer',
    });
    hackerToken = await signDriverToken({
      id: 'hacker-1',
      userId: 'hacker-1',
      name: 'مستخدم خارجي',
      role: 'customer',
    });
  });

  it('1. Blocks unauthenticated requests & rejects x-user-id spoofing', async () => {
    const { POST: createAddress } = await import('@/app/api/customer/addresses/route');

    // Attempt spoofing via x-user-id header without valid Bearer JWT
    const spoofReq = new Request('http://localhost/api/customer/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'owner-1',
      },
      body: JSON.stringify({
        streetName: 'شارع جمال عبد الناصر',
        buildingNumber: '12',
        apartment: '4',
        phone: '01012345678',
      }),
    });

    const res = await createAddress(spoofReq);
    expect(res.status).toBe(401);
  });

  it('2. Saves customer address via GPS coordinates + building, apartment, street, landmark, and phone', async () => {
    const { POST: createAddress, GET: getAddresses } = await import(
      '@/app/api/customer/addresses/route'
    );

    const saveReq = new Request('http://localhost/api/customer/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        label: 'المنزل',
        lat: 31.248,
        lng: 29.998,
        streetName: 'شارع مصطفى كامل',
        buildingNumber: '15',
        floor: '3',
        apartment: '8',
        landmark: 'أمام صيدلية خليل',
        phone: '01234567890',
      }),
    });

    const saveRes = await createAddress(saveReq);
    expect(saveRes.status).toBe(201);
    const savedData = await saveRes.json();
    expect(savedData.address).toBeDefined();
    expect(savedData.address.streetName).toBe('شارع مصطفى كامل');
    expect(savedData.address.buildingNumber).toBe('15');
    expect(savedData.address.apartment).toBe('8');
    expect(savedData.address.landmark).toBe('أمام صيدلية خليل');
    expect(savedData.address.phone).toBe('01234567890');
    expect(savedData.address.details).toContain('علامة مميزة: أمام صيدلية خليل');

    // Verify GET returns the saved address
    const getReq = new Request('http://localhost/api/customer/addresses', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getRes = await getAddresses(getReq);
    expect(getRes.status).toBe(200);
    const listData = await getRes.json();
    expect(listData.addresses).toHaveLength(1);
    expect(listData.addresses[0].landmark).toBe('أمام صيدلية خليل');
  });

  it('3. Creates order with GPS delivery calculation, server-side price protection, options, coupon, and rush-time duplicate guard', async () => {
    const { POST: createOrder } = await import('@/app/api/customer/orders/route');

    // Customer tries to tamper with price (sends price: 1 EGP instead of real 150 EGP)
    // and selects an extra option (+20 EGP) with composite ID "item-burger_جبنة إضافية"
    const orderPayload = {
      restaurantId: 'rest-1',
      items: [
        {
          id: 'item-burger_جبنة إضافية',
          menuItemId: 'item-burger_جبنة إضافية',
          quantity: 2,
          price: 1, // Tampered price! Server must override with 150 + 20 = 170 EGP
          selectedOptions: [{ groupName: 'إضافات', optionName: 'جبنة إضافية', price: 20 }],
        },
      ],
      totalPrice: 2, // Tampered total!
      customerLat: 31.248,
      customerLng: 29.998,
      streetName: 'شارع مصطفى كامل',
      buildingNumber: '15',
      apartment: '8',
      landmark: 'أمام صيدلية خليل',
      phone: '01234567890',
      paymentMethod: 'vodafone',
      couponCode: 'RIVIX20',
    };

    const req1 = new Request('http://localhost/api/customer/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const res1 = await createOrder(req1);
    expect(res1.status).toBe(201);
    const data1 = await res1.json();

    // Real item unit price = 150 (base) + 20 (option) = 170 EGP
    // Subtotal for 2 items = 340 EGP
    // 20% Coupon (RIVIX20) discount on 340 = 68 EGP
    // Net items after discount = 272 EGP + deliveryFee (> 20 EGP)
    expect(data1.order.discountAmount).toBe(68);
    expect(data1.order.deliveryFee).toBeGreaterThan(20);
    expect(data1.order.totalPrice).toBeCloseTo(272 + data1.order.deliveryFee, 2);
    expect(data1.order.paymentMethod).toBe('vodafone_cash');
    // Normalized base menuItemId (stripped "_جبنة إضافية")
    expect(data1.order.items[0].menuItemId).toBe('item-burger');

    // Rush-Time Double-Click Guard: Sending the exact same request 1 second later returns the same order without duplicating!
    const req2 = new Request('http://localhost/api/customer/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const res2 = await createOrder(req2);
    expect(res2.status).toBe(201);
    const data2 = await res2.json();
    expect(data2.order.id).toBe(data1.order.id);
    expect(mockDb.orders).toHaveLength(1);
  });

  it('4. Full Call Center Manager, Staff & Owner Order Dispatch Workflow + IDOR Protection', async () => {
    const { POST: createOrder, GET: getOrders } = await import('@/app/api/customer/orders/route');
    const { PATCH: updateStatus } = await import('@/app/api/orders/[id]/status/route');
    const { POST: forwardOrder } = await import('@/app/api/orders/[id]/forward/route');
    const { GET: getOrderById, PUT: editOrder } = await import('@/app/api/orders/[id]/route');

    // 1. Customer places an order
    const createReq = new Request('http://localhost/api/customer/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        restaurantId: 'rest-1',
        items: [{ id: 'item-burger', menuItemId: 'item-burger', quantity: 1, price: 150 }],
        totalPrice: 175,
        customerLat: 31.248,
        customerLng: 29.998,
        streetName: 'شارع فؤاد',
        buildingNumber: '4',
        apartment: '2',
        phone: '01012345678',
      }),
    });
    const createRes = await createOrder(createReq);
    const { order } = await createRes.json();
    expect(order.status).toBe('pending');

    // 2. Call Center Manager refreshes OrderBoard (?scope=dashboard) and sees the restaurant's order
    const dashReq = new Request('http://localhost/api/customer/orders?scope=dashboard', {
      method: 'GET',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const dashRes = await getOrders(dashReq);
    const dashData = await dashRes.json();
    expect(dashData.orders).toHaveLength(1);
    expect(dashData.orders[0].id).toBe(order.id);

    // 3. External unauthorized user (hacker-1) tries to view the order (IDOR test) -> Blocked with 403!
    const hackerViewReq = new Request(`http://localhost/api/orders/${order.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${hackerToken}` },
    });
    const hackerViewRes = await getOrderById(hackerViewReq, {
      params: Promise.resolve({ id: order.id }),
    });
    expect(hackerViewRes.status).toBe(403);

    // 4. Call Center Staff forwards order to POS -> Status becomes 'accepted'
    const forwardReq = new Request(`http://localhost/api/orders/${order.id}/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ targetSystem: 'POS_MAIN' }),
    });
    const forwardRes = await forwardOrder(forwardReq, {
      params: Promise.resolve({ id: order.id }),
    });
    expect(forwardRes.status).toBe(200);
    const forwardData = await forwardRes.json();
    expect(forwardData.order.status).toBe('accepted');

    // 5. Call Center Manager edits order quantity -> Allowed!
    const editReq = new Request(`http://localhost/api/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        items: [{ menuItemId: 'item-burger', quantity: 2, price: 150 }],
        totalPrice: 325,
      }),
    });
    const editRes = await editOrder(editReq, {
      params: Promise.resolve({ id: order.id }),
    });
    expect(editRes.status).toBe(200);

    // 6. Progress through kitchen & delivery stages: preparing -> ready -> out_for_delivery -> delivered
    for (const nextStatus of ['preparing', 'ready', 'out_for_delivery', 'delivered']) {
      const statusReq = new Request(`http://localhost/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const statusRes = await updateStatus(statusReq, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(statusRes.status).toBe(200);
      const statusData = await statusRes.json();
      expect(statusData.order.status).toBe(nextStatus);
    }
  });

  it('5. Call Center Manager creates coupon & customizes Top Sellers/Offers and broadcasts push notifications to all app users', async () => {
    const { POST: createCoupon } = await import('@/app/api/coupons/route');
    const { PATCH: updateCustomization } = await import(
      '@/app/api/restaurants/[id]/customization/route'
    );
    const { broadcastPromoNotification } = await import('@/lib/promo-notifications');

    // 1. Call Center Manager creates a new discount coupon with notification broadcast
    const couponReq = new Request('http://localhost/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        code: 'MEGA50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 200,
        sendNotification: true,
      }),
    });

    const couponRes = await createCoupon(couponReq);
    expect(couponRes.status).toBe(201);
    expect(broadcastPromoNotification).toHaveBeenCalled();

    // 2. Call Center Manager updates Top Seller / Offer card items and sends broadcast notification
    const customReq = new Request('http://localhost/api/restaurants/rest-1/customization', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        banner: {
          bannerTitle: 'خصومات نهاية الأسبوع 🔥',
          bannerSubtitle: 'خصم 30% على جميع البرجر',
          bannerBadge: 'عرض خاص',
          bannerActive: true,
        },
        notifyCustomers: true,
        notificationTitle: '🔥 عرض جديد من مطعم ريفيكس',
        notificationBody: 'خصم 30% على البرجر الدبل لفترة محدودة!',
        itemUpdates: [
          {
            id: 'item-burger',
            price: 140,
            originalPrice: 200,
            isTopSeller: true,
            isFeatured: true,
            badge: 'الأكثر مبيعاً ⭐',
          },
        ],
      }),
    });

    const customRes = await updateCustomization(customReq as any, {
      params: Promise.resolve({ id: 'rest-1' }),
    });
    expect(customRes.status).toBe(200);
    const updatedBurger = mockDb.menuItems.get('item-burger');
    expect(updatedBurger.price).toBe(140);
    expect(updatedBurger.originalPrice).toBe(200);
    expect(updatedBurger.isTopSeller).toBe(true);
    expect(updatedBurger.isFeatured).toBe(true);
  });
});

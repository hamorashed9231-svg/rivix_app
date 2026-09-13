import { PrismaClient, Role, RestaurantStatus, OrderStatus, DiscountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting DB seeding with historical time-series analytics and promo codes...')

  // Clear existing data in reverse order of dependencies
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'مدير المنصة (RIVIX Admin)',
      email: 'admin@rivix.com',
      password: hashedPassword,
      phone: '0500000000',
      role: Role.admin,
    },
  })

  // 2. Create Restaurant Owner
  const owner = await prisma.user.create({
    data: {
      name: 'أحمد صاحب المطعم',
      email: 'owner@rivix.com',
      password: hashedPassword,
      phone: '0511111111',
      role: Role.restaurant_owner,
    },
  })

  // 2b. Create Staff Dispatch Manager
  await prisma.user.create({
    data: {
      name: 'مدير الأصطاف واستقبال الطلبات (Staff Dispatch Manager)',
      email: 'staff@rivix.com',
      password: hashedPassword,
      phone: '0544444444',
      role: Role.restaurant_owner,
    },
  })

  // 3. Create Customer
  const customer = await prisma.user.create({
    data: {
      name: 'خالد العمير (عميل)',
      email: 'customer@rivix.com',
      password: hashedPassword,
      phone: '0522222222',
      role: Role.customer,
    },
  })

  // 4. Create Addresses for Customer
  const address1 = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'المنزل 🏠',
      lat: 24.7136,
      lng: 46.6753,
      details: 'الرياض - حي الملقا - شارع حائل - فيلا 12',
    },
  })

  const address2 = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'العمل 🏢',
      lat: 24.6900,
      lng: 46.6800,
      details: 'الرياض - حي العليا - برج ريفيكس - الدور 15',
    },
  })

  // 5. Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: 'مطعم ريفيكس جريل - RIVIX Grill',
      slug: 'rivix-grill',
      logo: '/logo.jpg',
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      description: 'أفضل الوجبات المشوية والبرجر بلمسة RIVIX الخاصة',
      primaryColor: '#2196F3',
      secondaryColor: '#0A1A3C',
      status: RestaurantStatus.active,
      commissionRate: 12.5,
    },
  })

  // 6. Create Coupons
  await prisma.coupon.create({
    data: {
      code: 'RIVIX20',
      discountType: DiscountType.percentage,
      discountValue: 20.0,
      minOrderAmount: 30.0,
      isActive: true,
    },
  })

  await prisma.coupon.create({
    data: {
      code: 'WELCOME50',
      discountType: DiscountType.fixed,
      discountValue: 50.0,
      minOrderAmount: 100.0,
      isActive: true,
    },
  })

  // 7. Create Branches
  const branch1 = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      address: 'فرع الملقا - طريق أنس بن مالك',
      phone: '0512345678',
      lat: 24.7136,
      lng: 46.6753,
      openingHours: { open: '10:00 AM', close: '12:00 AM' },
      isActive: true,
    },
  })

  const branch2 = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      address: 'فرع التخصصي - طريق التخصصي',
      phone: '0598765432',
      lat: 24.6900,
      lng: 46.6800,
      openingHours: { open: '11:00 AM', close: '01:00 AM' },
      isActive: true,
    },
  })

  // 8. Create Menu Categories
  const cat1 = await prisma.menuCategory.create({
    data: {
      branchId: branch1.id,
      name: 'الأطباق الرئيسية والمشويات',
      order: 1,
    },
  })

  const cat2 = await prisma.menuCategory.create({
    data: {
      branchId: branch1.id,
      name: 'الساندوتشات والبرجر',
      order: 2,
    },
  })

  const cat3 = await prisma.menuCategory.create({
    data: {
      branchId: branch1.id,
      name: 'المشروبات والتحلية',
      order: 3,
    },
  })

  // 9. Create Menu Items
  const item1 = await prisma.menuItem.create({
    data: {
      categoryId: cat2.id,
      name: 'برجر ريفيكس الملكي',
      description: 'لحم أنجوس فاخر مع صوص ريفيكس السري وجبنة شيدر ذائبة',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      isAvailable: true,
    },
  })

  const item2 = await prisma.menuItem.create({
    data: {
      categoryId: cat1.id,
      name: 'ستيك مشوي ريفيكس',
      description: 'قطعة ستيك ريب آي مع الخضار المشوية وصوص الفطر',
      price: 85.0,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      isAvailable: true,
    },
  })

  const item3 = await prisma.menuItem.create({
    data: {
      categoryId: cat2.id,
      name: 'بطاطس ريفيكس بالجبن والهلابينو',
      description: 'بطاطس مقرمشة مغطاة بالجبن الذائب والهلابينو',
      price: 22.0,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
      isAvailable: true,
    },
  })

  const item4 = await prisma.menuItem.create({
    data: {
      categoryId: cat3.id,
      name: 'عصير ريفيكس ميكس طازج',
      description: 'مزج طازج من الفواكه الاستوائية الباردة',
      price: 18.0,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
      isAvailable: true,
    },
  })

  // 10. Generate Time-Series Historical Orders
  const now = new Date()

  const historicalOrdersData = [
    { daysAgo: 6, status: OrderStatus.delivered, branchId: branch1.id, item: item1, qty: 3, price: 135.0 },
    { daysAgo: 6, status: OrderStatus.delivered, branchId: branch2.id, item: item2, qty: 2, price: 170.0 },
    { daysAgo: 5, status: OrderStatus.delivered, branchId: branch1.id, item: item2, qty: 3, price: 255.0 },
    { daysAgo: 5, status: OrderStatus.delivered, branchId: branch2.id, item: item3, qty: 4, price: 88.0 },
    { daysAgo: 4, status: OrderStatus.delivered, branchId: branch1.id, item: item1, qty: 4, price: 180.0 },
    { daysAgo: 4, status: OrderStatus.delivered, branchId: branch2.id, item: item4, qty: 5, price: 90.0 },
    { daysAgo: 3, status: OrderStatus.delivered, branchId: branch1.id, item: item2, qty: 4, price: 340.0 },
    { daysAgo: 3, status: OrderStatus.delivered, branchId: branch1.id, item: item3, qty: 3, price: 66.0 },
    { daysAgo: 2, status: OrderStatus.delivered, branchId: branch2.id, item: item1, qty: 5, price: 225.0 },
    { daysAgo: 2, status: OrderStatus.delivered, branchId: branch1.id, item: item2, qty: 2, price: 170.0 },
    { daysAgo: 1, status: OrderStatus.delivered, branchId: branch1.id, item: item1, qty: 6, price: 270.0 },
    { daysAgo: 1, status: OrderStatus.delivered, branchId: branch2.id, item: item3, qty: 5, price: 110.0 },
    { daysAgo: 0, status: OrderStatus.pending, branchId: branch1.id, item: item1, qty: 2, price: 90.0 },
    { daysAgo: 0, status: OrderStatus.accepted, branchId: branch2.id, item: item2, qty: 1, price: 85.0 },
  ]

  for (const o of historicalOrdersData) {
    const orderDate = new Date(now)
    orderDate.setDate(now.getDate() - o.daysAgo)

    await prisma.order.create({
      data: {
        customerId: customer.id,
        branchId: o.branchId,
        status: o.status,
        totalPrice: o.price,
        deliveryAddressId: address1.id,
        createdAt: orderDate,
        items: {
          create: [
            {
              menuItemId: o.item.id,
              quantity: o.qty,
              price: o.item.price,
            },
          ],
        },
      },
    })
  }

  console.log('✅ DB Seeding completed successfully with coupons and addresses!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

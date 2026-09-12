import { PrismaClient, Role, RestaurantStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting DB seeding...')

  // Clear existing data in reverse order of dependencies
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
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

  // 4. Create Address for Customer
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'المنزل',
      lat: 24.7136,
      lng: 46.6753,
      details: 'الرياض - حي الملقا - شارع حائل - فيلا 12',
    },
  })

  // 5. Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: 'مطعم ريفيكس جريل - RIVIX Grill',
      logo: '/logo.jpg',
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      description: 'أفضل الوجبات المشوية والبرجر بلمسة RIVIX الخاصة',
      status: RestaurantStatus.active,
      commissionRate: 12.5,
    },
  })

  // 6. Create Branch
  const branch = await prisma.branch.create({
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

  // 7. Create Menu Categories
  const cat1 = await prisma.menuCategory.create({
    data: {
      branchId: branch.id,
      name: 'الأطباق الرئيسية والمشويات',
      order: 1,
    },
  })

  const cat2 = await prisma.menuCategory.create({
    data: {
      branchId: branch.id,
      name: 'الساندوتشات والبرجر',
      order: 2,
    },
  })

  const cat3 = await prisma.menuCategory.create({
    data: {
      branchId: branch.id,
      name: 'المشروبات والتحلية',
      order: 3,
    },
  })

  // 8. Create Menu Items
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

  // 9. Create Sample Orders with Different Statuses
  const order1 = await prisma.order.create({
    data: {
      customerId: customer.id,
      branchId: branch.id,
      status: OrderStatus.pending,
      totalPrice: 67.0,
      deliveryAddressId: address.id,
      items: {
        create: [
          { menuItemId: item1.id, quantity: 1, price: 45.0 },
          { menuItemId: item3.id, quantity: 1, price: 22.0 },
        ],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      customerId: customer.id,
      branchId: branch.id,
      status: OrderStatus.preparing,
      totalPrice: 130.0,
      deliveryAddressId: address.id,
      items: {
        create: [
          { menuItemId: item2.id, quantity: 1, price: 85.0 },
          { menuItemId: item1.id, quantity: 1, price: 45.0 },
        ],
      },
    },
  })

  const order3 = await prisma.order.create({
    data: {
      customerId: customer.id,
      branchId: branch.id,
      status: OrderStatus.ready,
      totalPrice: 40.0,
      deliveryAddressId: address.id,
      items: {
        create: [
          { menuItemId: item3.id, quantity: 1, price: 22.0 },
          { menuItemId: item4.id, quantity: 1, price: 18.0 },
        ],
      },
    },
  })

  console.log('✅ DB Seeding completed successfully!')
  console.log('🔑 Credentials:')
  console.log('   Admin: admin@rivix.com / password123')
  console.log('   Owner: owner@rivix.com / password123')
  console.log('   Customer: customer@rivix.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function backfillBranches() {
  console.log("🌱 Starting backfill of default branches for restaurants...")

  const restaurantsWithoutBranches = await prisma.restaurant.findMany({
    where: {
      branches: {
        none: {},
      },
    },
  })

  console.log(`Found ${restaurantsWithoutBranches.length} restaurant(s) without branches.`)

  for (const restaurant of restaurantsWithoutBranches) {
    const branch = await prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        address: "الفرع الرئيسي",
        phone: "0500000000",
        lat: 24.7136,
        lng: 46.6753,
        openingHours: { open: "10:00 AM", close: "12:00 AM" },
        isActive: true,
      },
    })
    console.log(`✅ Created default branch "${branch.address}" (ID: ${branch.id}) for restaurant: ${restaurant.name}`)
  }

  console.log("🎉 Backfill completed successfully!")
}

backfillBranches()
  .catch((e) => {
    console.error("❌ Error during backfill:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

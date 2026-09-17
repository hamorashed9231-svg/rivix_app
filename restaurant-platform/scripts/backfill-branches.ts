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
        name: "الفرع الرئيسي",
        address: "الفرع الرئيسي - يرجى تحديد الموقع على الخريطة",
        phone: "0500000000",
        lat: null,
        lng: null,
        openingHours: { open: "10:00 AM", close: "12:00 AM" },
        isActive: false, // Inactive until location is set via map picker
      },
    })
    console.warn(
      `⚠️ Created default branch "${branch.name}" (ID: ${branch.id}) for restaurant "${restaurant.name}" with lat/lng left as NULL. Branch set to INACTIVE (isActive: false) until the owner sets the location on the map.`
    )
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

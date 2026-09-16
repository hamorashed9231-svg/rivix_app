import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting POS reference data migration...")

  const posOrders = await prisma.order.findMany({
    where: {
      driverAssignmentId: {
        startsWith: "POS-EXT-",
      },
    },
  })

  console.log(`Found ${posOrders.length} orders with POS references stored in driverAssignmentId.`)

  let updatedCount = 0
  for (const order of posOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        posReferenceId: order.driverAssignmentId,
        driverAssignmentId: null,
      },
    })
    updatedCount++
  }

  console.log(`Successfully migrated ${updatedCount} orders to use posReferenceId.`)
}

main()
  .catch((e) => {
    console.error("Migration error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

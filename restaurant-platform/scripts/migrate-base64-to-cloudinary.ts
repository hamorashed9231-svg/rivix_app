import { PrismaClient } from "@prisma/client"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789",
  api_secret: process.env.CLOUDINARY_API_SECRET || "secret",
  secure: true,
})

async function main() {
  console.log("Starting Base64 to Cloudinary image migration...")

  // 1. Fetch menu items and orders with image data
  const menuItems = await prisma.menuItem.findMany({
    where: {
      image: {
        startsWith: "data:image/",
      },
    },
  })

  const orders = await prisma.order.findMany({
    where: {
      paymentProofImage: {
        startsWith: "data:image/",
      },
    },
  })

  console.log(`Found ${menuItems.length} menu items and ${orders.length} orders with Base64 images.`)

  // 2. Dump backup to JSON
  const backupDir = path.join(__dirname, "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupFilePath = path.join(backupDir, `base64-backup-${timestamp}.json`)

  fs.writeFileSync(
    backupFilePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        menuItemsCount: menuItems.length,
        ordersCount: orders.length,
        menuItems: menuItems.map((i) => ({ id: i.id, name: i.name, imageLength: i.image?.length })),
        orders: orders.map((o) => ({ id: o.id, proofLength: o.paymentProofImage?.length })),
      },
      null,
      2
    ),
    "utf-8"
  )
  console.log(`Base64 backup saved to: ${backupFilePath}`)

  // 3. Convert Base64 MenuItems to Cloudinary
  let migratedItemsCount = 0
  for (const item of menuItems) {
    if (item.image && item.image.startsWith("data:image/")) {
      try {
        const uploadResult = await cloudinary.uploader.upload(item.image, {
          folder: "rivix/menu-items",
          transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
        })

        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: uploadResult.secure_url },
        })
        migratedItemsCount++
      } catch (err) {
        console.error(`Failed to upload MenuItem image for ${item.id}:`, err)
      }
    }
  }

  // 4. Convert Base64 Orders to Cloudinary
  let migratedOrdersCount = 0
  for (const order of orders) {
    if (order.paymentProofImage && order.paymentProofImage.startsWith("data:image/")) {
      try {
        const uploadResult = await cloudinary.uploader.upload(order.paymentProofImage, {
          folder: "rivix/payment-proofs",
          transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
        })

        await prisma.order.update({
          where: { id: order.id },
          data: { paymentProofImage: uploadResult.secure_url },
        })
        migratedOrdersCount++
      } catch (err) {
        console.error(`Failed to upload Order payment proof image for ${order.id}:`, err)
      }
    }
  }

  console.log(`\n==================================================`)
  console.log(`MIGRATION COMPLETED SUCCESSFULLY:`)
  console.log(`- MenuItems Migrated: ${migratedItemsCount}/${menuItems.length}`)
  console.log(`- Orders Payment Proofs Migrated: ${migratedOrdersCount}/${orders.length}`)
  console.log(`==================================================`)
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting menu backup process...")

  const restaurants = await prisma.restaurant.findMany({
    include: {
      branches: {
        include: {
          menuCategories: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  const categories = await prisma.menuCategory.findMany({
    include: {
      items: true,
      branch: {
        include: {
          restaurant: true,
        },
      },
    },
  })

  const items = await prisma.menuItem.findMany({
    include: {
      category: {
        include: {
          branch: true,
        },
      },
    },
  })

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      restaurants: restaurants.length,
      categories: categories.length,
      items: items.length,
    },
    restaurants,
    categories,
    items,
  }

  const backupDir = path.join(__dirname, "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupFilePath = path.join(backupDir, `menu-backup-${timestamp}.json`)

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf-8")
  console.log(`Backup created successfully at: ${backupFilePath}`)

  // Search for "عم عيسى" specifically
  const eissaRestaurant = restaurants.find(
    (r) => r.name.includes("عم عيسى") || r.slug.includes("eissa") || r.slug.includes("om-eissa") || r.name.includes("عيسى")
  )

  if (eissaRestaurant) {
    console.log(`Found restaurant "عم عيسى": ID ${eissaRestaurant.id}, Name: ${eissaRestaurant.name}, Slug: ${eissaRestaurant.slug}`)
    let eissaCategoryCount = 0
    let eissaItemCount = 0
    for (const b of eissaRestaurant.branches) {
      eissaCategoryCount += b.menuCategories.length
      for (const c of b.menuCategories) {
        eissaItemCount += c.items.length
      }
    }
    console.log(`"عم عيسى" has ${eissaRestaurant.branches.length} branches, ${eissaCategoryCount} categories, and ${eissaItemCount} items backed up.`)
  } else {
    console.log(`Warning: Restaurant containing "عم عيسى" or "عيسى" not found by name match. Total restaurants: ${restaurants.length}`)
  }
}

main()
  .catch((e) => {
    console.error("Backup failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

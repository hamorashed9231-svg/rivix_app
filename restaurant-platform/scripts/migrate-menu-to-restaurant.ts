import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

interface CategoryMergeDecision {
  restaurantId: string
  restaurantName: string
  canonicalCategoryName: string
  action: "CREATED_NEW" | "REUSED_EXISTING"
  sourceCategoryIds: string[]
  itemCount: number
}

interface PriceConflict {
  restaurantName: string
  categoryName: string
  itemName: string
  primaryBranchName: string
  basePrice: number
  conflictingBranchName: string
  overridePrice: number
}

interface BorderlineCategoryMatch {
  restaurantName: string
  cat1Name: string
  cat1Id: string
  cat2Name: string
  cat2Id: string
  reason: string
}

async function main() {
  const isExecute = process.argv.includes("--execute") || process.env.EXECUTE === "true"
  const isDryRun = !isExecute
  console.log(`==================================================`)
  console.log(`MENU MIGRATION MODE: ${isDryRun ? "DRY-RUN (NO DB MUTATIONS)" : "REAL EXECUTION (TRANSACTIONAL)"}`)
  console.log(`==================================================`)

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

  const categoryMergeDecisions: CategoryMergeDecision[] = []
  const priceConflicts: PriceConflict[] = []
  const borderlineMatches: BorderlineCategoryMatch[] = []
  const migrationSummary: any[] = []

  // Check borderline matches across categories per restaurant
  for (const restaurant of restaurants) {
    const allCatNames: { name: string; id: string; branchName: string }[] = []
    for (const b of restaurant.branches) {
      for (const cat of b.menuCategories) {
        allCatNames.push({ name: cat.name, id: cat.id, branchName: b.name })
      }
    }

    for (let i = 0; i < allCatNames.length; i++) {
      for (let j = i + 1; j < allCatNames.length; j++) {
        const c1 = allCatNames[i]
        const c2 = allCatNames[j]
        const norm1 = c1.name.trim().toLowerCase()
        const norm2 = c2.name.trim().toLowerCase()

        if (norm1 !== norm2) {
          // Check if one contains the other or lev distance / partial match
          if (norm1.includes(norm2) || norm2.includes(norm1) || (norm1.length > 3 && norm2.length > 3 && norm1.slice(0, 4) === norm2.slice(0, 4))) {
            borderlineMatches.push({
              restaurantName: restaurant.name,
              cat1Name: c1.name,
              cat1Id: c1.id,
              cat2Name: c2.name,
              cat2Id: c2.id,
              reason: "Partial name or prefix similarity",
            })
          }
        }
      }
    }
  }

  for (const restaurant of restaurants) {
    console.log(`\nProcessing Restaurant: "${restaurant.name}" (ID: ${restaurant.id})`)
    
    // Group categories by exact normalized name: name.trim().toLowerCase()
    const categoryMap = new Map<string, typeof restaurant.branches[0]["menuCategories"]>()

    for (const branch of restaurant.branches) {
      for (const cat of branch.menuCategories) {
        const normName = cat.name.trim().toLowerCase()
        if (!categoryMap.has(normName)) {
          categoryMap.set(normName, [])
        }
        categoryMap.get(normName)!.push(cat)
      }
    }

    const restaurantReport: any = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      branchesCount: restaurant.branches.length,
      categoriesBefore: restaurant.branches.reduce((sum, b) => sum + b.menuCategories.length, 0),
      itemsBefore: restaurant.branches.reduce((sum, b) => sum + b.menuCategories.reduce((s, c) => s + c.items.length, 0), 0),
      categoriesMerged: [],
    }

    for (const [normName, catGroup] of categoryMap.entries()) {
      const canonicalName = catGroup[0].name.trim()
      const primaryCat = catGroup[0]
      const sourceIds = catGroup.map((c) => c.id)

      categoryMergeDecisions.push({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        canonicalCategoryName: canonicalName,
        action: catGroup.length > 1 ? "REUSED_EXISTING" : "CREATED_NEW",
        sourceCategoryIds: sourceIds,
        itemCount: catGroup.reduce((sum, c) => sum + c.items.length, 0),
      })

      // Check item price conflicts across merged categories
      const itemMap = new Map<string, { item: typeof catGroup[0]["items"][0]; branchName: string }[]>()
      for (const cat of catGroup) {
        const branchName = restaurant.branches.find((b) => b.menuCategories.some((c) => c.id === cat.id))?.name || "Unknown Branch"
        for (const item of cat.items) {
          const normItemName = item.name.trim().toLowerCase()
          if (!itemMap.has(normItemName)) {
            itemMap.set(normItemName, [])
          }
          itemMap.get(normItemName)!.push({ item, branchName })
        }
      }

      for (const [normItemName, itemOccurrences] of itemMap.entries()) {
        if (itemOccurrences.length > 1) {
          const primaryPrice = itemOccurrences[0].item.price
          for (let k = 1; k < itemOccurrences.length; k++) {
            if (itemOccurrences[k].item.price !== primaryPrice) {
              priceConflicts.push({
                restaurantName: restaurant.name,
                categoryName: canonicalName,
                itemName: itemOccurrences[0].item.name,
                primaryBranchName: itemOccurrences[0].branchName,
                basePrice: primaryPrice,
                conflictingBranchName: itemOccurrences[k].branchName,
                overridePrice: itemOccurrences[k].item.price,
              })
            }
          }
        }
      }

      restaurantReport.categoriesMerged.push({
        canonicalName,
        sourceCategoriesCount: catGroup.length,
        itemsCount: catGroup.reduce((sum, c) => sum + c.items.length, 0),
      })
    }

    migrationSummary.push(restaurantReport)
  }

  const report = {
    timestamp: new Date().toISOString(),
    isDryRun,
    summary: {
      totalRestaurants: restaurants.length,
      categoryMergeDecisionsCount: categoryMergeDecisions.length,
      priceConflictsCount: priceConflicts.length,
      borderlineMatchesCount: borderlineMatches.length,
    },
    borderlineCategoryMatches: borderlineMatches,
    priceConflicts,
    categoryMergeDecisions,
    restaurantsSummary: migrationSummary,
  }

  const reportDir = path.join(__dirname, "backups")
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportFilePath = path.join(reportDir, `menu-migration-report.json`)
  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), "utf-8")
  console.log(`\n==================================================`)
  console.log(`DRY-RUN REPORT GENERATED SUCCESSFULLY AT:`)
  console.log(reportFilePath)
  console.log(`==================================================`)
  console.log(`Summary:`)
  console.log(`- Total Restaurants: ${report.summary.totalRestaurants}`)
  console.log(`- Category Merge Decisions: ${report.summary.categoryMergeDecisionsCount}`)
  console.log(`- Price Conflicts Detected: ${report.summary.priceConflictsCount}`)
  console.log(`- Borderline Category Matches: ${report.summary.borderlineMatchesCount}`)

  // Search for "عم عيسى" details specifically
  const eissaSummary = migrationSummary.find((s) => s.restaurantName.includes("عيسى") || s.restaurantName.includes("عم عيسى"))
  if (eissaSummary) {
    console.log(`\n--------------------------------------------------`)
    console.log(`SPECIFIC REPORT FOR "عم عيسى":`)
    console.log(`- Restaurant ID: ${eissaSummary.restaurantId}`)
    console.log(`- Branches Count: ${eissaSummary.branchesCount}`)
    console.log(`- Categories Count: ${eissaSummary.categoriesBefore}`)
    console.log(`- Items Count: ${eissaSummary.itemsBefore}`)
    console.log(`--------------------------------------------------`)
  }

  if (!isDryRun) {
    console.log("\nExecuting REAL migration inside a single Prisma Transaction...")
    await prisma.$transaction(
      async (tx) => {
        const branchMenuItemsToCreate: { branchId: string; menuItemId: string; isAvailable: boolean }[] = []

        for (const restaurant of restaurants) {
          const categoryMap = new Map<string, typeof restaurant.branches[0]["menuCategories"]>()
          for (const branch of restaurant.branches) {
            for (const cat of branch.menuCategories) {
              const normName = cat.name.trim().toLowerCase()
              if (!categoryMap.has(normName)) {
                categoryMap.set(normName, [])
              }
              categoryMap.get(normName)!.push(cat)
            }
          }

          for (const [normName, catGroup] of categoryMap.entries()) {
            const canonicalName = catGroup[0].name.trim()
            const primaryCat = catGroup[0]

            // 1. Link primary category with restaurantId
            await tx.menuCategory.update({
              where: { id: primaryCat.id },
              data: {
                restaurantId: restaurant.id,
                name: canonicalName,
              },
            })

            // Handle items
            for (const cat of catGroup) {
              for (const item of cat.items) {
                if (cat.id !== primaryCat.id) {
                  await tx.menuItem.update({
                    where: { id: item.id },
                    data: { categoryId: primaryCat.id },
                  })
                }

                const branch = restaurant.branches.find((b) => b.menuCategories.some((c) => c.id === cat.id))
                if (branch) {
                  branchMenuItemsToCreate.push({
                    branchId: branch.id,
                    menuItemId: item.id,
                    isAvailable: item.isAvailable,
                  })
                }
              }
            }
          }
        }

        if (branchMenuItemsToCreate.length > 0) {
          console.log(`Bulk inserting ${branchMenuItemsToCreate.length} BranchMenuItem records...`)
          await tx.branchMenuItem.createMany({
            data: branchMenuItemsToCreate,
            skipDuplicates: true,
          })
        }
      },
      {
        timeout: 60000,
        maxWait: 10000,
      }
    )
    console.log("REAL Migration Transaction completed successfully!")
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

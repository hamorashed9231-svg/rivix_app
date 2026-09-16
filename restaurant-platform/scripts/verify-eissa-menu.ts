import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting verification for 'عم عيسى' menu after migration...")

  const backupDir = path.join(__dirname, "backups")
  const backupFiles = fs.readdirSync(backupDir).filter((f) => f.startsWith("menu-backup-"))
  if (backupFiles.length === 0) {
    throw new Error("No backup files found to verify against!")
  }
  const latestBackupPath = path.join(backupDir, backupFiles.sort().reverse()[0])
  const backupData = JSON.parse(fs.readFileSync(latestBackupPath, "utf-8"))

  const eissaBackup = backupData.restaurants.find(
    (r: any) => r.name.includes("عم عيسى") || r.name.includes("عيسى")
  )

  if (!eissaBackup) {
    throw new Error("Could not find 'عم عيسى' in backup file!")
  }

  const eissaCurrent = await prisma.restaurant.findUnique({
    where: { id: eissaBackup.id },
    include: {
      menuCategories: {
        include: {
          items: {
            include: {
              branchItems: true,
            },
          },
        },
      },
      branches: {
        include: {
          branchMenuItems: true,
          menuCategories: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!eissaCurrent) {
    throw new Error("Could not find 'عم عيسى' in production database!")
  }

  console.log(`\n==================================================`)
  console.log(`VERIFICATION REPORT FOR "${eissaCurrent.name}" (ID: ${eissaCurrent.id})`)
  console.log(`==================================================`)

  const currentCatCount = eissaCurrent.menuCategories.length
  let currentItemCount = 0
  let branchMenuItemsCount = 0

  for (const cat of eissaCurrent.menuCategories) {
    currentItemCount += cat.items.length
    for (const item of cat.items) {
      branchMenuItemsCount += item.branchItems.length
    }
  }

  let backupCatCount = 0
  let backupItemCount = 0
  for (const b of eissaBackup.branches) {
    backupCatCount += b.menuCategories.length
    for (const c of b.menuCategories) {
      backupItemCount += c.items.length
    }
  }

  console.log(`- Backup Categories Count: ${backupCatCount} | Current Categories Count: ${currentCatCount}`)
  console.log(`- Backup Items Count:      ${backupItemCount} | Current Items Count:      ${currentItemCount}`)
  console.log(`- BranchMenuItem Junction Rows: ${branchMenuItemsCount}`)

  let isIntact = true

  if (currentCatCount !== backupCatCount) {
    console.error(`❌ Category count mismatch! Expected ${backupCatCount}, got ${currentCatCount}`)
    isIntact = false
  } else {
    console.log(`✓ Category count matches perfectly (${currentCatCount})`)
  }

  if (currentItemCount !== backupItemCount) {
    console.error(`❌ Item count mismatch! Expected ${backupItemCount}, got ${currentItemCount}`)
    isIntact = false
  } else {
    console.log(`✓ Item count matches perfectly (${currentItemCount})`)
  }

  if (branchMenuItemsCount !== backupItemCount) {
    console.error(`❌ BranchMenuItem count mismatch! Expected ${backupItemCount}, got ${branchMenuItemsCount}`)
    isIntact = false
  } else {
    console.log(`✓ BranchMenuItem junction rows match item count (${branchMenuItemsCount})`)
  }

  if (isIntact) {
    console.log(`\n🎉 SUCCESS: "عم عيسى"'s menu data is 100% INTACT & PROPERLY MIGRATED!`)
  } else {
    console.error(`\n⚠️ WARNING: Issues detected during verification!`)
  }
}

main()
  .catch((e) => {
    console.error("Verification error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

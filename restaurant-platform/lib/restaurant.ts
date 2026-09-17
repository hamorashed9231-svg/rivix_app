import { prisma } from "@/lib/prisma"

export async function getDefaultBranch(restaurantId: string) {
  if (!restaurantId) return null

  let branch = await prisma.branch.findFirst({
    where: {
      restaurantId,
      isActive: true,
    },
    orderBy: {
      id: "asc",
    },
  })

  // Fallback: if no active branch exists, find any branch
  if (!branch) {
    branch = await prisma.branch.findFirst({
      where: { restaurantId },
      orderBy: { id: "asc" },
    })
  }

  // Auto-create default branch if restaurant currently has no branches
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        restaurantId,
        name: "الفرع الرئيسي",
        address: "الفرع الرئيسي - يرجى تحديد الموقع على الخريطة",
        phone: "0500000000",
        lat: null,
        lng: null,
        openingHours: { open: "10:00 AM", close: "12:00 AM" },
        isActive: false, // Inactive until location is set via map picker
      },
    })
  }

  return branch
}

export async function getActiveBranches(restaurantId: string) {
  if (!restaurantId) return []

  return await prisma.branch.findMany({
    where: {
      restaurantId,
      isActive: true,
      lat: { not: null },
      lng: { not: null },
    },
    orderBy: {
      id: "asc",
    },
  })
}

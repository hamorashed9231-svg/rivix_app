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
        address: "الفرع الرئيسي",
        phone: "0500000000",
        lat: 24.7136,
        lng: 46.6753,
        openingHours: { open: "10:00 AM", close: "12:00 AM" },
        isActive: true,
      },
    })
  }

  return branch
}

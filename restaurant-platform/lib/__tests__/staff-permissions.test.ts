import { describe, it, expect, vi, beforeEach } from "vitest"
import { getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    restaurant: {
      findUnique: vi.fn(),
    },
    restaurantStaff: {
      findUnique: vi.fn(),
    },
  },
}))

describe("getRestaurantAccess Role & Permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("grants owner level access to admin users", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "admin" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "owner_123" } as any)

    const access = await getRestaurantAccess("user_admin", "rest_1")
    expect(access).toBe("owner")
  })

  it("grants owner level access to restaurant_admin users", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "restaurant_admin" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "owner_123" } as any)

    const access = await getRestaurantAccess("user_rest_admin", "rest_1")
    expect(access).toBe("owner")
  })

  it("grants owner level access to the actual restaurant owner", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "restaurant_owner" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "user_owner" } as any)

    const access = await getRestaurantAccess("user_owner", "rest_1")
    expect(access).toBe("owner")
  })

  it("returns manager level access for active staff with manager role", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "customer" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "other_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue({
      staffRole: "manager",
      isActive: true,
    } as any)

    const access = await getRestaurantAccess("user_mgr", "rest_1")
    expect(access).toBe("manager")
  })

  it("returns staff level access for active staff with staff role", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "customer" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "other_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue({
      staffRole: "staff",
      isActive: true,
    } as any)

    const access = await getRestaurantAccess("user_staff", "rest_1")
    expect(access).toBe("staff")
  })

  it("returns null for supervisor users trying to access restaurant dashboard", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "supervisor" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "other_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue(null)

    const access = await getRestaurantAccess("user_supervisor", "rest_1")
    expect(access).toBeNull()
  })

  it("returns null for inactive staff members", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "customer" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "other_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue({
      staffRole: "manager",
      isActive: false,
    } as any)

    const access = await getRestaurantAccess("user_inactive", "rest_1")
    expect(access).toBeNull()
  })
})

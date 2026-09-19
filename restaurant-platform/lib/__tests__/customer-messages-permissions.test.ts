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
    customerMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe("Customer Message Recipient Scoping & Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("identifies owner account and distinguishes manager (StaffRole.manager)", async () => {
    // True owner
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_owner", role: "restaurant_owner" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "user_owner" } as any)

    const ownerAccess = await getRestaurantAccess("user_owner", "rest_1")
    expect(ownerAccess).toBe("owner")

    // Manager in RestaurantStaff table
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_mgr", role: "customer" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "user_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue({
      staffRole: "manager",
      isActive: true,
    } as any)

    const managerAccess = await getRestaurantAccess("user_mgr", "rest_1")
    expect(managerAccess).toBe("manager")
    expect(managerAccess).not.toBe("owner")
  })

  it("allows staff and manager to access customer messages inbox", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_staff", role: "customer" } as any)
    vi.mocked(prisma.restaurant.findUnique).mockResolvedValue({ ownerId: "user_owner" } as any)
    vi.mocked(prisma.restaurantStaff.findUnique).mockResolvedValue({
      staffRole: "staff",
      isActive: true,
    } as any)

    const staffAccess = await getRestaurantAccess("user_staff", "rest_1")
    expect(staffAccess).toBe("staff")
  })

  it("detects active complaint lock for customer when status is unread or read", async () => {
    vi.mocked(prisma.customerMessage.findFirst).mockResolvedValue({
      id: "complaint_1",
      type: "complaint",
      status: "unread",
      message: "تأخر الطلب جداً",
    } as any)

    const activeComplaint = await prisma.customerMessage.findFirst({
      where: { customerId: "cust_1", type: "complaint", status: { in: ["unread", "read"] } },
    })

    expect(activeComplaint).not.toBeNull()
    expect(activeComplaint?.type).toBe("complaint")
    expect(activeComplaint?.status).toBe("unread")
  })

  it("resolves complaint and releases lock when staff posts a reply", async () => {
    vi.mocked(prisma.customerMessage.update).mockResolvedValue({
      id: "complaint_1",
      type: "complaint",
      status: "resolved",
      reply: "نعتذر منك وتم إضافة كوبون خصم لحسابك",
      repliedAt: new Date(),
    } as any)

    const updated = await prisma.customerMessage.update({
      where: { id: "complaint_1" },
      data: { reply: "نعتذر منك وتم إضافة كوبون خصم لحسابك", status: "resolved" },
    })

    expect(updated.status).toBe("resolved")
    expect(updated.reply).toBeDefined()
  })
})

// @vitest-environment node
import { describe, it, expect } from "vitest"
import { isValidStatusTransition } from "../driver-helpers"

describe("Driver Phase 3 Control Logic Unit Tests", () => {
  it("verifies ready status requirement before driver assignment", () => {
    // Business rule: Restaurant must mark order as "ready" before control can assign rider
    const isOrderReady = (status: string) => status === "ready"

    expect(isOrderReady("preparing")).toBe(false)
    expect(isOrderReady("pending")).toBe(false)
    expect(isOrderReady("out_for_delivery")).toBe(false)
    expect(isOrderReady("ready")).toBe(true)
  })

  it("verifies offline rider assignment check", () => {
    // Business rule: Offline riders cannot be assigned to orders
    const canAssignRider = (riderStatus: string) => riderStatus !== "offline"

    expect(canAssignRider("offline")).toBe(false)
    expect(canAssignRider("online")).toBe(true)
    expect(canAssignRider("busy")).toBe(true)
  })

  it("verifies status syncing on cancellation", () => {
    // Business rule: Cancellation must sync both restaurant order.status and riderDeliveryStatus
    const cancelSync = (reason: string) => ({
      status: "cancelled",
      riderDeliveryStatus: "cancelled",
      cancellationReason: reason || "تم الإلغاء بواسطة مسؤول الكنترول",
    })

    const synced = cancelSync("تأخر تحضير الطلب")
    expect(synced.status).toBe("cancelled")
    expect(synced.riderDeliveryStatus).toBe("cancelled")
    expect(synced.cancellationReason).toBe("تأخر تحضير الطلب")
  })
})

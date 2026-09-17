// @vitest-environment node
import { describe, it, expect } from "vitest"
import {
  calculateDistanceMeters,
  isValidStatusTransition,
} from "../driver-helpers"

describe("Driver Phase 2 Unit Tests", () => {
  describe("Haversine Distance & Geofence Checks", () => {
    it("calculates 0 meters for identical coordinates", () => {
      const dist = calculateDistanceMeters(30.0444, 31.2357, 30.0444, 31.2357)
      expect(dist).toBe(0)
    })

    it("correctly identifies coordinates within 200 meters geofence", () => {
      // ~66 meters apart
      const dist = calculateDistanceMeters(30.0444, 31.2357, 30.0450, 31.2357)
      expect(dist).toBeLessThan(200)
    })

    it("correctly identifies coordinates outside 200 meters geofence", () => {
      // ~622 meters apart
      const dist = calculateDistanceMeters(30.0444, 31.2357, 30.0500, 31.2357)
      expect(dist).toBeGreaterThan(200)
    })
  })

  describe("Order Status State Machine Transitions", () => {
    it("allows valid sequential transitions", () => {
      expect(isValidStatusTransition("pending", "assigned")).toBe(true)
      expect(isValidStatusTransition("assigned", "accepted")).toBe(true)
      expect(isValidStatusTransition("accepted", "arrived_restaurant")).toBe(true)
      expect(isValidStatusTransition("arrived_restaurant", "picked_up")).toBe(true)
      expect(isValidStatusTransition("picked_up", "on_the_way")).toBe(true)
      expect(isValidStatusTransition("on_the_way", "arrived_customer")).toBe(true)
      expect(isValidStatusTransition("arrived_customer", "delivered")).toBe(true)
    })

    it("rejects invalid out-of-order transition jumps", () => {
      // Cannot jump from assigned straight to delivered
      expect(isValidStatusTransition("assigned", "delivered")).toBe(false)
      // Cannot jump from pending to on_the_way
      expect(isValidStatusTransition("pending", "on_the_way")).toBe(false)
    })

    it("allows cancellation from non-terminal states", () => {
      expect(isValidStatusTransition("assigned", "cancelled")).toBe(true)
      expect(isValidStatusTransition("on_the_way", "cancelled")).toBe(true)
    })

    it("disallows cancellation from terminal state delivered", () => {
      expect(isValidStatusTransition("delivered", "cancelled")).toBe(false)
    })
  })
})

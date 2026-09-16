import { describe, it, expect } from 'vitest'
import {
  calculateHaversineDistance,
  calculateDeliveryForCustomer,
  BranchDeliverySettings,
} from '../delivery-calculator'

describe('Delivery Calculator Unit Tests', () => {
  const sampleBranch: BranchDeliverySettings = {
    id: 'branch-1',
    name: 'الفرع الرئيسي - الرياض',
    lat: 24.7136,
    lng: 46.6753,
    deliveryRadiusKm: 10.0,
    baseDeliveryFee: 15.0,
    feePerKm: 3.0,
    isActive: true,
  }

  it('calculates distance accurately using Haversine formula', () => {
    // Distance between same coordinates is 0
    expect(calculateHaversineDistance(24.7136, 46.6753, 24.7136, 46.6753)).toBe(0)

    // Distance between Riyadh center and ~5km away
    const dist = calculateHaversineDistance(24.7136, 46.6753, 24.7500, 46.7000)
    expect(dist).toBeGreaterThan(4)
    expect(dist).toBeLessThan(6)
  })

  it('approves delivery and calculates fee when customer is within radius circle', () => {
    // Customer ~4.8 km away
    const res = calculateDeliveryForCustomer(24.7500, 46.7000, [sampleBranch])

    expect(res.isWithinRadius).toBe(true)
    expect(res.distanceKm).toBeGreaterThan(0)
    expect(res.distanceKm).toBeLessThanOrEqual(10.0)
    // deliveryFee = 15 + (distance * 3)
    expect(res.deliveryFee).toBeGreaterThan(15.0)
  })

  it('blocks delivery when customer is outside radius circle', () => {
    // Customer far away (e.g. 50 km away in another city)
    const farCustomer = { lat: 25.2000, lng: 47.2000 }
    const res = calculateDeliveryForCustomer(farCustomer.lat, farCustomer.lng, [sampleBranch])

    expect(res.isWithinRadius).toBe(false)
    expect(res.reason).toContain('ويقع خارج نطاق التوصيل المتاح لفرعنا')
  })
})

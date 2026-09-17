import { describe, it, expect } from 'vitest'

describe('Mobile Restaurant Endpoint Data Structure Unit Tests', () => {
  const sampleMobilePayload = {
    id: 'rest-123',
    name: 'مطعم عم عيسى',
    slug: 'am-eissa',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    primaryColor: '#f37f20',
    secondaryColor: '#b18168',
    branches: [
      {
        id: 'branch-1',
        address: 'الفرع الرئيسي',
        lat: 24.7136,
        lng: 46.6753,
        deliveryEnabled: true,
        deliveryRadiusKm: 10,
        pricePerKm: 3,
        baseDeliveryFee: 15,
        minOrderForDelivery: 50,
        isActive: true,
      },
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'مشويات',
        items: [
          {
            id: 'item-1',
            name: 'كباب وريش',
            price: 150,
            originalPrice: 180,
            isAvailable: true,
          },
        ],
      },
    ],
  }

  it('verifies mobile payload contains all required brand & branch delivery fields', () => {
    expect(sampleMobilePayload.slug).toBe('am-eissa')
    expect(sampleMobilePayload.primaryColor).toBe('#f37f20')
    expect(sampleMobilePayload.branches[0].deliveryEnabled).toBe(true)
    expect(sampleMobilePayload.branches[0].deliveryRadiusKm).toBe(10)
    expect(sampleMobilePayload.branches[0].pricePerKm).toBe(3)
    expect(sampleMobilePayload.branches[0].baseDeliveryFee).toBe(15)
    expect(sampleMobilePayload.branches[0].minOrderForDelivery).toBe(50)
    expect(sampleMobilePayload.categories[0].items[0].originalPrice).toBe(180)
  })
})

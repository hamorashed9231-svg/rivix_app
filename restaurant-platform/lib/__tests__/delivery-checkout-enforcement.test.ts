import { describe, it, expect } from 'vitest';
import { calculateDeliveryForCustomer, isInvalidLocation } from '../delivery-calculator';

describe('Delivery Checkout Enforcement & Placeholder Invalidation', () => {
  const branchElSeyof = {
    id: 'branch-seyof-1',
    name: 'فرع السيوف',
    address: 'شارع مصطفى كامل، السيوف، الإسكندرية',
    lat: 31.240346,
    lng: 29.993331,
    phone: '01000000000',
    openingHours: {},
    isActive: true,
    deliveryEnabled: true,
    deliveryRadiusKm: 5.0,
    baseDeliveryFee: 20.0,
    pricePerKm: 5.0,
    minOrderForDelivery: 0.0,
  };

  it('rejects Cairo placeholder coordinates (30.0444, 31.2357) with location selection prompt', () => {
    const result = calculateDeliveryForCustomer(30.0444, 31.2357, [branchElSeyof]);
    expect(result.isWithinRadius).toBe(false);
    expect(result.reason).toBe('من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل');
    expect(isInvalidLocation(30.0444, 31.2357)).toBe(true);
  });

  it('rejects Riyadh placeholder coordinates (24.7136, 46.6753) with location selection prompt', () => {
    const result = calculateDeliveryForCustomer(24.7136, 46.6753, [branchElSeyof]);
    expect(result.isWithinRadius).toBe(false);
    expect(result.reason).toBe('من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل');
    expect(isInvalidLocation(24.7136, 46.6753)).toBe(true);
  });

  it('rejects zero/null coordinates (0, 0)', () => {
    const result = calculateDeliveryForCustomer(0, 0, [branchElSeyof]);
    expect(result.isWithinRadius).toBe(false);
    expect(result.reason).toBe('من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل');
    expect(isInvalidLocation(0, 0)).toBe(true);
  });

  it('calculates correct delivery fee for address near فرع السيوف (e.g. 1.5 km away)', () => {
    // Coordinate ~1.5 km from El Seyof branch (31.240346, 29.993331)
    const customerLat = 31.248;
    const customerLng = 29.998;

    const result = calculateDeliveryForCustomer(customerLat, customerLng, [branchElSeyof]);
    expect(result.isWithinRadius).toBe(true);
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.distanceKm).toBeLessThanOrEqual(5.0);
    // fee = 20 + distanceKm * 5
    const expectedFee = Math.round((20.0 + result.distanceKm * 5.0) * 100) / 100;
    expect(result.deliveryFee).toBe(expectedFee);
  });

  it('rejects order for customer address far outside branch delivery radius (e.g. Cairo customer for Alexandria branch)', () => {
    const cairoCustomerLat = 30.05;
    const cairoCustomerLng = 31.24;

    const result = calculateDeliveryForCustomer(cairoCustomerLat, cairoCustomerLng, [branchElSeyof]);
    expect(result.isWithinRadius).toBe(false);
    expect(result.reason).toContain('خارج نطاق التوصيل');
  });
});

import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  findNearestDeliverableBranch,
  calculateDeliveryFee,
  calculateDeliveryForCustomer,
  BranchWithLocation,
} from '../delivery';

describe('Shared Delivery Pricing & Radius Math', () => {
  const branches: BranchWithLocation[] = [
    {
      id: 'branch-1',
      name: 'Branch Center',
      lat: 30.0444, // Cairo Center
      lng: 31.2357,
      deliveryEnabled: true,
      deliveryRadiusKm: 5.0,
      baseDeliveryFee: 10.0,
      pricePerKm: 2.0,
      isActive: true,
    },
    {
      id: 'branch-2',
      name: 'Branch East',
      lat: 30.0500,
      lng: 31.3000, // ~6km away from Center
      deliveryEnabled: true,
      deliveryRadiusKm: 10.0,
      baseDeliveryFee: 15.0,
      pricePerKm: 3.0,
      isActive: true,
    },
  ];

  it('calculates Haversine distance correctly', () => {
    const dist = haversineKm(30.0444, 31.2357, 30.0444, 31.2357);
    expect(dist).toBe(0);

    const dist6km = haversineKm(30.0444, 31.2357, 30.0500, 31.3000);
    expect(dist6km).toBeGreaterThan(5);
    expect(dist6km).toBeLessThan(7);
  });

  it('returns null when customer is outside all delivery radii', () => {
    // 50km away
    const farLat = 30.5000;
    const farLng = 31.8000;

    const result = findNearestDeliverableBranch(farLat, farLng, branches);
    expect(result).toBeNull();
  });

  it('selects the nearest branch when inside multiple overlapping radii', () => {
    // Location near branch-1 (Cairo Center)
    const nearLat = 30.0450;
    const nearLng = 31.2360;

    const result = findNearestDeliverableBranch(nearLat, nearLng, branches);
    expect(result).not.toBeNull();
    expect(result?.branch.id).toBe('branch-1');
  });

  it('includes exact boundary distance == deliveryRadiusKm', () => {
    const mockBranch: BranchWithLocation = {
      id: 'b-boundary',
      name: 'Boundary Branch',
      lat: 30.0000,
      lng: 31.0000,
      deliveryEnabled: true,
      deliveryRadiusKm: 10.0,
      isActive: true,
    };

    // Construct point where haversineKm returns 10.0
    const pointLat = 30.0900;
    const pointLng = 31.0000;
    const dist = haversineKm(30.0000, 31.0000, pointLat, pointLng);

    const res = findNearestDeliverableBranch(pointLat, pointLng, [{ ...mockBranch, deliveryRadiusKm: dist }]);
    expect(res).not.toBeNull();
    expect(res?.branch.id).toBe('b-boundary');
  });

  it('handles zero or undefined pricePerKm gracefully', () => {
    const feeZero = calculateDeliveryFee(5.0, { baseDeliveryFee: 12.0, pricePerKm: 0 });
    expect(feeZero).toBe(12.0);

    const feeUndefined = calculateDeliveryFee(5.0, { baseDeliveryFee: 15.0, pricePerKm: undefined });
    expect(feeUndefined).toBe(15.0);
  });

  it('calculates dynamic delivery fee using baseDeliveryFee + distanceKm * pricePerKm', () => {
    const fee = calculateDeliveryFee(4.5, { baseDeliveryFee: 10.0, pricePerKm: 2.0 });
    expect(fee).toBe(19.0);
  });
});

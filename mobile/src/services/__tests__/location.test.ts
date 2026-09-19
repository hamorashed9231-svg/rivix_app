import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Location from 'expo-location';
import { getCurrentLocation } from '../location';

vi.mock('expo-location', () => ({
  hasServicesEnabledAsync: vi.fn(),
  getForegroundPermissionsAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  getLastKnownPositionAsync: vi.fn(),
  Accuracy: {
    Balanced: 3,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

describe('Location Service with Stale Location Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns live location with isStale: false when live GPS lock succeeds', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: 31.2, longitude: 29.9 },
      timestamp: Date.now(),
    } as any);

    const result = await getCurrentLocation();

    expect(result).not.toBeNull();
    expect(result?.latitude).toBe(31.2);
    expect(result?.longitude).toBe(29.9);
    expect(result?.isStale).toBe(false);
  });

  it('falls back to last known position and sets isStale: true if timestamp > 15 minutes old', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({ status: 'granted' } as any);
    // Live GPS fails / times out
    vi.mocked(Location.getCurrentPositionAsync).mockRejectedValue(new Error('GPS timeout'));

    const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
    vi.mocked(Location.getLastKnownPositionAsync).mockResolvedValue({
      coords: { latitude: 30.0, longitude: 31.2 },
      timestamp: twentyMinsAgo,
    } as any);

    const result = await getCurrentLocation();

    expect(result).not.toBeNull();
    expect(result?.latitude).toBe(30.0);
    expect(result?.longitude).toBe(31.2);
    expect(result?.isStale).toBe(true);
  });

  it('safely resolves with null when location services check throws an error', async () => {
    vi.mocked(Location.hasServicesEnabledAsync).mockRejectedValue(new Error('Bridge error'));
    vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ status: 'denied' } as any);

    const result = await getCurrentLocation();
    expect(result).toBeNull();
  });
});

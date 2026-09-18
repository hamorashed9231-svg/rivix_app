export {
  haversineKm as calculateHaversineDistance,
  calculateDeliveryForCustomer,
  findNearestDeliverableBranch,
  calculateDeliveryFee,
} from '@rivix/shared';

export function isInvalidLocation(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return true;
  if (lat === 0 && lng === 0) return true;
  if (Math.abs(lat - 30.0444) < 0.0001 && Math.abs(lng - 31.2357) < 0.0001) return true;
  if (Math.abs(lat - 24.7136) < 0.0001 && Math.abs(lng - 46.6753) < 0.0001) return true;
  return false;
}

export type {
  BranchDeliverySettings,
  DeliveryCoverageResult,
} from '@rivix/shared';

export interface TenantConfig {
  restaurantSlug: string | null;
  appName: string;
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  isMultiVendor: boolean;
}

/**
 * OWNER BRANDED TENANT CONFIG:
 * - Setting `restaurantSlug` to an owner's restaurant slug (e.g., 'am-eissa') locks the mobile app
 *   to that specific restaurant owner. The logo, name, primary/secondary colors, branches and direct menu
 *   will load dynamically for this owner.
 * - Setting `restaurantSlug` to null or 'multi-vendor' runs the app in Multi-Vendor Discovery Mode.
 */
export const TENANT_CONFIG: TenantConfig = {
  restaurantSlug: process.env.EXPO_PUBLIC_TENANT_SLUG || 'am-eissa',
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'مطعم عم عيسى',
  defaultPrimaryColor: '#2196F3',
  defaultSecondaryColor: '#0A1A3C',
  isMultiVendor: Boolean(process.env.EXPO_PUBLIC_TENANT_SLUG === 'multi-vendor'),
};

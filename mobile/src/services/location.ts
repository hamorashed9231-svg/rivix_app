import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  isStale?: boolean;
  timestamp?: number;
}

const STALE_LOCATION_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const GLOBAL_LOCATION_TIMEOUT_MS = 8000; // 8 seconds maximum timeout

/**
 * Requests foreground location permissions.
 * Returns true if granted, false otherwise.
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      console.warn('Location permission denied by user.');
      return false;
    }
    console.log('Location permission granted.');
    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

const fetchLocationInternal = async (): Promise<LocationCoordinates | null> => {
  // 1. Verify device location services (GPS toggle) are enabled safely
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      console.warn('Location services (GPS) are disabled on this device.');
    }
  } catch (err) {
    console.warn('Error checking if location services are enabled:', err);
  }

  // 2. Check and request foreground location permission
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.warn('Cannot fetch current location: permission not granted.');
        return null;
      }
    }
  } catch (permError) {
    console.warn('Error checking/requesting location permissions:', permError);
    return null;
  }

  // 3. Attempt live location fix
  let liveLocation: Location.LocationObject | null = null;
  try {
    liveLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (gpsError) {
    console.warn('Live GPS lock failed or timed out. Trying last known location...', gpsError);
  }

  if (liveLocation && liveLocation.coords) {
    return {
      latitude: liveLocation.coords.latitude,
      longitude: liveLocation.coords.longitude,
      isStale: false,
      timestamp: liveLocation.timestamp,
    };
  }

  // 4. Fallback to last known position
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown && lastKnown.coords) {
      const timestamp = lastKnown.timestamp;
      const isStale = !!(timestamp && Date.now() - timestamp > STALE_LOCATION_THRESHOLD_MS);

      console.log(`Retrieved last known position. Timestamp: ${timestamp}, isStale: ${isStale}`);

      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        isStale,
        timestamp,
      };
    }
  } catch (lastKnownErr) {
    console.warn('Error fetching last known location:', lastKnownErr);
  }

  console.warn('No location available (live GPS failed and no last known position).');
  return null;
};

/**
 * Obtains the current user coordinates.
 * Wrapped in a global fail-safe timeout (8s) so UI loading states never hang indefinitely,
 * even if native permissions or location service checks hang on the bridge.
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        console.warn('Global location request timed out after 8s.');
        resolve(null);
      }, GLOBAL_LOCATION_TIMEOUT_MS);
    });

    return await Promise.race([fetchLocationInternal(), timeoutPromise]);
  } catch (error) {
    console.error('Error in getCurrentLocation:', error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

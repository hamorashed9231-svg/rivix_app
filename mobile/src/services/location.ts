import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

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

/**
  * Obtains the current user coordinates.
  * Returns { latitude, longitude } or null with an error message if location access fails.
  */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.warn('Cannot fetch current location: permission not granted.');
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

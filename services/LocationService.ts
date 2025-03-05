import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationServiceOptions {
  onLocationUpdate?: (location: LocationCoordinates) => void;
  onError?: (error: string) => void;
  distanceInterval?: number; // in meters
  timeInterval?: number; // in milliseconds
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationCoordinates | null = null;
  private isPermissionGranted: boolean = false;

  constructor() {
    this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web permissions are handled differently
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.isPermissionGranted = status === 'granted';
        return this.isPermissionGranted;
      } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
      }
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.isPermissionGranted = status === 'granted';
        return this.isPermissionGranted;
      } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
      }
    }
  }

  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    if (!this.isPermissionGranted) {
      const granted = await this.requestPermissions();
      if (!granted) {
        return null;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });

      this.lastKnownLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed
      };

      return this.lastKnownLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  startLocationTracking({
    onLocationUpdate,
    onError,
    distanceInterval = 10, // 10 meters
    timeInterval = 5000 // 5 seconds
  }: LocationServiceOptions): void {
    if (!this.isPermissionGranted) {
      this.requestPermissions().then(granted => {
        if (granted) {
          this.startWatching(onLocationUpdate, onError, distanceInterval, timeInterval);
        } else if (onError) {
          onError('Location permission not granted');
        }
      });
    } else {
      this.startWatching(onLocationUpdate, onError, distanceInterval, timeInterval);
    }
  }

  private startWatching(
    onLocationUpdate?: (location: LocationCoordinates) => void,
    onError?: (error: string) => void,
    distanceInterval: number = 10,
    timeInterval: number = 5000
  ): void {
    // Stop any existing watch
    this.stopLocationTracking();

    try {
      this.watchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval,
          timeInterval
        },
        location => {
          this.lastKnownLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed
          };

          if (onLocationUpdate) {
            onLocationUpdate(this.lastKnownLocation);
          }
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      if (onError) {
        onError('Failed to track location');
      }
    }
  }

  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  getLastKnownLocation(): LocationCoordinates | null {
    return this.lastKnownLocation;
  }

  // Calculate distance between two coordinates in meters
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    if (lat1 === lat2 && lon1 === lon2) {
      return 0;
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  // Get bearing between two coordinates in degrees
  calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lon1 * Math.PI) / 180;
    const λ2 = (lon2 * Math.PI) / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360;

    return bearing;
  }

  // Convert bearing to cardinal direction
  bearingToDirection(bearing: number): string {
    const directions = [
      'North',
      'Northeast',
      'East',
      'Southeast',
      'South',
      'Southwest',
      'West',
      'Northwest',
      'North'
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }
}

// Singleton instance
export const locationService = new LocationService();
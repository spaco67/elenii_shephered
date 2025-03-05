import { locationService, LocationCoordinates } from './LocationService';
import { speechService } from './SpeechService';
import { hapticService } from './HapticService';

export interface Destination {
  id: string;
  name: string;
  coordinates: LocationCoordinates;
  description?: string;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distance: number; // in meters
  direction?: string;
  isCompleted: boolean;
}

export interface NavigationOptions {
  onLocationUpdate?: (location: LocationCoordinates) => void;
  onStepChange?: (step: NavigationStep, index: number, total: number) => void;
  onStepCompleted?: (step: NavigationStep, index: number, total: number) => void;
  onArrival?: () => void;
  onError?: (error: string) => void;
  announceSteps?: boolean;
  hapticFeedback?: boolean;
  distanceThreshold?: number; // in meters, for step completion
  updateInterval?: number; // in milliseconds
}

class NavigationService {
  private isNavigating: boolean = false;
  private currentDestination: Destination | null = null;
  private navigationSteps: NavigationStep[] = [];
  private currentStepIndex: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastLocation: LocationCoordinates | null = null;
  
  // Common destinations for demonstration
  private commonDestinations: Destination[] = [
    {
      id: 'grocery-store',
      name: 'Grocery Store',
      coordinates: {
        latitude: 37.78825,
        longitude: -122.4324,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    },
    {
      id: 'park',
      name: 'Park',
      coordinates: {
        latitude: 37.78525,
        longitude: -122.4354,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    },
    {
      id: 'library',
      name: 'Library',
      coordinates: {
        latitude: 37.78925,
        longitude: -122.4374,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    },
    {
      id: 'bus-stop',
      name: 'Bus Stop',
      coordinates: {
        latitude: 37.78625,
        longitude: -122.4304,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    },
    {
      id: 'home',
      name: 'Home',
      coordinates: {
        latitude: 37.78725,
        longitude: -122.4334,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      }
    }
  ];

  constructor() {
    // Initialize with last known location if available
    this.lastLocation = locationService.getLastKnownLocation();
  }

  getAvailableDestinations(): Destination[] {
    return this.commonDestinations;
  }

  getDestinationById(id: string): Destination | null {
    return this.commonDestinations.find(dest => dest.id === id) || null;
  }

  getDestinationByName(name: string): Destination | null {
    return this.commonDestinations.find(dest => dest.name === name) || null;
  }

  async startNavigation(
    destination: Destination | string,
    options: NavigationOptions = {}
  ): Promise<boolean> {
    if (this.isNavigating) {
      this.stopNavigation();
    }

    // Resolve destination if string was provided
    let targetDestination: Destination | null = null;
    if (typeof destination === 'string') {
      // Try to find by ID first, then by name
      targetDestination = this.getDestinationById(destination) || this.getDestinationByName(destination);
    } else {
      targetDestination = destination;
    }

    if (!targetDestination) {
      if (options.onError) {
        options.onError('Invalid destination');
      }
      return false;
    }

    // Get current location
    const currentLocation = await locationService.getCurrentLocation();
    if (!currentLocation) {
      if (options.onError) {
        options.onError('Unable to get current location');
      }
      return false;
    }

    this.lastLocation = currentLocation;
    this.currentDestination = targetDestination;
    this.isNavigating = true;

    // Generate navigation steps
    this.navigationSteps = this.generateNavigationSteps(
      currentLocation,
      targetDestination.coordinates
    );
    this.currentStepIndex = 0;

    // Announce first step
    if (options.announceSteps !== false) {
      speechService.speak(
        `Starting navigation to ${targetDestination.name}. ${this.navigationSteps[0].instruction}`
      );
    }

    // Provide haptic feedback
    if (options.hapticFeedback !== false) {
      hapticService.trigger('medium');
    }

    // Notify of step change
    if (options.onStepChange) {
      options.onStepChange(
        this.navigationSteps[0],
        0,
        this.navigationSteps.length
      );
    }

    // Start location tracking
    this.startLocationTracking(options);

    return true;
  }

  stopNavigation(): void {
    if (!this.isNavigating) {
      return;
    }

    this.isNavigating = false;
    this.currentDestination = null;
    this.navigationSteps = [];
    this.currentStepIndex = 0;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    locationService.stopLocationTracking();
  }

  isNavigationActive(): boolean {
    return this.isNavigating;
  }

  getCurrentDestination(): Destination | null {
    return this.currentDestination;
  }

  getCurrentStep(): NavigationStep | null {
    if (!this.isNavigating || this.navigationSteps.length === 0) {
      return null;
    }
    return this.navigationSteps[this.currentStepIndex];
  }

  getAllSteps(): NavigationStep[] {
    return [...this.navigationSteps];
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.navigationSteps.length;
  }

  moveToNextStep(): boolean {
    if (!this.isNavigating || this.currentStepIndex >= this.navigationSteps.length - 1) {
      return false;
    }

    this.currentStepIndex++;
    return true;
  }

  moveToPreviousStep(): boolean {
    if (!this.isNavigating || this.currentStepIndex <= 0) {
      return false;
    }

    this.currentStepIndex--;
    return true;
  }

  private startLocationTracking(options: NavigationOptions): void {
    const {
      onLocationUpdate,
      onStepChange,
      onStepCompleted,
      onArrival,
      onError,
      announceSteps = true,
      hapticFeedback = true,
      distanceThreshold = 10, // 10 meters
      updateInterval = 5000 // 5 seconds
    } = options;

    // Start location tracking
    locationService.startLocationTracking({
      onLocationUpdate: location => {
        this.lastLocation = location;
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      },
      onError: error => {
        if (onError) {
          onError(`Location tracking error: ${error}`);
        }
      },
      distanceInterval: 5, // 5 meters
      timeInterval: 3000 // 3 seconds
    });

    // Set up interval to check progress
    this.updateInterval = setInterval(() => {
      if (!this.isNavigating || !this.lastLocation || !this.currentDestination) {
        return;
      }

      // Check if we've reached the destination
      const distanceToDestination = locationService.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        this.currentDestination.coordinates.latitude,
        this.currentDestination.coordinates.longitude
      );

      if (distanceToDestination <= distanceThreshold) {
        // We've arrived at the destination
        this.isNavigating = false;
        
        if (announceSteps) {
          speechService.speak(`You have arrived at ${this.currentDestination.name}`);
        }
        
        if (hapticFeedback) {
          hapticService.vibrateArrival();
        }
        
        if (onArrival) {
          onArrival();
        }
        
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
        
        return;
      }

      // Check if we've completed the current step
      const currentStep = this.navigationSteps[this.currentStepIndex];
      if (!currentStep.isCompleted) {
        // Simple logic: mark step as completed after a certain time
        // In a real app, this would use more sophisticated logic based on location
        if (this.currentStepIndex < this.navigationSteps.length - 1) {
          currentStep.isCompleted = true;
          
          if (onStepCompleted) {
            onStepCompleted(
              currentStep,
              this.currentStepIndex,
              this.navigationSteps.length
            );
          }
          
          // Move to next step
          this.currentStepIndex++;
          const nextStep = this.navigationSteps[this.currentStepIndex];
          
          if (announceSteps) {
            speechService.speak(nextStep.instruction);
          }
          
          if (hapticFeedback) {
            hapticService.vibrateTurn();
          }
          
          if (onStepChange) {
            onStepChange(
              nextStep,
              this.currentStepIndex,
              this.navigationSteps.length
            );
          }
        }
      }
    }, updateInterval);
  }

  private generateNavigationSteps(
    start: LocationCoordinates,
    end: LocationCoordinates
  ): NavigationStep[] {
    // In a real app, this would use a routing API
    // For demonstration, we'll generate some realistic steps
    
    // Calculate total distance
    const totalDistance = locationService.calculateDistance(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );
    
    // Calculate bearing
    const bearing = locationService.calculateBearing(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );
    
    // Convert bearing to direction
    const direction = locationService.bearingToDirection(bearing);
    
    // Generate steps
    const steps: NavigationStep[] = [];
    
    // First step: initial direction
    steps.push({
      id: 'step-1',
      instruction: `Head ${direction.toLowerCase()} for ${Math.round(totalDistance / 3)} meters`,
      distance: Math.round(totalDistance / 3),
      direction: direction,
      isCompleted: false
    });
    
    // Second step: turn
    const turnDirections = ['right', 'left'];
    const randomTurn = turnDirections[Math.floor(Math.random() * turnDirections.length)];
    steps.push({
      id: 'step-2',
      instruction: `Turn ${randomTurn} at the intersection`,
      distance: 0,
      direction: randomTurn === 'right' ? 'Right' : 'Left',
      isCompleted: false
    });
    
    // Third step: continue
    steps.push({
      id: 'step-3',
      instruction: `Continue straight for ${Math.round(totalDistance / 3)} meters`,
      distance: Math.round(totalDistance / 3),
      direction: 'Straight',
      isCompleted: false
    });
    
    // Fourth step: cross street
    steps.push({
      id: 'step-4',
      instruction: 'Cross the street at the pedestrian crossing',
      distance: 0,
      direction: 'Straight',
      isCompleted: false
    });
    
    // Fifth step: another turn
    const secondTurn = turnDirections[Math.floor(Math.random() * turnDirections.length)];
    steps.push({
      id: 'step-5',
      instruction: `Turn ${secondTurn} after the bus stop`,
      distance: 0,
      direction: secondTurn === 'right' ? 'Right' : 'Left',
      isCompleted: false
    });
    
    // Final step: arrival
    steps.push({
      id: 'step-6',
      instruction: `Your destination is ${Math.round(totalDistance / 3)} meters ahead on your ${randomTurn}`,
      distance: Math.round(totalDistance / 3),
      direction: randomTurn === 'right' ? 'Right' : 'Left',
      isCompleted: false
    });
    
    return steps;
  }
}

// Singleton instance
export const navigationService = new NavigationService();
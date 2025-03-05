import { useState, useEffect } from 'react';
import { 
  navigationService, 
  Destination, 
  NavigationStep 
} from '../services/NavigationService';
import { LocationCoordinates } from '../services/LocationService';

interface UseNavigationOptions {
  announceSteps?: boolean;
  hapticFeedback?: boolean;
  distanceThreshold?: number;
  updateInterval?: number;
}

export function useNavigation({
  announceSteps = true,
  hapticFeedback = true,
  distanceThreshold = 10,
  updateInterval = 5000
}: UseNavigationOptions = {}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentDestination, setCurrentDestination] = useState<Destination | null>(null);
  const [currentStep, setCurrentStep] = useState<NavigationStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Get available destinations
  const availableDestinations = navigationService.getAvailableDestinations();
  
  // Start navigation to a destination
  const startNavigation = async (destination: string | Destination) => {
    try {
      setError(null);
      
      const success = await navigationService.startNavigation(destination, {
        announceSteps,
        hapticFeedback,
        distanceThreshold,
        updateInterval,
        onStepChange: (step, index, total) => {
          setCurrentStep(step);
          setCurrentStepIndex(index);
          setTotalSteps(total);
        },
        onError: (err) => {
          setError(err);
        }
      });
      
      if (success) {
        setIsNavigating(true);
        setCurrentDestination(navigationService.getCurrentDestination());
        setCurrentStep(navigationService.getCurrentStep());
        setCurrentStepIndex(navigationService.getCurrentStepIndex());
        setTotalSteps(navigationService.getTotalSteps());
      } else {
        setError('Failed to start navigation');
      }
      
      return success;
    } catch (err) {
      setError('An error occurred while starting navigation');
      return false;
    }
  };
  
  // Stop navigation
  const stopNavigation = () => {
    navigationService.stopNavigation();
    setIsNavigating(false);
    setCurrentDestination(null);
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setTotalSteps(0);
  };
  
  // Move to next step
  const nextStep = () => {
    if (!isNavigating) return false;
    
    const success = navigationService.moveToNextStep();
    if (success) {
      setCurrentStep(navigationService.getCurrentStep());
      setCurrentStepIndex(navigationService.getCurrentStepIndex());
    }
    
    return success;
  };
  
  // Move to previous step
  const previousStep = () => {
    if (!isNavigating) return false;
    
    const success = navigationService.moveToPreviousStep();
    if (success) {
      setCurrentStep(navigationService.getCurrentStep());
      setCurrentStepIndex(navigationService.getCurrentStepIndex());
    }
    
    return success;
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isNavigating) {
        navigationService.stopNavigation();
      }
    };
  }, []);
  
  return {
    isNavigating,
    currentDestination,
    currentStep,
    currentStepIndex,
    totalSteps,
    error,
    availableDestinations,
    startNavigation,
    stopNavigation,
    nextStep,
    previousStep
  };
}
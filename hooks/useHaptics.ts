import { useEffect } from 'react';
import { Platform } from 'react-native';
import { hapticService, HapticFeedbackType } from '../services/HapticService';

export function useHaptics(enabled: boolean = true) {
  useEffect(() => {
    hapticService.setEnabled(enabled);
  }, [enabled]);

  const isAvailable = Platform.OS !== 'web';

  const trigger = (type: HapticFeedbackType = 'medium') => {
    if (enabled && isAvailable) {
      hapticService.trigger(type);
    }
  };

  const vibrateTurn = () => {
    if (enabled && isAvailable) {
      hapticService.vibrateTurn();
    }
  };

  const vibrateObstacle = () => {
    if (enabled && isAvailable) {
      hapticService.vibrateObstacle();
    }
  };

  const vibrateArrival = () => {
    if (enabled && isAvailable) {
      hapticService.vibrateArrival();
    }
  };

  const vibrateWarning = () => {
    if (enabled && isAvailable) {
      hapticService.vibrateWarning();
    }
  };

  const vibrateError = () => {
    if (enabled && isAvailable) {
      hapticService.vibrateError();
    }
  };

  return {
    isAvailable,
    trigger,
    vibrateTurn,
    vibrateObstacle,
    vibrateArrival,
    vibrateWarning,
    vibrateError
  };
}
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

class HapticService {
  private isEnabled: boolean = true;
  
  constructor() {
    // Check if haptics are available on this device
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<boolean> {
    // Web doesn't support haptics
    if (Platform.OS === 'web') {
      return false;
    }
    
    // For native platforms, we'll assume it's available
    // There's no direct API to check haptics availability in Expo
    return true;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isHapticEnabled(): boolean {
    return this.isEnabled && Platform.OS !== 'web';
  }

  trigger(type: HapticFeedbackType = 'medium'): void {
    if (!this.isEnabled || Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  // Vibration patterns for different scenarios
  vibrateTurn(): void {
    this.trigger('medium');
    setTimeout(() => this.trigger('medium'), 300);
  }

  vibrateObstacle(): void {
    this.trigger('heavy');
  }

  vibrateArrival(): void {
    this.trigger('success');
  }

  vibrateWarning(): void {
    this.trigger('warning');
  }

  vibrateError(): void {
    this.trigger('error');
  }
}

// Singleton instance
export const hapticService = new HapticService();
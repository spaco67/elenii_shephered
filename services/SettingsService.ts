import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  speechEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  vibrationEnabled: boolean;
  vibrationIntensity: 'low' | 'medium' | 'high';
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  autoAnnounceObjects: boolean;
  autoAnnounceObstacles: boolean;
  autoAnnounceTurns: boolean;
  offlineMapEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  speechEnabled: true,
  speechRate: 0.9,
  speechPitch: 1.0,
  vibrationEnabled: true,
  vibrationIntensity: 'medium',
  notificationsEnabled: true,
  darkModeEnabled: false,
  fontSize: 'medium',
  highContrast: false,
  autoAnnounceObjects: true,
  autoAnnounceObstacles: true,
  autoAnnounceTurns: true,
  offlineMapEnabled: false
};

class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private isLoaded: boolean = false;
  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }
      this.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fall back to default settings
      this.settings = { ...DEFAULT_SETTINGS };
      this.isLoaded = true;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.settings }));
  }

  async getSettings(): Promise<AppSettings> {
    if (!this.isLoaded) {
      await this.loadSettings();
    }
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    if (!this.isLoaded) {
      await this.loadSettings();
    }
    
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    await this.saveSettings();
    return { ...this.settings };
  }

  async resetSettings(): Promise<AppSettings> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    return { ...this.settings };
  }

  addListener(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    
    // If settings are already loaded, notify the listener immediately
    if (this.isLoaded) {
      listener({ ...this.settings });
    }
    
    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Singleton instance
export const settingsService = new SettingsService();
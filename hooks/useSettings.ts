import { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '../services/SettingsService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const loadedSettings = await settingsService.getSettings();
        if (isMounted) {
          setSettings(loadedSettings);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load settings');
          setIsLoading(false);
        }
      }
    };

    // Load settings initially
    loadSettings();

    // Subscribe to settings changes
    const unsubscribe = settingsService.addListener(updatedSettings => {
      if (isMounted) {
        setSettings(updatedSettings);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = await settingsService.updateSettings(newSettings);
      return updatedSettings;
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    }
  };

  const resetSettings = async () => {
    try {
      const defaultSettings = await settingsService.resetSettings();
      return defaultSettings;
    } catch (err) {
      setError('Failed to reset settings');
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings
  };
}
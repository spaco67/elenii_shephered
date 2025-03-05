import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Volume2, Vibrate, Bell, Moon, CircleHelp as HelpCircle, Info, ChevronRight } from 'lucide-react-native';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useHaptics } from '../../hooks/useHaptics';

export default function SettingsScreen() {
  const { settings, isLoading, error, updateSettings } = useSettings();
  const { speak, stop } = useSpeech();
  const { trigger } = useHaptics();
  
  // Local state for UI while settings are loading
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [vibrationIntensity, setVibrationIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setIsSpeechEnabled(settings.speechEnabled);
      setIsVibrationEnabled(settings.vibrationEnabled);
      setIsNotificationsEnabled(settings.notificationsEnabled);
      setIsDarkModeEnabled(settings.darkModeEnabled);
      setSpeechRate(settings.speechRate);
      setSpeechPitch(settings.speechPitch);
      setVibrationIntensity(settings.vibrationIntensity);
      
      // Announce screen when opened
      if (settings.speechEnabled) {
        speak('Settings screen. Adjust your preferences here.', {
          rate: settings.speechRate,
          pitch: settings.speechPitch
        });
      }
    }
  }, [settings]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const toggleSpeech = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    const newValue = !isSpeechEnabled;
    setIsSpeechEnabled(newValue);
    
    if (newValue) {
      speak('Voice guidance enabled', {
        pitch: speechPitch,
        rate: speechRate,
      });
    } else {
      stop();
    }
    
    await updateSettings({ speechEnabled: newValue });
  };

  const toggleVibration = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    const newValue = !isVibrationEnabled;
    setIsVibrationEnabled(newValue);
    await updateSettings({ vibrationEnabled: newValue });
  };

  const toggleNotifications = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    const newValue = !isNotificationsEnabled;
    setIsNotificationsEnabled(newValue);
    await updateSettings({ notificationsEnabled: newValue });
  };

  const toggleDarkMode = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    const newValue = !isDarkModeEnabled;
    setIsDarkModeEnabled(newValue);
    await updateSettings({ darkModeEnabled: newValue });
  };

  const adjustSpeechRate = async (value: number) => {
    const newRate = Math.max(0.5, Math.min(1.5, value));
    setSpeechRate(newRate);
    
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    if (isSpeechEnabled) {
      speak('This is the new speech rate', {
        pitch: speechPitch,
        rate: newRate,
      });
    }
    
    await updateSettings({ speechRate: newRate });
  };

  const adjustSpeechPitch = async (value: number) => {
    const newPitch = Math.max(0.5, Math.min(1.5, value));
    setSpeechPitch(newPitch);
    
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    if (isSpeechEnabled) {
      speak('This is the new speech pitch', {
        pitch: newPitch,
        rate: speechRate,
      });
    }
    
    await updateSettings({ speechPitch: newPitch });
  };

  const setVibrationLevel = async (level: 'low' | 'medium' | 'high') => {
    setVibrationIntensity(level);
    
    if (isVibrationEnabled && Platform.OS !== 'web') {
      switch (level) {
        case 'low':
          trigger('light');
          break;
        case 'medium':
          trigger('medium');
          break;
        case 'high':
          trigger('heavy');
          break;
      }
    }
    
    await updateSettings({ vibrationIntensity: level });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Volume2 size={24} color="#007AFF" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Voice Guidance</Text>
            </View>
            <Switch
              value={isSpeechEnabled}
              onValueChange={toggleSpeech}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              ios_backgroundColor="#D1D1D6"
              accessibilityLabel={isSpeechEnabled ? "Disable voice guidance" : "Enable voice guidance"}
            />
          </View>
          
          {isSpeechEnabled && (
            <>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Speech Rate</Text>
                <View style={styles.sliderControls}>
                  <TouchableOpacity 
                    style={styles.sliderButton} 
                    onPress={() => adjustSpeechRate(Math.max(0.5, speechRate - 0.1))}
                    accessibilityLabel="Decrease speech rate"
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(speechRate - 0.5) * 100 / 1}%` }]} />
                  </View>
                  <TouchableOpacity 
                    style={styles.sliderButton} 
                    onPress={() => adjustSpeechRate(Math.min(1.5, speechRate + 0.1))}
                    accessibilityLabel="Increase speech rate"
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Speech Pitch</Text>
                <View style={styles.sliderControls}>
                  <TouchableOpacity 
                    style={styles.sliderButton} 
                    onPress={() => adjustSpeechPitch(Math.max(0.5, speechPitch - 0.1))}
                    accessibilityLabel="Decrease speech pitch"
                  >
                    <Text style={styles.sliderButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(speechPitch - 0.5) * 100 / 1}%` }]} />
                  </View>
                  <TouchableOpacity 
                    style={styles.sliderButton} 
                    onPress={() => adjustSpeechPitch(Math.min(1.5, speechPitch + 0.1))}
                    accessibilityLabel="Increase speech pitch"
                  >
                    <Text style={styles.sliderButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={styles.settingInfo}>
              <Vibrate size={24} color="#FF9500" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
            </View>
            <Switch
              value={isVibrationEnabled}
              onValueChange={toggleVibration}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              ios_backgroundColor="#D1D1D6"
              accessibilityLabel={isVibrationEnabled ? "Disable haptic feedback" : "Enable haptic feedback"}
            />
          </View>
          
          {isVibrationEnabled && Platform.OS !== 'web' && (
            <View style={styles.vibrationLevels}>
              <TouchableOpacity 
                style={[
                  styles.vibrationLevel, 
                  vibrationIntensity === 'low' && styles.activeVibrationLevel
                ]}
                onPress={() => setVibrationLevel('low')}
                accessibilityLabel="Set vibration intensity to low"
              >
                <Text style={[
                  styles.vibrationLevelText,
                  vibrationIntensity === 'low' && styles.activeVibrationLevelText
                ]}>Low</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.vibrationLevel, 
                  vibrationIntensity === 'medium' && styles.activeVibrationLevel
                ]}
                onPress={() => setVibrationLevel('medium')}
                accessibilityLabel="Set vibration intensity to medium"
              >
                <Text style={[
                  styles.vibrationLevelText,
                  vibrationIntensity === 'medium' && styles.activeVibrationLevelText
                ]}>Medium</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.vibrationLevel, 
                  vibrationIntensity === 'high' && styles.activeVibrationLevel
                ]}
                onPress={() => setVibrationLevel('high')}
                accessibilityLabel="Set vibration intensity to high"
              >
                <Text style={[
                  styles.vibrationLevelText,
                  vibrationIntensity === 'high' && styles.activeVibrationLevelText
                ]}>High</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={24} color="#5856D6" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              ios_backgroundColor="#D1D1D6"
              accessibilityLabel={isNotificationsEnabled ? "Disable notifications" : "Enable notifications"}
            />
          </View>
          
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={styles.settingInfo}>
              <Moon size={24} color="#8E8E93" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkModeEnabled}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              ios_backgroundColor="#D1D1D6"
              accessibilityLabel={isDarkModeEnabled ? "Disable dark mode" : "Enable dark mode"}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} accessibilityLabel="Help and Support">
            <View style={styles.settingInfo}>
              <HelpCircle size={24} color="#FF9500" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color="#8E8E93" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingRow, styles.borderTop]} accessibilityLabel="About Vision Assist">
            <View style={styles.settingInfo}>
              <Info size={24} color="#007AFF" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>About Vision Assist</Text>
            </View>
            <ChevronRight size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Vision Assist v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Vision Assist</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#000000',
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sliderLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#007AFF',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  vibrationLevels: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  vibrationLevel: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  activeVibrationLevel: {
    backgroundColor: '#007AFF',
  },
  vibrationLevelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#000000',
  },
  activeVibrationLevelText: {
    color: '#FFFFFF',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  copyrightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#8E8E93',
  },
});
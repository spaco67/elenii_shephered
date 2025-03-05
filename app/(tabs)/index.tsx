import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Navigation, Map, Settings, Info, Volume2, VolumeX, Vibrate } from 'lucide-react-native';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useHaptics } from '../../hooks/useHaptics';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, isLoading: settingsLoading } = useSettings();
  const { speak, stop } = useSpeech();
  const { trigger } = useHaptics();
  
  // Local state for UI while settings are loading
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setIsSpeechEnabled(settings.speechEnabled);
      setIsVibrationEnabled(settings.vibrationEnabled);
    }
  }, [settings]);

  useEffect(() => {
    // Welcome message when app opens
    if (isSpeechEnabled) {
      const welcomeMessage = 'Welcome to Vision Assist. Tap anywhere on the screen to hear available features.';
      speak(welcomeMessage);
    }

    return () => {
      stop();
    };
  }, []);

  const handlePress = (feature: string, route: string) => {
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      trigger('medium');
    }
    
    if (isSpeechEnabled) {
      speak(`Opening ${feature}`);
    }
    
    // Navigate to the selected feature
    router.push(route);
  };

  const toggleSpeech = () => {
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      trigger('light');
    }
    
    const newValue = !isSpeechEnabled;
    setIsSpeechEnabled(newValue);
    
    if (settings) {
      settings.updateSettings({ speechEnabled: newValue });
    }
    
    if (newValue) {
      speak('Voice guidance enabled');
    } else {
      stop();
    }
  };

  const toggleVibration = () => {
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      trigger('light');
    }
    
    const newValue = !isVibrationEnabled;
    setIsVibrationEnabled(newValue);
    
    if (settings) {
      settings.updateSettings({ vibrationEnabled: newValue });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Vision Assist</Text>
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleSpeech}
            accessibilityLabel={isSpeechEnabled ? "Disable voice guidance" : "Enable voice guidance"}
            accessibilityHint="Toggles voice announcements"
          >
            {isSpeechEnabled ? (
              <Volume2 size={24} color="#007AFF" />
            ) : (
              <VolumeX size={24} color="#8E8E93" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleVibration}
            accessibilityLabel={isVibrationEnabled ? "Disable vibration feedback" : "Enable vibration feedback"}
            accessibilityHint="Toggles vibration feedback"
          >
            <Vibrate size={24} color={isVibrationEnabled ? "#007AFF" : "#8E8E93"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Main Features</Text>
        <View style={styles.featuresGrid}>
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => handlePress('Object Detection', '/object-detection')}
            accessibilityLabel="Object Detection"
            accessibilityHint="Identifies objects in your surroundings"
          >
            <Camera size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Object Detection</Text>
            <Text style={styles.featureDescription}>Identify objects around you</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => handlePress('Navigation', '/navigation')}
            accessibilityLabel="Navigation"
            accessibilityHint="Helps you navigate with voice guidance"
          >
            <Navigation size={32} color="#FF9500" />
            <Text style={styles.featureTitle}>Navigation</Text>
            <Text style={styles.featureDescription}>Get voice-guided directions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => handlePress('Offline Maps', '/map')}
            accessibilityLabel="Offline Maps"
            accessibilityHint="Access maps without internet connection"
          >
            <Map size={32} color="#34C759" />
            <Text style={styles.featureTitle}>Offline Maps</Text>
            <Text style={styles.featureDescription}>Use maps without internet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => handlePress('Settings', '/settings')}
            accessibilityLabel="Settings"
            accessibilityHint="Customize app preferences"
          >
            <Settings size={32} color="#5856D6" />
            <Text style={styles.featureTitle}>Settings</Text>
            <Text style={styles.featureDescription}>Customize your experience</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Info size={24} color="#007AFF" style={styles.aboutIcon} />
          <Text style={styles.aboutTitle}>Vision Assist</Text>
          <Text style={styles.aboutDescription}>
            An assistive technology app designed to help visually impaired users navigate their surroundings, 
            detect objects, and receive audio and haptic feedback. All features work offline for reliability.
          </Text>
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
  controls: {
    flexDirection: 'row',
  },
  controlButton: {
    marginLeft: 16,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000000',
    marginTop: 12,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutIcon: {
    marginBottom: 12,
  },
  aboutTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 8,
  },
  aboutDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#3C3C43',
    lineHeight: 22,
  },
});
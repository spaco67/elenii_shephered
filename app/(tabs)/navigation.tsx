import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Volume2, VolumeX, Vibrate, Navigation, ArrowLeft, ArrowRight, X } from 'lucide-react-native';
import { useNavigation } from '../../hooks/useNavigation';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useHaptics } from '../../hooks/useHaptics';

export default function NavigationScreen() {
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
  
  const {
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
  } = useNavigation({
    announceSteps: isSpeechEnabled,
    hapticFeedback: isVibrationEnabled
  });
  
  const [destination, setDestination] = useState('Grocery Store');
  
  useEffect(() => {
    // Announce screen when opened
    if (isSpeechEnabled) {
      speak('Navigation screen. Select a destination and start navigation.');
    }
    
    return () => {
      stop();
      if (isNavigating) {
        stopNavigation();
      }
    };
  }, []);
  
  const toggleSpeech = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    setIsSpeechEnabled(!isSpeechEnabled);
    
    if (isSpeechEnabled) {
      stop();
    } else {
      speak('Voice guidance enabled');
    }
  };
  
  const toggleVibration = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    setIsVibrationEnabled(!isVibrationEnabled);
  };
  
  const handleStartNavigation = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('medium');
    }
    
    await startNavigation(destination);
  };
  
  const handleStopNavigation = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('medium');
    }
    
    stopNavigation();
  };
  
  const handleNextStep = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    nextStep();
  };
  
  const handlePreviousStep = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    previousStep();
  };
  
  const handleRepeatInstruction = () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    if (isSpeechEnabled && currentStep) {
      speak(currentStep.instruction);
    }
  };
  
  const selectDestination = (dest: string) => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    setDestination(dest);
    
    if (isSpeechEnabled) {
      speak(`Selected destination: ${dest}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Navigation</Text>
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
        {!isNavigating ? (
          <>
            <Text style={styles.sectionTitle}>Select Destination</Text>
            <View style={styles.destinationsContainer}>
              {['Grocery Store', 'Park', 'Library', 'Bus Stop', 'Home'].map((dest) => (
                <TouchableOpacity 
                  key={dest}
                  style={[
                    styles.destinationButton,
                    destination === dest && styles.selectedDestination
                  ]}
                  onPress={() => selectDestination(dest)}
                  accessibilityLabel={`Select ${dest} as destination`}
                  accessibilityHint={`Sets ${dest} as your navigation destination`}
                >
                  <Text style={[
                    styles.destinationText,
                    destination === dest && styles.selectedDestinationText
                  ]}>{dest}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartNavigation}
              accessibilityLabel="Start navigation"
              accessibilityHint={`Starts navigation to ${destination}`}
            >
              <Navigation size={24} color="#FFFFFF" style={styles.startButtonIcon} />
              <Text style={styles.startButtonText}>Start Navigation</Text>
            </TouchableOpacity>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Navigation Features:</Text>
              <Text style={styles.infoText}>• Voice-guided turn-by-turn directions</Text>
              <Text style={styles.infoText}>• Vibration feedback for turns and obstacles</Text>
              <Text style={styles.infoText}>• Works completely offline</Text>
              <Text style={styles.infoText}>• Optimized for visually impaired users</Text>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.navigationHeader}>
              <Text style={styles.navigationTitle}>
                Navigating to {currentDestination?.name || destination}
              </Text>
              <TouchableOpacity 
                style={styles.stopButton}
                onPress={handleStopNavigation}
                accessibilityLabel="Stop navigation"
                accessibilityHint="Stops the current navigation"
              >
                <X size={16} color="#FFFFFF" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
            
            {currentStep && (
              <View style={styles.stepContainer}>
                <Navigation size={48} color="#007AFF" />
                <Text style={styles.stepText}>{currentStep.instruction}</Text>
                <Text style={styles.stepCounter}>
                  Step {currentStepIndex + 1} of {totalSteps}
                </Text>
              </View>
            )}
            
            <View style={styles.navigationControls}>
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={handlePreviousStep}
                disabled={currentStepIndex === 0}
                accessibilityLabel="Previous step"
                accessibilityHint="Go to the previous navigation instruction"
              >
                <ArrowLeft size={20} color={currentStepIndex === 0 ? "#C7C7CC" : "#007AFF"} />
                <Text style={[
                  styles.navigationButtonText,
                  currentStepIndex === 0 && { color: "#C7C7CC" }
                ]}>Previous</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navigationButton, styles.primaryButton]}
                onPress={handleRepeatInstruction}
                accessibilityLabel="Repeat instruction"
                accessibilityHint="Repeats the current navigation instruction"
              >
                <Text style={styles.primaryButtonText}>Repeat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navigationButton}
                onPress={handleNextStep}
                disabled={currentStepIndex === totalSteps - 1}
                accessibilityLabel="Next step"
                accessibilityHint="Go to the next navigation instruction"
              >
                <Text style={[
                  styles.navigationButtonText,
                  currentStepIndex === totalSteps - 1 && { color: "#C7C7CC" }
                ]}>Next</Text>
                <ArrowRight size={20} color={currentStepIndex === totalSteps - 1 ? "#C7C7CC" : "#007AFF"} />
              </TouchableOpacity>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        )}
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
  },
  destinationsContainer: {
    marginBottom: 24,
  },
  destinationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDestination: {
    backgroundColor: '#007AFF',
  },
  destinationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#000000',
  },
  selectedDestinationText: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 8,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navigationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  stepCounter: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  navigationButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#007AFF',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flex: 2,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEEEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
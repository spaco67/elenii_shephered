import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
  Camera as CameraIcon,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Vibrate,
  RefreshCw,
} from 'lucide-react-native';
import { useObjectDetection } from '../../hooks/useObjectDetection';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useHaptics } from '../../hooks/useHaptics';

export default function ObjectDetectionScreen() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { speak, stop } = useSpeech();
  const { trigger } = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();

  // Local state for UI while settings are loading
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [cameraType, setCameraType] = useState<CameraType>('back');

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setIsSpeechEnabled(settings.speechEnabled);
      setIsVibrationEnabled(settings.vibrationEnabled);
    }
  }, [settings]);

  const {
    cameraRef,
    isDetecting,
    detectedObjects,
    hasPermission,
    error,
    isModelLoading,
    loadingProgress,
    loadingStatus,
    toggleDetection,
  } = useObjectDetection({
    enabled: false,
    confidenceThreshold: 0.6,
    detectionInterval: 3000,
    maxDetections: 5,
    announceObjects: isSpeechEnabled,
    hapticFeedback: isVibrationEnabled,
  });

  // Announce screen when opened
  useEffect(() => {
    if (isSpeechEnabled) {
      if (isModelLoading) {
        speak('Object detection screen. Loading detection model, please wait.');
      } else {
        speak(
          'Object detection ready. Point your camera at objects to identify them.'
        );
      }
    }

    return () => {
      stop();
    };
  }, [isModelLoading]);

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

  const handleToggleDetection = () => {
    if (isModelLoading) {
      if (isSpeechEnabled) {
        speak('Please wait while the model is loading');
      }
      return;
    }

    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('medium');
    }

    toggleDetection();

    if (!isDetecting) {
      if (isSpeechEnabled) {
        speak('Starting object detection');
      }
    } else {
      if (isSpeechEnabled) {
        speak('Object detection stopped');
      }
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No access to camera</Text>
          <Text style={styles.subMessageText}>
            Please enable camera access in your device settings to use object
            detection.
          </Text>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Object Detection</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleSpeech}
            accessibilityLabel={
              isSpeechEnabled
                ? 'Disable voice guidance'
                : 'Enable voice guidance'
            }
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
            accessibilityLabel={
              isVibrationEnabled
                ? 'Disable vibration feedback'
                : 'Enable vibration feedback'
            }
            accessibilityHint="Toggles vibration feedback"
          >
            <Vibrate
              size={24}
              color={isVibrationEnabled ? '#007AFF' : '#8E8E93'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {Platform.OS !== 'web' ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            enableTorch={false}
            ratio="4:3"
          />
          <View style={styles.overlay}>
            {isModelLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>{loadingStatus}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${loadingProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{loadingProgress}%</Text>
              </View>
            ) : (
              <View style={styles.detectionResults}>
                {detectedObjects.length > 0 && (
                  <>
                    <Text style={styles.detectionTitle}>Detected Objects:</Text>
                    {detectedObjects.map((object, index) => (
                      <Text key={index} style={styles.detectionItem}>
                        • {object.name}{' '}
                        {object.distance ? `(~${object.distance}m)` : ''}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.detectionButton,
              isModelLoading && styles.detectionButtonDisabled,
            ]}
            onPress={handleToggleDetection}
            disabled={isModelLoading}
            accessibilityLabel={
              isDetecting ? 'Stop detection' : 'Start detection'
            }
            accessibilityHint="Toggles object detection"
          >
            {isDetecting ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webFallback}>
          <CameraIcon size={64} color="#8E8E93" />
          <Text style={styles.webFallbackText}>
            Camera not available in web version
          </Text>
          <Text style={styles.webFallbackSubText}>
            Due to browser security restrictions, camera access may be limited
            in the web version. For the best experience, please use a mobile
            device with the Expo Go app.
          </Text>
          <Text style={styles.webFallbackNote}>
            Note: If using Chrome, make sure to access the site via HTTPS and
            grant camera permissions when prompted.
          </Text>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionsText}>
          1. Point your camera at objects around you
        </Text>
        <Text style={styles.instructionsText}>
          2. Tap the play button to start detection
        </Text>
        <Text style={styles.instructionsText}>
          3. The app will announce detected objects
        </Text>
        <Text style={styles.instructionsText}>
          4. Vibration feedback indicates detection events
        </Text>
        <Text style={styles.instructionsText}>
          5. Using advanced AI for real-time detection
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  cameraContainer: {
    width: '100%',
    height: width * 1.33, // 4:3 aspect ratio
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  detectionResults: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 16,
    maxWidth: '80%',
  },
  detectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detectionItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detectionButton: {
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  detectionButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 12,
  },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#3C3C43',
    marginBottom: 8,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subMessageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  webFallback: {
    width: '100%',
    height: width * 1.33,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  webFallbackSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 12,
  },
  webFallbackNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 12,
  },
  errorContainer: {
    margin: 16,
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

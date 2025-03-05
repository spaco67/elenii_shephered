import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Volume2, VolumeX, Vibrate, MapPin, Navigation, Download, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useSettings } from '../../hooks/useSettings';
import { useSpeech } from '../../hooks/useSpeech';
import { useHaptics } from '../../hooks/useHaptics';
import { locationService } from '../../services/LocationService';
import { navigationService } from '../../services/NavigationService';

export default function MapScreen() {
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
      setIsMapDownloaded(settings.offlineMapEnabled);
    }
  }, [settings]);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isMapDownloaded, setIsMapDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // Get available destinations from navigation service
  const pointsOfInterest = navigationService.getAvailableDestinations();

  useEffect(() => {
    let isMounted = true;
    
    const checkLocationPermission = async () => {
      try {
        const granted = await locationService.requestPermissions();
        if (isMounted) {
          setHasPermission(granted);
          
          if (granted) {
            if (isSpeechEnabled) {
              speak('Location permission granted. Map is ready.');
            }
            
            getCurrentLocation();
          } else {
            if (isSpeechEnabled) {
              speak('Location permission denied. Please enable location access in settings.');
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to request location permission');
        }
      }
    };
    
    // Announce screen when opened
    if (isSpeechEnabled) {
      speak('Map screen. You can download maps for offline use.');
    }
    
    checkLocationPermission();
    
    return () => {
      isMounted = false;
      stop();
    };
  }, []);
  
  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } catch (err) {
      setError('Failed to get current location');
    }
  };

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

  const downloadMap = async () => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('medium');
    }
    
    if (isSpeechEnabled) {
      speak('Downloading offline map. Please wait.');
    }
    
    setIsDownloading(true);
    
    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsDownloading(false);
        setIsMapDownloaded(true);
        
        // Update settings
        if (settings) {
          settings.updateSettings({ offlineMapEnabled: true });
        }
        
        if (isVibrationEnabled && Platform.OS !== 'web') {
          trigger('success');
        }
        
        if (isSpeechEnabled) {
          speak('Offline map downloaded successfully. You can now use the map without internet connection.');
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  };

  const announceLocation = (name: string) => {
    if (isVibrationEnabled && Platform.OS !== 'web') {
      trigger('light');
    }
    
    if (isSpeechEnabled) {
      speak(`Selected location: ${name}`);
    }
  };

  if (hasPermission === null && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Requesting location permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No access to location</Text>
          <Text style={styles.subMessageText}>Please enable location access in your device settings to use the map.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Map</Text>
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

      {Platform.OS !== 'web' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            accessibilityLabel="Interactive map showing your location and points of interest"
          >
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Your Location"
                description="You are here"
              />
            )}
            
            {pointsOfInterest.map((poi) => (
              <Marker
                key={poi.id}
                coordinate={{
                  latitude: poi.coordinates.latitude,
                  longitude: poi.coordinates.longitude,
                }}
                title={poi.name}
                description={`Point of interest: ${poi.name}`}
                onPress={() => announceLocation(poi.name)}
              >
                <MapPin size={24} color="#FF9500" />
              </Marker>
            ))}
          </MapView>
          
          {!isMapDownloaded && !isDownloading && (
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={downloadMap}
              accessibilityLabel="Download offline map"
              accessibilityHint="Downloads the map for offline use"
            >
              <Download size={20} color="#FFFFFF" style={styles.downloadIcon} />
              <Text style={styles.downloadText}>Download Offline Map</Text>
            </TouchableOpacity>
          )}
          
          {isDownloading && (
            <View style={styles.downloadingContainer}>
              <Text style={styles.downloadingText}>Downloading... {downloadProgress}%</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
              </View>
            </View>
          )}
          
          {isMapDownloaded && !isDownloading && (
            <View style={styles.downloadedBadge}>
              <CheckCircle size={16} color="#FFFFFF" style={styles.downloadedIcon} />
              <Text style={styles.downloadedText}>Offline Map Ready</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.webFallback}>
          <MapPin size={64} color="#8E8E93" />
          <Text style={styles.webFallbackText}>Maps not available in web version</Text>
          <Text style={styles.webFallbackSubText}>Please use a mobile device to access map features</Text>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Map Features:</Text>
        <Text style={styles.instructionsText}>• Download maps for offline use</Text>
        <Text style={styles.instructionsText}>• Voice announcements of nearby points of interest</Text>
        <Text style={styles.instructionsText}>• Haptic feedback when approaching destinations</Text>
        <Text style={styles.instructionsText}>• Optimized for screen readers and accessibility</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

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
  mapContainer: {
    width: '100%',
    height: height * 0.5,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  downloadIcon: {
    marginRight: 8,
  },
  downloadText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  downloadingContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: '80%',
  },
  downloadingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  downloadedIcon: {
    marginRight: 4,
  },
  downloadedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
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
  },
  webFallback: {
    width: '100%',
    height: height * 0.5,
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
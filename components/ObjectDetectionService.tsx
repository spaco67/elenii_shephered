import { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface ObjectDetectionOptions {
  isSpeechEnabled: boolean;
  isVibrationEnabled: boolean;
  detectionInterval?: number;
  speechRate?: number;
  speechPitch?: number;
  onDetection?: (objects: string[]) => void;
}

export const useObjectDetection = ({
  isSpeechEnabled = true,
  isVibrationEnabled = true,
  detectionInterval = 5000,
  speechRate = 0.9,
  speechPitch = 1.0,
  onDetection,
}: ObjectDetectionOptions) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock object detection - in a real app, this would use TensorFlow.js
  const detectObjects = () => {
    const mockObjects = ['chair', 'table', 'person', 'cup', 'book', 'door', 'window'];
    const randomObjects = [];
    const numObjects = Math.floor(Math.random() * 3) + 1; // 1-3 objects
    
    for (let i = 0; i < numObjects; i++) {
      const randomIndex = Math.floor(Math.random() * mockObjects.length);
      randomObjects.push(mockObjects[randomIndex]);
    }
    
    setDetectedObjects(randomObjects);
    
    if (isSpeechEnabled) {
      const objectsText = randomObjects.join(', ');
      Speech.speak(`Detected: ${objectsText}`, {
        language: 'en',
        pitch: speechPitch,
        rate: speechRate,
      });
    }
    
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (onDetection) {
      onDetection(randomObjects);
    }
  };

  const startDetection = () => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    
    if (isSpeechEnabled) {
      Speech.speak('Starting object detection', {
        language: 'en',
        pitch: speechPitch,
        rate: speechRate,
      });
    }
    
    // Immediate first detection
    detectObjects();
    
    // Set up interval for continuous detection
    intervalRef.current = setInterval(detectObjects, detectionInterval);
  };

  const stopDetection = () => {
    if (!isDetecting) return;
    
    setIsDetecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isSpeechEnabled) {
      Speech.speak('Object detection stopped', {
        language: 'en',
        pitch: speechPitch,
        rate: speechRate,
      });
    }
  };

  const toggleDetection = () => {
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Speech.stop();
    };
  }, []);

  return {
    isDetecting,
    detectedObjects,
    startDetection,
    stopDetection,
    toggleDetection,
  };
};
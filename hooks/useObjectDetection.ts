import { useState, useEffect, useRef } from 'react';
import { CameraView } from 'expo-camera';
import { Platform } from 'react-native';
import { objectDetectionService, DetectedObject } from '../services/ObjectDetectionService';

interface UseObjectDetectionOptions {
  enabled?: boolean;
  confidenceThreshold?: number;
  detectionInterval?: number;
  maxDetections?: number;
  announceObjects?: boolean;
  hapticFeedback?: boolean;
}

export function useObjectDetection({
  enabled = false,
  confidenceThreshold = 0.5,
  detectionInterval = 3000,
  maxDetections = 5,
  announceObjects = true,
  hapticFeedback = true
}: UseObjectDetectionOptions = {}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      try {
        const { status } = await CameraView.requestCameraPermissionsAsync();
        if (isMounted) {
          setHasPermission(status === 'granted');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to request camera permission');
          setHasPermission(false);
        }
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Set camera ref in the service
    if (cameraRef.current) {
      objectDetectionService.setCameraRef(cameraRef);
    }
  }, [cameraRef.current]);

  useEffect(() => {
    // Start or stop detection based on enabled prop
    if (enabled && hasPermission && !isModelLoading) {
      startDetection();
    } else if (!enabled && isDetecting) {
      stopDetection();
    }

    return () => {
      if (isDetecting) {
        objectDetectionService.stopDetection();
      }
    };
  }, [enabled, hasPermission, isModelLoading]);

  // Update loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      const { progress, status } = objectDetectionService.getLoadingProgress();
      setLoadingProgress(progress);
      setLoadingStatus(status);
      if (progress === 100) {
        setIsModelLoading(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startDetection = () => {
    if (isDetecting || !hasPermission || isModelLoading) {
      return;
    }

    setError(null);
    setIsDetecting(true);

    objectDetectionService.startDetection({
      onDetection: (objects) => {
        setDetectedObjects(objects);
      },
      onError: (err) => {
        setError(err);
        setIsDetecting(false);
      },
      confidenceThreshold,
      detectionInterval,
      maxDetections,
      announceObjects,
      hapticFeedback
    });
  };

  const stopDetection = () => {
    if (!isDetecting) {
      return;
    }

    objectDetectionService.stopDetection();
    setIsDetecting(false);
  };

  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  return {
    cameraRef,
    isDetecting,
    detectedObjects,
    error,
    hasPermission,
    isModelLoading,
    loadingProgress,
    loadingStatus,
    startDetection,
    stopDetection,
    toggleDetection
  };
}
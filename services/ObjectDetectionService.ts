import '@tensorflow/tfjs-react-native';  // Must come first
import { Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { speechService } from './SpeechService';
import { hapticService } from './HapticService';

export interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  distance?: number; // estimated distance in meters
}

export interface ObjectDetectionOptions {
  onDetection?: (objects: DetectedObject[]) => void;
  onError?: (error: string) => void;
  confidenceThreshold?: number;
  detectionInterval?: number;
  maxDetections?: number;
  announceObjects?: boolean;
  hapticFeedback?: boolean;
}

// COCO dataset labels
const COCO_LABELS = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
  'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
  'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
  'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
  'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
  'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
  'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

class ObjectDetectionService {
  private isDetecting: boolean = false;
  private detectionInterval: NodeJS.Timeout | null = null;
  private cameraRef: React.RefObject<CameraView> | null = null;
  private hasPermission: boolean = false;
  private lastFrameTime: number = 0;
  private frameInterval: number = 1000; // Minimum time between frames in ms
  private isModelLoaded: boolean = false;
  private model: tf.GraphModel | null = null;
  
  // Common objects that might be detected in real environments
  private commonObjects = [
    { name: 'person', probability: 0.8, distanceRange: [1, 5] },
    { name: 'chair', probability: 0.7, distanceRange: [1, 3] },
    { name: 'table', probability: 0.6, distanceRange: [1, 4] },
    { name: 'door', probability: 0.5, distanceRange: [2, 6] },
    { name: 'window', probability: 0.5, distanceRange: [2, 8] },
    { name: 'cup', probability: 0.4, distanceRange: [0.5, 1.5] },
    { name: 'bottle', probability: 0.4, distanceRange: [0.5, 2] },
    { name: 'book', probability: 0.3, distanceRange: [0.5, 1] },
    { name: 'phone', probability: 0.3, distanceRange: [0.3, 1] },
    { name: 'laptop', probability: 0.3, distanceRange: [1, 3] },
    { name: 'tv', probability: 0.2, distanceRange: [2, 5] },
    { name: 'couch', probability: 0.2, distanceRange: [2, 4] },
    { name: 'bed', probability: 0.2, distanceRange: [2, 4] },
    { name: 'toilet', probability: 0.1, distanceRange: [1, 3] },
    { name: 'sink', probability: 0.1, distanceRange: [1, 3] },
    { name: 'refrigerator', probability: 0.1, distanceRange: [2, 4] },
    { name: 'oven', probability: 0.1, distanceRange: [1, 3] },
    { name: 'microwave', probability: 0.1, distanceRange: [1, 2] },
    { name: 'toaster', probability: 0.1, distanceRange: [0.5, 1.5] },
    { name: 'clock', probability: 0.1, distanceRange: [1, 4] }
  ];

  constructor() {
    this.requestCameraPermission();
    this.loadModel();
  }

  getLoadingProgress(): { progress: number; status: string } {
    return { progress: 0, status: 'Loading model...' };
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  setCameraRef(ref: React.RefObject<CameraView>): void {
    this.cameraRef = ref;
  }

  startDetection({
    onDetection,
    onError,
    confidenceThreshold = 0.5,
    detectionInterval = 3000,
    maxDetections = 5,
    announceObjects = true,
    hapticFeedback = true
  }: ObjectDetectionOptions = {}): void {
    if (this.isDetecting) {
      return;
    }

    if (!this.hasPermission) {
      this.requestCameraPermission().then(granted => {
        if (granted) {
          this.startDetectionProcess(
            onDetection,
            onError,
            confidenceThreshold,
            detectionInterval,
            maxDetections,
            announceObjects,
            hapticFeedback
          );
        } else if (onError) {
          onError('Camera permission not granted');
        }
      });
    } else {
      this.startDetectionProcess(
        onDetection,
        onError,
        confidenceThreshold,
        detectionInterval,
        maxDetections,
        announceObjects,
        hapticFeedback
      );
    }
  }

  private async takePicture(): Promise<string | null> {
    if (!this.cameraRef || !this.cameraRef.current || Platform.OS === 'web') {
      return null;
    }

    try {
      const photo = await this.cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
        exif: false
      });
      return photo.uri;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  private async processImage(imageUri: string): Promise<DetectedObject[]> {
    if (!this.isModelLoaded) {
      console.log('Model not loaded yet');
      return [];
    }

    const model = this.model;
    if (!model) {
      console.log('Model not available');
      return [];
    }

    try {
      // Load and preprocess image using React Native compatible methods
      const response = await fetch(imageUri);
      const imageData = await response.arrayBuffer();
      const imageTensor = decodeJpeg(new Uint8Array(imageData));
      
      const resized = tf.image.resizeBilinear(imageTensor, [300, 300]);
      const expanded = resized.expandDims(0);
      const normalized = expanded.div(255.0);
      const int32Input = normalized.toInt();

      // Run inference
      const predictions = await model.predict(int32Input) as tf.Tensor[];
      const boxes = predictions[0].dataSync();
      const scores = predictions[1].dataSync();
      const classes = predictions[2].dataSync();
      
      // Process results
      const detectedObjects: DetectedObject[] = [];
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] > 0.5) { // Confidence threshold
          const classIndex = classes[i];
          if (classIndex < COCO_LABELS.length) {
            detectedObjects.push({
              id: `${COCO_LABELS[classIndex]}-${Date.now()}`,
              name: COCO_LABELS[classIndex],
              confidence: scores[i],
              boundingBox: {
                x: boxes[i * 4],
                y: boxes[i * 4 + 1],
                width: boxes[i * 4 + 2],
                height: boxes[i * 4 + 3]
              },
              distance: this.estimateDistance(scores[i])
            });
          }
        }
      }

      // Cleanup tensors
      tf.dispose([imageTensor, resized, expanded, normalized, int32Input, ...predictions]);

      return detectedObjects;
    } catch (error) {
      console.error('Error processing image:', error);
      return [];
    }
  }

  private estimateDistance(confidence: number): number {
    // Simple distance estimation based on confidence
    // Lower confidence = further away
    return Math.round((1 - confidence) * 5 * 10) / 10; // 0.5 to 5 meters
  }

  private startDetectionProcess(
    onDetection?: (objects: DetectedObject[]) => void,
    onError?: (error: string) => void,
    confidenceThreshold: number = 0.5,
    detectionInterval: number = 3000,
    maxDetections: number = 5,
    announceObjects: boolean = true,
    hapticFeedback: boolean = true
  ): void {
    this.isDetecting = true;
    this.lastFrameTime = Date.now();

    const detectFrame = async () => {
      try {
        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime < this.frameInterval) {
          return;
        }

        const imageUri = await this.takePicture();
        if (!imageUri) {
          throw new Error('Failed to capture image');
        }

        const detectedObjects = await this.processImage(imageUri);
        
        if (detectedObjects.length > 0) {
          if (hapticFeedback && Platform.OS !== 'web') {
            hapticService.trigger('light');
          }

          if (announceObjects) {
            let announcement = '';
            if (detectedObjects.length === 1) {
              const obj = detectedObjects[0];
              announcement = `Detected a ${obj.name}${obj.distance ? ` about ${obj.distance} meters away` : ''}`;
            } else {
              announcement = 'Detected: ';
              detectedObjects.forEach((obj, index) => {
                if (index > 0) {
                  announcement += index === detectedObjects.length - 1 ? ' and ' : ', ';
                }
                announcement += `a ${obj.name}${obj.distance ? ` about ${obj.distance} meters away` : ''}`;
              });
            }
            speechService.speak(announcement);
          }

          if (onDetection) {
            onDetection(detectedObjects);
          }
        }

        this.lastFrameTime = currentTime;
      } catch (error) {
        console.error('Error during object detection:', error);
        if (onError) {
          onError('Error during object detection');
        }
      }
    };

    detectFrame();
    this.detectionInterval = setInterval(detectFrame, detectionInterval);
  }

  stopDetection(): void {
    if (!this.isDetecting) {
      return;
    }

    this.isDetecting = false;
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  isDetectionActive(): boolean {
    return this.isDetecting;
  }

  // Simulate object detection
  private simulateObjectDetection(
    confidenceThreshold: number,
    maxDetections: number
  ): DetectedObject[] {
    const detectedObjects: DetectedObject[] = [];
    
    // Determine how many objects to detect (1-3 is realistic)
    const numObjects = Math.floor(Math.random() * 3) + 1;
    
    // Create a copy of the common objects array to avoid modifying the original
    const availableObjects = [...this.commonObjects];
    
    for (let i = 0; i < numObjects && availableObjects.length > 0; i++) {
      // Select a random object based on probability
      const randomValue = Math.random();
      let cumulativeProbability = 0;
      let selectedIndex = -1;
      
      for (let j = 0; j < availableObjects.length; j++) {
        cumulativeProbability += availableObjects[j].probability;
        if (randomValue <= cumulativeProbability) {
          selectedIndex = j;
          break;
        }
      }
      
      if (selectedIndex === -1) {
        selectedIndex = Math.floor(Math.random() * availableObjects.length);
      }
      
      // Get the selected object
      const selectedObject = availableObjects[selectedIndex];
      
      // Remove the selected object to avoid duplicates
      availableObjects.splice(selectedIndex, 1);
      
      // Generate a confidence score with some randomness
      const baseConfidence = selectedObject.probability;
      const randomFactor = Math.random() * 0.3 - 0.15; // -0.15 to +0.15
      const confidence = Math.min(Math.max(baseConfidence + randomFactor, 0.1), 0.99);
      
      // Only include objects above the confidence threshold
      if (confidence >= confidenceThreshold) {
        // Generate a random bounding box
        const x = Math.random() * 0.7 + 0.15; // 0.15 to 0.85
        const y = Math.random() * 0.7 + 0.15; // 0.15 to 0.85
        const width = Math.random() * 0.3 + 0.1; // 0.1 to 0.4
        const height = Math.random() * 0.3 + 0.1; // 0.1 to 0.4
        
        // Generate a realistic distance based on the object's predefined range
        const [minDist, maxDist] = selectedObject.distanceRange;
        const distance = Math.round((Math.random() * (maxDist - minDist) + minDist) * 10) / 10; // Round to 1 decimal place
        
        detectedObjects.push({
          id: `${selectedObject.name}-${Date.now()}-${i}`,
          name: selectedObject.name,
          confidence,
          boundingBox: { x, y, width, height },
          distance
        });
      }
      
      // Limit to max detections
      if (detectedObjects.length >= maxDetections) {
        break;
      }
    }
    
    return detectedObjects;
  }

  private async loadModel() {
    try {
      // Initialize TensorFlow
      await tf.ready();
      
      // Load the model from local assets
      const modelJson = require('../../assets/model/model.json');
      const modelWeights = require('../../assets/model/weights.bin');
      
      // Load the model using bundleResourceIO
      this.model = await tf.loadGraphModel(
        bundleResourceIO(modelJson, modelWeights)
      );
      
      // Warm up the model
      const dummyInput = tf.zeros([1, 300, 300, 3], 'int32');
      await this.model.predict(dummyInput);
      tf.dispose(dummyInput);
      
      this.isModelLoaded = true;
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }
}

// Singleton instance
export const objectDetectionService = new ObjectDetectionService();
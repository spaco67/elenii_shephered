import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

export class ModelLoader {
  private static instance: ModelLoader;
  private model: tf.GraphModel | null = null;
  private isModelLoaded: boolean = false;
  private loadingProgress: number = 0;
  private loadingStatus: string = 'Initializing...';

  private constructor() {}

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  async loadModel(): Promise<tf.GraphModel> {
    if (this.isModelLoaded && this.model) {
      return this.model;
    }

    try {
      this.loadingStatus = 'Initializing TensorFlow...';
      this.loadingProgress = 0;
      
      // Initialize TensorFlow
      await tf.setBackend('rn-webgl');  // Set WebGL backend
      await tf.ready();  // Ensure TensorFlow is ready
      this.loadingProgress = 20;
      this.loadingStatus = 'Loading model...';
      
      // Load the model from local assets
      const modelJson = require('../../assets/model/model.json'); 
      const modelWeights = [require('../../assets/model/weights.bin')]; // Make weights an array
      
      // Load the model using bundleResourceIO
      this.model = await tf.loadGraphModel(
        bundleResourceIO(modelJson, modelWeights)
      );
      
      this.loadingProgress = 90;
      this.loadingStatus = 'Finalizing model setup...';
      
      // Warm up the model with correct input type
       // Use correct dummy input shape and type
    const dummyInput = tf.zeros([1, 224, 224, 3], 'float32'); 
    await this.model.predict(dummyInput);
    tf.dispose(dummyInput);
      
      this.isModelLoaded = true;
      this.loadingProgress = 100;
      this.loadingStatus = 'Model loaded successfully';
      console.log('Model loaded successfully');

      return this.model;
    } catch (error) {
      console.error('Error loading model:', error);
      this.loadingStatus = 'Error loading model';
      this.loadingProgress = 0;
      throw error;
    }
  }

  getLoadingProgress(): { progress: number; status: string } {
    return {
      progress: this.loadingProgress,
      status: this.loadingStatus
    };
  }

  isLoaded(): boolean {
    return this.isModelLoaded;
  }

  getModel(): tf.GraphModel | null {
    return this.model;
  }
} 
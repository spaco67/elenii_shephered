import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

class SpeechService {
  private isSpeaking: boolean = false;
  private queue: { text: string; options?: SpeechOptions }[] = [];
  private isProcessingQueue: boolean = false;
  private defaultOptions: SpeechOptions = {
    language: 'en',
    pitch: 1.0,
    rate: 0.9
  };

  constructor() {
    // Initialize speech service
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<boolean> {
    try {
      const available = await Speech.isSpeakingAsync();
      return true; // If we get here, the API is available
    } catch (error) {
      console.error('Speech synthesis not available:', error);
      return false;
    }
  }

  speak(text: string, options?: SpeechOptions): void {
    // Add to queue
    this.queue.push({ text, options });
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const { text, options } = this.queue.shift()!;
    
    try {
      this.isSpeaking = true;
      
      const mergedOptions = {
        ...this.defaultOptions,
        ...options,
        onDone: () => {
          this.isSpeaking = false;
          if (options?.onDone) options.onDone();
          this.processQueue(); // Process next item in queue
        },
        onError: (error: string) => {
          this.isSpeaking = false;
          if (options?.onError) options.onError(error);
          this.processQueue(); // Process next item in queue
        }
      };

      await Speech.speak(text, mergedOptions);
    } catch (error) {
      console.error('Error speaking:', error);
      this.isSpeaking = false;
      if (options?.onError) options.onError(String(error));
      this.processQueue(); // Process next item in queue
    }
  }

  stop(): void {
    Speech.stop();
    this.isSpeaking = false;
    this.queue = []; // Clear the queue
  }

  async isSpeakingAsync(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking if speaking:', error);
      return false;
    }
  }

  setDefaultOptions(options: SpeechOptions): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
  }
}

// Singleton instance
export const speechService = new SpeechService();
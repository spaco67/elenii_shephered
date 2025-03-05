import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

interface SpeechManagerProps {
  isSpeechEnabled: boolean;
  speechRate?: number;
  speechPitch?: number;
}

export const useSpeech = ({
  isSpeechEnabled = true,
  speechRate = 0.9,
  speechPitch = 1.0,
}: SpeechManagerProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      // Clean up any ongoing speech when component unmounts
      Speech.stop();
    };
  }, []);

  const speak = (text: string, options?: Speech.SpeechOptions) => {
    if (!isSpeechEnabled) return;

    // Stop any ongoing speech
    Speech.stop();

    const defaultOptions: Speech.SpeechOptions = {
      language: 'en',
      pitch: speechPitch,
      rate: speechRate,
    };

    setIsSpeaking(true);

    Speech.speak(text, {
      ...defaultOptions,
      ...options,
      onDone: () => {
        setIsSpeaking(false);
        options?.onDone?.();
      },
      onError: (error) => {
        setIsSpeaking(false);
        options?.onError?.(error);
      },
    });
  };

  const stop = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return {
    speak,
    stop,
    isSpeaking,
  };
};
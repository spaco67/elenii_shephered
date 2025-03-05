import { useState, useEffect } from 'react';
import { speechService, SpeechOptions } from '../services/SpeechService';

export function useSpeech(defaultOptions?: SpeechOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default options if provided
    if (defaultOptions) {
      speechService.setDefaultOptions(defaultOptions);
    }

    // Check if already speaking
    const checkSpeaking = async () => {
      try {
        const speaking = await speechService.isSpeakingAsync();
        setIsSpeaking(speaking);
      } catch (err) {
        setError('Failed to check speech status');
      }
    };

    checkSpeaking();

    return () => {
      // Clean up
    };
  }, []);

  const speak = (text: string, options?: SpeechOptions) => {
    setError(null);
    setIsSpeaking(true);

    try {
      speechService.speak(text, {
        ...options,
        onDone: () => {
          setIsSpeaking(false);
          if (options?.onDone) {
            options.onDone();
          }
        },
        onError: (err) => {
          setIsSpeaking(false);
          setError(err);
          if (options?.onError) {
            options.onError(err);
          }
        }
      });
    } catch (err) {
      setIsSpeaking(false);
      setError('Failed to speak');
    }
  };

  const stop = () => {
    try {
      speechService.stop();
      setIsSpeaking(false);
    } catch (err) {
      setError('Failed to stop speech');
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    error
  };
}
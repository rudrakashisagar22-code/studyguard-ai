import { useCallback, useEffect, useRef, useState } from 'react';
import type { CoachMessage } from '@/hooks/useStudyCoach';

interface UseSpeechOptions {
  message: CoachMessage | null;
}

const SPEECH_RATE = 0.95;
const SPEECH_PITCH = 1.0;

export function useSpeech({ message }: UseSpeechOptions) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voiceEnabled, setVoiceEnabled] = useState(supported);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenIdRef = useRef<number | null>(null);

  // Cancel any ongoing speech
  const cancelSpeech = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  // Speak a given text, cancelling any in-progress speech first
  const speak = useCallback(
    (text: string) => {
      if (!supported || !voiceEnabled || !text) return;
      // Prevent overlap: cancel previous speech before starting new
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      utterance.volume = volume;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported, voiceEnabled, volume],
  );

  // React to new coach messages
  useEffect(() => {
    if (!message || message.id === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = message.id;
    speak(message.text);
  }, [message, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  // Cancel speech when voice is turned off
  useEffect(() => {
    if (!voiceEnabled) {
      cancelSpeech();
    }
  }, [voiceEnabled, cancelSpeech]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
  }, []);

  return {
    supported,
    voiceEnabled,
    volume,
    isSpeaking,
    toggleVoice,
    setVolume,
    cancelSpeech,
  };
}

'use client';

/**
 * useSpeech — Hook compartido para lectura en voz alta (TTS) vía
 * Web Speech API. Configurado para es-CL con rate suave (0.92) y pitch
 * neutro. SSR-safe: `supported` arranca en false y se confirma en
 * `useEffect` tras mount.
 *
 * Uso:
 *   const { supported, speakingId, speak, stop } = useSpeech();
 *   speak('section-id', 'Texto a leer en voz alta');
 *   if (speakingId === 'section-id') ...
 */

import { useCallback, useEffect, useState } from 'react';

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'es-CL';
    utt.rate = 0.92;
    utt.pitch = 1;
    utt.onend = () => setSpeakingId(null);
    utt.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utt);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  return { supported, speakingId, speak, stop };
}

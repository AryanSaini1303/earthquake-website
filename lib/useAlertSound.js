'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';

// Returns a `play` function for the alert beep. Browsers block audio until the
// user has interacted with the page, so the first click resumes the audio context.
export default function useAlertSound(src = '/sounds/beep-warning-1.mp3') {
  const soundRef = useRef(null);

  useEffect(() => {
    soundRef.current = new Howl({ src: [src] });

    const unlock = () => {
      if (window.Howler?.ctx?.state === 'suspended') window.Howler.ctx.resume();
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock);

    return () => {
      document.removeEventListener('click', unlock);
      soundRef.current?.unload();
      soundRef.current = null;
    };
  }, [src]);

  return useCallback(() => {
    soundRef.current?.play();
  }, []);
}

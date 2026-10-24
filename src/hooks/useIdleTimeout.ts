import { useEffect, useRef } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMs?: number;
  backgroundMobileTimeoutMs?: number;
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMs = 10 * 60 * 1000, // 10 minutos por defecto en PC compartida
  backgroundMobileTimeoutMs = 60 * 1000, // 60 segundos al pasar a segundo plano en móvil
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const timerRef = useRef<number | null>(null);
  const bgTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onIdle();
      }, timeoutMs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onIdle();
        return;
      }
      resetTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        bgTimerRef.current = window.setTimeout(() => {
          onIdle();
        }, backgroundMobileTimeoutMs);
      } else {
        if (bgTimerRef.current) {
          window.clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
        resetTimer();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'touchstart',
      'scroll',
    ];

    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (bgTimerRef.current) window.clearTimeout(bgTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeoutMs, backgroundMobileTimeoutMs, onIdle, enabled]);
}

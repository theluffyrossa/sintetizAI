import { useCallback, useEffect, useRef, useState } from 'react';

type WebcamStatus = 'idle' | 'requesting' | 'ready' | 'error';

export interface UseWebcamResult {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly status: WebcamStatus;
  readonly error: string | null;
  readonly start: () => Promise<void>;
  readonly stop: () => void;
}

export function useWebcam(): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback((): void => {
    if (streamRef.current !== null) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current !== null) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current !== null) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch (e) {
      console.error('useWebcam.start failed', e);
      const message = e instanceof Error ? `${e.name}: ${e.message}` : 'Falha ao acessar a webcam';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop };
}

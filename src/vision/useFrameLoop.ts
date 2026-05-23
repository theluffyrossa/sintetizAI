import { useEffect, useRef } from 'react';
import { detectFrame, initHandLandmarker } from './handLandmarker';
import type { FrameDetection } from '@/types/vision';

export interface UseFrameLoopOptions {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly enabled: boolean;
  readonly onFrame: (detection: FrameDetection) => void;
}

export function useFrameLoop({ videoRef, enabled, onFrame }: UseFrameLoopOptions): void {
  const rafRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const tick = (timestampMs: number): void => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video !== null && video.readyState >= 2) {
        try {
          const detection = detectFrame(video, timestampMs);
          onFrameRef.current(detection);
        } catch (e) {
          console.error('frameLoop detection error', e);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    void initHandLandmarker().then(() => {
      if (!cancelled) rafRef.current = requestAnimationFrame(tick);
    }).catch((e) => console.error('initHandLandmarker failed', e));

    return (): void => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, videoRef]);
}

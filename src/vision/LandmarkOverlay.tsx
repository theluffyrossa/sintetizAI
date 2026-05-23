import { useEffect, useRef, type JSX } from 'react';
import { drawDetection } from './drawing';
import type { FrameDetection } from '@/types/vision';

export interface LandmarkOverlayProps {
  readonly width: number;
  readonly height: number;
  readonly detectionRef: React.RefObject<FrameDetection | null>;
}

export function LandmarkOverlay({ width, height, detectionRef }: LandmarkOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    let rafId = 0;
    const loop = (): void => {
      const detection = detectionRef.current;
      if (detection !== null) {
        drawDetection(ctx, detection, width, height);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return (): void => cancelAnimationFrame(rafId);
  }, [width, height, detectionRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
    />
  );
}

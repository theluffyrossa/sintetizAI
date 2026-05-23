import { useEffect, useRef, type JSX } from 'react';
import * as Tone from 'tone';

export interface VisualizerProps {
  readonly width: number;
  readonly height: number;
}

export function Visualizer({ width, height }: VisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const analyser = new Tone.Analyser('waveform', 512);
    Tone.getDestination().connect(analyser);

    let rafId = 0;
    const draw = (): void => {
      const data = analyser.getValue() as Float32Array;
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#7cffb2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = width / data.length;
      for (let i = 0; i < data.length; i += 1) {
        const v = data[i] ?? 0;
        const x = i * step;
        const y = height / 2 + v * height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return (): void => {
      cancelAnimationFrame(rafId);
      analyser.dispose();
    };
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded border border-zinc-800" />;
}

import type { JSX } from 'react';
import { cn } from '@/lib/cn';

export interface KnobProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly unit?: string;
  readonly className?: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function Knob({ label, value, min, max, unit, className }: KnobProps): JSX.Element {
  const clamped = clamp(value, min, max);
  const normalized = (clamped - min) / (max - min);
  const angle = -135 + normalized * 270;
  const displayValue = unit !== undefined
    ? `${Math.round(clamped)} ${unit}`
    : Math.round(clamped).toString();

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={26} fill="#1b1f27" stroke="#2a2f3a" strokeWidth={2} />
        <line
          x1={32}
          y1={32}
          x2={32 + 22 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={32 + 22 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#7cffb2"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-zinc-300">{label}</span>
      <span className="text-[10px] text-zinc-500 tabular-nums">{displayValue}</span>
    </div>
  );
}

import type { MappingCurve } from '@/types/gesture';
import { MAJOR_SCALE, quantizeToScale } from './scales';

function normalize(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0;
  return (value - inMin) / (inMax - inMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapValue(
  rawInput: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  curve: MappingCurve,
): number {
  const t = clamp(normalize(rawInput, inMin, inMax), 0, 1);
  switch (curve) {
    case 'linear':
      return outMin + t * (outMax - outMin);
    case 'exponential': {
      const expT = (Math.pow(2, t * 10) - 1) / (Math.pow(2, 10) - 1);
      return outMin + expT * (outMax - outMin);
    }
    case 'quantizedScale': {
      const rootMidi = Math.round(outMin);
      return quantizeToScale(t, MAJOR_SCALE, rootMidi);
    }
  }
}

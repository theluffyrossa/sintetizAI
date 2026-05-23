import type { GestureBinding } from '@/types/gesture';
import {
  CUTOFF_MAX_HZ, CUTOFF_MIN_HZ, PITCH_MAX_MIDI, PITCH_MIN_MIDI,
  RESONANCE_MAX, RESONANCE_MIN, DEFAULT_SMOOTHING_MS,
  AMPLITUDE_MAX, AMPLITUDE_MIN,
} from './audio';

export const DEFAULT_GESTURE_BINDINGS: readonly GestureBinding[] = [
  {
    id: 'rh-y-pitch',
    hand: 'Right',
    feature: 'positionY',
    target: 'pitch',
    curve: 'quantizedScale',
    inputMin: 0, inputMax: 1,
    outputMin: PITCH_MIN_MIDI, outputMax: PITCH_MAX_MIDI,
    smoothingMs: DEFAULT_SMOOTHING_MS,
  },
  {
    id: 'rh-pinch-amp',
    hand: 'Right',
    feature: 'pinchDistance',
    target: 'amplitude',
    curve: 'linear',
    inputMin: 0.02, inputMax: 0.25,
    outputMin: AMPLITUDE_MIN, outputMax: AMPLITUDE_MAX,
    smoothingMs: DEFAULT_SMOOTHING_MS,
  },
  {
    id: 'lh-x-cutoff',
    hand: 'Left',
    feature: 'positionX',
    target: 'cutoff',
    curve: 'exponential',
    inputMin: 0, inputMax: 1,
    outputMin: CUTOFF_MIN_HZ, outputMax: CUTOFF_MAX_HZ,
    smoothingMs: DEFAULT_SMOOTHING_MS,
  },
  {
    id: 'lh-pinch-res',
    hand: 'Left',
    feature: 'pinchDistance',
    target: 'resonance',
    curve: 'linear',
    inputMin: 0.02, inputMax: 0.25,
    outputMin: RESONANCE_MIN, outputMax: RESONANCE_MAX,
    smoothingMs: DEFAULT_SMOOTHING_MS,
  },
];

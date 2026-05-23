import type { Handedness } from './vision';

export type GestureFeatureKind =
  | 'positionX'
  | 'positionY'
  | 'pinchDistance'
  | 'palmOpenness'
  | 'handsDistance'
  | 'fistDetected';

export type GestureTargetParam =
  | 'pitch'
  | 'amplitude'
  | 'cutoff'
  | 'resonance'
  | 'lfoDepth'
  | 'modulationIndex'
  | 'sustain';

export type MappingCurve = 'linear' | 'exponential' | 'quantizedScale';

export interface GestureBinding {
  readonly id: string;
  readonly hand: Handedness | 'both';
  readonly feature: GestureFeatureKind;
  readonly target: GestureTargetParam;
  readonly curve: MappingCurve;
  readonly inputMin: number;
  readonly inputMax: number;
  readonly outputMin: number;
  readonly outputMax: number;
  readonly smoothingMs: number;
}

export interface GestureFeatureSample {
  readonly hand: Handedness | 'both';
  readonly feature: GestureFeatureKind;
  readonly value: number;
}

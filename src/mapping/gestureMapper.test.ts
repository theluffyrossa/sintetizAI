import { describe, it, expect, vi } from 'vitest';
import { extractFeatures, applyBindings } from './gestureMapper';
import type { FrameDetection, DetectedHand, HandLandmarks } from '@/types/vision';
import type { GestureBinding } from '@/types/gesture';
import type { SynthMode } from '@/types/audio';

function makeHand(handedness: 'Left' | 'Right', wristX: number, wristY: number): DetectedHand {
  const points = Array.from({ length: 21 }, () => ({ x: wristX, y: wristY, z: 0 }));
  return {
    landmarks: points as unknown as HandLandmarks,
    worldLandmarks: points as unknown as HandLandmarks,
    handedness,
    score: 0.9,
  };
}

describe('extractFeatures', () => {
  it('extrai positionX/Y para cada mão detectada', () => {
    const detection: FrameDetection = {
      hands: [makeHand('Right', 0.7, 0.3)],
      timestampMs: 0,
    };
    const features = extractFeatures(detection);
    const posX = features.find((f) => f.hand === 'Right' && f.feature === 'positionX');
    expect(posX?.value).toBe(0.7);
  });
});

describe('applyBindings', () => {
  it('chama setParam para cada binding com mão correspondente', () => {
    const setParam = vi.fn();
    const mode: SynthMode = {
      kind: 'subtractive',
      setParam,
      start: async (): Promise<void> => undefined,
      stop: (): void => undefined,
      noteOn: (): void => undefined,
      noteOff: (): void => undefined,
      dispose: (): void => undefined,
    };
    const bindings: GestureBinding[] = [{
      id: 't1', hand: 'Right', feature: 'positionX', target: 'cutoff', curve: 'linear',
      inputMin: 0, inputMax: 1, outputMin: 100, outputMax: 1000, smoothingMs: 10,
    }];
    const detection: FrameDetection = { hands: [makeHand('Right', 0.5, 0.0)], timestampMs: 0 };
    applyBindings(detection, bindings, mode);
    expect(setParam).toHaveBeenCalledWith('cutoff', expect.any(Number), 10);
  });
});

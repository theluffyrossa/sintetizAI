import { handsDistance, palmOpenness, pinchDistance, positionXY } from '@/vision/features';
import type { FrameDetection } from '@/types/vision';
import type { GestureBinding, GestureFeatureSample } from '@/types/gesture';
import type { SynthMode } from '@/types/audio';
import { mapValue } from './curves';

export function extractFeatures(detection: FrameDetection): readonly GestureFeatureSample[] {
  const out: GestureFeatureSample[] = [];
  for (const hand of detection.hands) {
    const { x, y } = positionXY(hand.landmarks);
    out.push({ hand: hand.handedness, feature: 'positionX', value: x });
    out.push({ hand: hand.handedness, feature: 'positionY', value: y });
    out.push({ hand: hand.handedness, feature: 'pinchDistance', value: pinchDistance(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'palmOpenness', value: palmOpenness(hand.landmarks) });
  }
  if (detection.hands.length === 2) {
    const first = detection.hands[0];
    const second = detection.hands[1];
    if (first !== undefined && second !== undefined) {
      out.push({
        hand: 'both',
        feature: 'handsDistance',
        value: handsDistance(first.landmarks, second.landmarks),
      });
    }
  }
  return out;
}

export function applyBindings(
  detection: FrameDetection,
  bindings: readonly GestureBinding[],
  mode: SynthMode,
): void {
  const features = extractFeatures(detection);
  for (const binding of bindings) {
    const sample = features.find(
      (f) => f.hand === binding.hand && f.feature === binding.feature,
    );
    if (sample === undefined) continue;
    const mapped = mapValue(
      sample.value,
      binding.inputMin,
      binding.inputMax,
      binding.outputMin,
      binding.outputMax,
      binding.curve,
    );
    mode.setParam(binding.target, mapped, binding.smoothingMs);
  }
}

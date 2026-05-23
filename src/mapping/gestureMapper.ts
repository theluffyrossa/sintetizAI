import {
  fingerSpread,
  handDepth,
  handTilt,
  handVelocity,
  handsDistance,
  middlePinch,
  palmOpenness,
  pinchDistance,
  positionXY,
} from '@/vision/features';
import type { FrameDetection, Handedness, Landmark3D } from '@/types/vision';
import type { GestureBinding, GestureFeatureSample } from '@/types/gesture';
import type { SynthMode } from '@/types/audio';
import { WRIST_INDEX } from '@/constants/vision';
import { mapValue } from './curves';
import { publishParam } from '@/state/paramThrottle';

export interface MapperPrevFrame {
  readonly wrist: Landmark3D;
  readonly tsMs: number;
}

export interface MapperState {
  readonly prevByHand: Map<Handedness, MapperPrevFrame>;
}

export function createMapperState(): MapperState {
  return { prevByHand: new Map() };
}

const moduleState: MapperState = createMapperState();

export function extractFeatures(
  detection: FrameDetection,
  state?: MapperState,
): readonly GestureFeatureSample[] {
  const out: GestureFeatureSample[] = [];
  for (const hand of detection.hands) {
    const { x, y } = positionXY(hand.landmarks);
    out.push({ hand: hand.handedness, feature: 'positionX', value: x });
    out.push({ hand: hand.handedness, feature: 'positionY', value: y });
    out.push({ hand: hand.handedness, feature: 'pinchDistance', value: pinchDistance(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'palmOpenness', value: palmOpenness(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'handTilt', value: handTilt(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'handDepth', value: handDepth(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'middlePinch', value: middlePinch(hand.landmarks) });
    out.push({ hand: hand.handedness, feature: 'fingerSpread', value: fingerSpread(hand.landmarks) });

    const prev = state?.prevByHand.get(hand.handedness);
    const dtMs = prev !== undefined ? detection.timestampMs - prev.tsMs : 0;
    const velocity = handVelocity(hand.landmarks, prev?.wrist, dtMs);
    out.push({ hand: hand.handedness, feature: 'handVelocity', value: velocity });

    if (state !== undefined) {
      state.prevByHand.set(hand.handedness, {
        wrist: hand.landmarks[WRIST_INDEX],
        tsMs: detection.timestampMs,
      });
    }
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
  const features = extractFeatures(detection, moduleState);
  const now = detection.timestampMs;
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
    publishParam(binding.target, mapped, now);
  }
}

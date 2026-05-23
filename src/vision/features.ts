import type { HandLandmarks, Landmark3D } from '@/types/vision';
import { INDEX_TIP_INDEX, THUMB_TIP_INDEX, WRIST_INDEX } from '@/constants/vision';

function distance(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function pinchDistance(hand: HandLandmarks): number {
  return distance(hand[THUMB_TIP_INDEX], hand[INDEX_TIP_INDEX]);
}

export function positionXY(hand: HandLandmarks): { readonly x: number; readonly y: number } {
  const wrist = hand[WRIST_INDEX];
  return { x: wrist.x, y: wrist.y };
}

const FINGER_TIP_INDICES = [8, 12, 16, 20] as const;

export function palmOpenness(hand: HandLandmarks): number {
  const wrist = hand[WRIST_INDEX];
  let total = 0;
  for (const tipIndex of FINGER_TIP_INDICES) {
    total += distance(hand[tipIndex], wrist);
  }
  return total / FINGER_TIP_INDICES.length;
}

export function handsDistance(a: HandLandmarks, b: HandLandmarks): number {
  return distance(a[WRIST_INDEX], b[WRIST_INDEX]);
}

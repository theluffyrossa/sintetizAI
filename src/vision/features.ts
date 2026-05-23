import type { HandLandmarks, Landmark3D, Point2D } from '@/types/vision';
import {
  FINGER_TIP_INDICES,
  INDEX_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  RING_TIP_INDEX,
  PINKY_TIP_INDEX,
  MIDDLE_MCP_INDEX,
  THUMB_TIP_INDEX,
  WRIST_INDEX,
  HAND_TILT_NORM_ANGLE,
  HAND_VELOCITY_MAX_NORM,
  HAND_DEPTH_MIN,
  HAND_DEPTH_MAX,
  FINGER_SPREAD_REF_DIST,
} from '@/constants/vision';

function distance(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function pinchDistance(hand: HandLandmarks): number {
  return distance(hand[THUMB_TIP_INDEX], hand[INDEX_TIP_INDEX]);
}

export function positionXY(hand: HandLandmarks): Point2D {
  const wrist = hand[WRIST_INDEX];
  return { x: wrist.x, y: wrist.y };
}

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

export function handTilt(hand: HandLandmarks): number {
  const wrist = hand[WRIST_INDEX];
  const middleMcp = hand[MIDDLE_MCP_INDEX];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const angle = Math.atan2(dx, -dy);
  return clamp(angle / HAND_TILT_NORM_ANGLE, -1, 1);
}

export function handVelocity(
  hand: HandLandmarks,
  prevWrist: Landmark3D | undefined,
  dtMs: number,
): number {
  if (prevWrist === undefined || dtMs <= 0) return 0;
  const wrist = hand[WRIST_INDEX];
  const dist = distance(wrist, prevWrist);
  const speed = dist / (dtMs / 1000);
  return clamp(speed / HAND_VELOCITY_MAX_NORM, 0, 1);
}

export function handDepth(hand: HandLandmarks): number {
  const wrist = hand[WRIST_INDEX];
  const range = HAND_DEPTH_MAX - HAND_DEPTH_MIN;
  const normalized = (HAND_DEPTH_MAX - wrist.z) / range;
  return clamp(normalized, 0, 1);
}

export function middlePinch(hand: HandLandmarks): number {
  return distance(hand[THUMB_TIP_INDEX], hand[MIDDLE_TIP_INDEX]);
}

export function fingerSpread(hand: HandLandmarks): number {
  const total =
    distance(hand[INDEX_TIP_INDEX], hand[MIDDLE_TIP_INDEX]) +
    distance(hand[MIDDLE_TIP_INDEX], hand[RING_TIP_INDEX]) +
    distance(hand[RING_TIP_INDEX], hand[PINKY_TIP_INDEX]);
  return clamp(total / FINGER_SPREAD_REF_DIST, 0, 1);
}

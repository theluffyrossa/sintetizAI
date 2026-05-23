export interface Landmark3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type HandLandmarks = readonly [
  Landmark3D, Landmark3D, Landmark3D, Landmark3D, Landmark3D,
  Landmark3D, Landmark3D, Landmark3D, Landmark3D, Landmark3D,
  Landmark3D, Landmark3D, Landmark3D, Landmark3D, Landmark3D,
  Landmark3D, Landmark3D, Landmark3D, Landmark3D, Landmark3D, Landmark3D,
];

export type Handedness = 'Left' | 'Right';

export interface DetectedHand {
  readonly landmarks: HandLandmarks;
  readonly worldLandmarks: HandLandmarks;
  readonly handedness: Handedness;
  readonly score: number;
}

export interface FrameDetection {
  readonly hands: readonly DetectedHand[];
  readonly timestampMs: number;
}

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

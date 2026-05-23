export const MAX_HANDS = 2;
export const MIN_TRACKING_CONFIDENCE = 0.5;
export const MIN_DETECTION_CONFIDENCE = 0.5;
export const HAND_LANDMARKER_MODEL_URL = '/models/hand_landmarker.task';
export const MEDIAPIPE_WASM_BASE_URL = '/mediapipe/wasm';
export const THUMB_TIP_INDEX = 4;
export const INDEX_TIP_INDEX = 8;
export const WRIST_INDEX = 0;
export const MIDDLE_TIP_INDEX = 12;
export const RING_TIP_INDEX = 16;
export const PINKY_TIP_INDEX = 20;
export const FINGER_TIP_INDICES = [
  INDEX_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  RING_TIP_INDEX,
  PINKY_TIP_INDEX,
] as const;
export const MIDDLE_MCP_INDEX = 9;
export const HAND_TILT_NORM_ANGLE = Math.PI / 2;
export const HAND_VELOCITY_MAX_NORM = 3.0;
export const HAND_DEPTH_MIN = -0.15;
export const HAND_DEPTH_MAX = 0.15;
export const FINGER_SPREAD_REF_DIST = 0.30;

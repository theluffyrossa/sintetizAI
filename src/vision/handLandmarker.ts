import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import {
  HAND_LANDMARKER_MODEL_URL,
  MAX_HANDS,
  MIN_DETECTION_CONFIDENCE,
  MIN_TRACKING_CONFIDENCE,
} from '@/constants/vision';
import type { DetectedHand, FrameDetection, HandLandmarks, Handedness } from '@/types/vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

let landmarker: HandLandmarker | null = null;

export async function initHandLandmarker(): Promise<void> {
  if (landmarker !== null) return;
  const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
  landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_MODEL_URL,
      delegate: 'GPU',
    },
    numHands: MAX_HANDS,
    runningMode: 'VIDEO',
    minHandDetectionConfidence: MIN_DETECTION_CONFIDENCE,
    minHandPresenceConfidence: MIN_DETECTION_CONFIDENCE,
    minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
  });
}

export function detectFrame(video: HTMLVideoElement, timestampMs: number): FrameDetection {
  if (landmarker === null) {
    throw new Error('HandLandmarker not initialized. Call initHandLandmarker() first.');
  }
  const result = landmarker.detectForVideo(video, timestampMs);
  return adaptResult(result, timestampMs);
}

export function disposeHandLandmarker(): void {
  if (landmarker !== null) {
    landmarker.close();
    landmarker = null;
  }
}

function adaptResult(result: HandLandmarkerResult, timestampMs: number): FrameDetection {
  const hands: DetectedHand[] = [];
  for (let i = 0; i < result.landmarks.length; i += 1) {
    const lm = result.landmarks[i];
    const wlm = result.worldLandmarks[i];
    const handednessCategories = result.handedness[i];
    if (lm === undefined || wlm === undefined || handednessCategories === undefined) continue;
    const topCategory = handednessCategories[0];
    if (topCategory === undefined) continue;
    const handednessLabel = topCategory.categoryName;
    if (handednessLabel !== 'Left' && handednessLabel !== 'Right') continue;
    const handedness: Handedness = handednessLabel;
    hands.push({
      landmarks: lm as unknown as HandLandmarks,
      worldLandmarks: wlm as unknown as HandLandmarks,
      handedness,
      score: topCategory.score,
    });
  }
  return { hands, timestampMs };
}

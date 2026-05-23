# SintetizAI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based musical synthesizer controlled by hand gestures captured via webcam, with three switchable synthesis modes (subtractive, FM, sampler) and persistent presets.

**Architecture:** Vite + React 19 client-only SPA. MediaPipe Tasks Vision runs hand detection at 30-60 FPS in the main thread; landmarks flow through a pure mapping layer (no React state) into Tone.js `AudioParam` ramps, so the audio thread (AudioWorklet) receives smooth values at sub-15ms latency. React UI listens to throttled snapshots (~15Hz) via Jotai atoms for knob displays. Presets persisted in IndexedDB via Dexie, validated by Zod.

**Tech Stack:** Vite 6, React 19, TypeScript 5.6 strict, `@mediapipe/tasks-vision` 0.10+, Tone.js 15, Zustand 5, Jotai 2, Radix UI + shadcn/ui, Tailwind CSS 4, Framer Motion 11, Dexie 4, Zod 3, Vitest, Playwright.

**Spec reference:** [docs/superpowers/specs/2026-05-23-sintetizai-design.md](../specs/2026-05-23-sintetizai-design.md)

---

## Phase 1 — Foundation & Tooling

### Task 1: Initialize Vite + React 19 + TS strict project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.gitignore`
- Create: `.editorconfig`

- [ ] **Step 1: Scaffold the project**

Run from project root:
```bash
npm create vite@latest . -- --template react-ts
```
If prompted that directory is not empty, allow.

- [ ] **Step 2: Replace `package.json` with pinned versions**

```json
{
  "name": "sintetizai",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 3: Replace `tsconfig.json` with strict config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Configure Vite with path alias**

Replace `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
```

- [ ] **Step 5: Install dependencies**

Run:
```bash
npm install
```
Expected: completes without errors.

- [ ] **Step 6: Verify typecheck and dev server**

Run:
```bash
npm run typecheck
```
Expected: no output, exit 0.

Then:
```bash
npm run dev
```
Expected: server starts on http://localhost:5173.

Stop the dev server (Ctrl+C).

- [ ] **Step 7: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React 19 + TS strict project"
```

---

### Task 2: Add Tailwind CSS 4 + Radix + shadcn baseline

**Files:**
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `src/index.css`
- Modify: `src/main.tsx`
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Install Tailwind 4 and utilities**

```bash
npm install -D tailwindcss@^4.0.0 @tailwindcss/postcss autoprefixer postcss
npm install clsx tailwind-merge
```

- [ ] **Step 2: Create `postcss.config.js`**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f1115',
        accent: '#7cffb2',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Replace `src/index.css`**

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
}

html, body, #root {
  height: 100%;
  margin: 0;
  background: #07080b;
  color: #e7ecf3;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 5: Ensure `src/main.tsx` imports the css**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Create `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Verify build still works**

```bash
npm run typecheck && npm run build
```
Expected: completes without errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add Tailwind 4 + cn helper"
```

---

### Task 3: Add Vitest + Playwright + ESLint

**Files:**
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.eslintrc.cjs`
- Create: `tests/setup.ts`
- Create: `e2e/.gitkeep`

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom @playwright/test eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 5: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*'],
};
```

- [ ] **Step 6: Create `e2e/.gitkeep`**

Empty file.

- [ ] **Step 7: Verify all checks pass**

```bash
npm run typecheck
npm run lint
npm run test
```
Expected: all complete without errors (test will say "No test files found" — that's OK).

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add Vitest + Playwright + ESLint config"
```

---

### Task 4: Define core types and constants

**Files:**
- Create: `src/types/vision.ts`
- Create: `src/types/audio.ts`
- Create: `src/types/gesture.ts`
- Create: `src/types/preset.ts`
- Create: `src/constants/audio.ts`
- Create: `src/constants/vision.ts`
- Create: `src/constants/mapping.ts`

- [ ] **Step 1: Create `src/types/vision.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/types/audio.ts`**

```ts
export type SynthModeKind = 'subtractive' | 'fm' | 'sampler';

export interface SynthMode {
  readonly kind: SynthModeKind;
  start(): Promise<void>;
  stop(): void;
  setParam(name: string, value: number, smoothingMs: number): void;
  noteOn(midiNote: number, velocity: number): void;
  noteOff(midiNote: number): void;
  dispose(): void;
}

export interface AudioEngineStatus {
  readonly running: boolean;
  readonly contextState: AudioContextState | 'unloaded';
  readonly currentMode: SynthModeKind | null;
}
```

- [ ] **Step 3: Create `src/types/gesture.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/types/preset.ts`**

```ts
import type { SynthModeKind } from './audio';
import type { GestureBinding } from './gesture';

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly mode: SynthModeKind;
  readonly synthParams: Readonly<Record<string, number>>;
  readonly gestureBindings: readonly GestureBinding[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

- [ ] **Step 5: Create `src/constants/audio.ts`**

```ts
export const AUDIO_BUFFER_SIZE = 128;
export const DEFAULT_SMOOTHING_MS = 12;
export const PITCH_MIN_MIDI = 48;
export const PITCH_MAX_MIDI = 84;
export const CUTOFF_MIN_HZ = 200;
export const CUTOFF_MAX_HZ = 8000;
export const RESONANCE_MIN = 0.5;
export const RESONANCE_MAX = 20;
export const AMPLITUDE_MIN = 0;
export const AMPLITUDE_MAX = 1;
```

- [ ] **Step 6: Create `src/constants/vision.ts`**

```ts
export const MAX_HANDS = 2;
export const MIN_TRACKING_CONFIDENCE = 0.5;
export const MIN_DETECTION_CONFIDENCE = 0.5;
export const HAND_LANDMARKER_MODEL_URL = '/models/hand_landmarker.task';
export const MEDIAPIPE_WASM_BASE_URL = '/mediapipe/wasm';
export const THUMB_TIP_INDEX = 4;
export const INDEX_TIP_INDEX = 8;
export const WRIST_INDEX = 0;
```

- [ ] **Step 7: Create `src/constants/mapping.ts`**

```ts
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
```

- [ ] **Step 8: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add src/types src/constants
git commit -m "feat(types): add core domain types and constants"
```

---

## Phase 2 — Vision Pipeline

### Task 5: Implement gesture feature extraction (pure functions, TDD)

**Files:**
- Create: `src/vision/features.ts`
- Test: `src/vision/features.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/vision/features.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pinchDistance, positionXY, palmOpenness, handsDistance } from './features';
import type { HandLandmarks } from '@/types/vision';

function makeLandmarks(positions: ReadonlyArray<readonly [number, number, number]>): HandLandmarks {
  const points = positions.map(([x, y, z]) => ({ x, y, z }));
  return points as unknown as HandLandmarks;
}

const ZEROS = Array.from({ length: 21 }, () => [0, 0, 0] as const);

describe('pinchDistance', () => {
  it('deve calcular distância euclidiana entre polegar (4) e indicador (8)', () => {
    const positions = [...ZEROS];
    positions[4] = [0, 0, 0];
    positions[8] = [0.3, 0.4, 0];
    const hand = makeLandmarks(positions);
    expect(pinchDistance(hand)).toBeCloseTo(0.5, 5);
  });
});

describe('positionXY', () => {
  it('deve retornar coordenadas X/Y do wrist (landmark 0)', () => {
    const positions = [...ZEROS];
    positions[0] = [0.42, 0.73, 0];
    const hand = makeLandmarks(positions);
    expect(positionXY(hand)).toEqual({ x: 0.42, y: 0.73 });
  });
});

describe('palmOpenness', () => {
  it('deve aumentar quando dedos estão estendidos para longe do wrist', () => {
    const closed = makeLandmarks(ZEROS);
    const positions = [...ZEROS];
    positions[8] = [0, 1, 0];
    positions[12] = [0, 1, 0];
    positions[16] = [0, 1, 0];
    positions[20] = [0, 1, 0];
    const open = makeLandmarks(positions);
    expect(palmOpenness(open)).toBeGreaterThan(palmOpenness(closed));
  });
});

describe('handsDistance', () => {
  it('deve retornar distância entre wrists das duas mãos', () => {
    const aPositions = [...ZEROS];
    aPositions[0] = [0, 0, 0];
    const a = makeLandmarks(aPositions);
    const bPositions = [...ZEROS];
    bPositions[0] = [1, 0, 0];
    const b = makeLandmarks(bPositions);
    expect(handsDistance(a, b)).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm run test -- features
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/vision/features.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- features
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/vision/features.ts src/vision/features.test.ts
git commit -m "feat(vision): pure gesture feature extraction with tests"
```

---

### Task 6: Implement MediaPipe HandLandmarker wrapper

**Files:**
- Create: `src/vision/handLandmarker.ts`
- Create: `public/mediapipe/.gitkeep`
- Create: `public/models/.gitkeep`

- [ ] **Step 1: Install MediaPipe**

```bash
npm install @mediapipe/tasks-vision
```

- [ ] **Step 2: Create model directories**

```bash
mkdir -p public/mediapipe/wasm public/models
```

Create empty markers:
```bash
touch public/mediapipe/.gitkeep public/models/.gitkeep
```

- [ ] **Step 3: Document model download in `public/models/README.md`**

Create `public/models/README.md`:
```markdown
# Models

Download `hand_landmarker.task` from:
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

Place it as `public/models/hand_landmarker.task`.

The MediaPipe WASM runtime is loaded from CDN in dev; for production self-host
under `public/mediapipe/wasm/`.
```

- [ ] **Step 4: Create `src/vision/handLandmarker.ts`**

```ts
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
    const handednessLabel = result.handedness[i]?.[0]?.categoryName as Handedness | undefined;
    const score = result.handedness[i]?.[0]?.score ?? 0;
    if (handednessLabel !== 'Left' && handednessLabel !== 'Right') continue;
    hands.push({
      landmarks: lm as unknown as HandLandmarks,
      worldLandmarks: wlm as unknown as HandLandmarks,
      handedness: handednessLabel,
      score,
    });
  }
  return { hands, timestampMs };
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add public/mediapipe public/models src/vision/handLandmarker.ts package.json package-lock.json
git commit -m "feat(vision): MediaPipe HandLandmarker wrapper with GPU delegate"
```

---

### Task 7: Frame loop hook and webcam access

**Files:**
- Create: `src/vision/useWebcam.ts`
- Create: `src/vision/useFrameLoop.ts`

- [ ] **Step 1: Create `src/vision/useWebcam.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

type WebcamStatus = 'idle' | 'requesting' | 'ready' | 'error';

export interface UseWebcamResult {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly status: WebcamStatus;
  readonly error: string | null;
  readonly start: () => Promise<void>;
  readonly stop: () => void;
}

export function useWebcam(): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback((): void => {
    if (streamRef.current !== null) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current !== null) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current !== null) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao acessar a webcam';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop };
}
```

- [ ] **Step 2: Create `src/vision/useFrameLoop.ts`**

```ts
import { useEffect, useRef } from 'react';
import { detectFrame, initHandLandmarker } from './handLandmarker';
import type { FrameDetection } from '@/types/vision';

export interface UseFrameLoopOptions {
  readonly video: HTMLVideoElement | null;
  readonly enabled: boolean;
  readonly onFrame: (detection: FrameDetection) => void;
}

export function useFrameLoop({ video, enabled, onFrame }: UseFrameLoopOptions): void {
  const rafRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled || video === null) return;

    let cancelled = false;

    const tick = (timestampMs: number): void => {
      if (cancelled) return;
      if (video.readyState >= 2) {
        try {
          const detection = detectFrame(video, timestampMs);
          onFrameRef.current(detection);
        } catch (e) {
          console.error('frameLoop detection error', e);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    void initHandLandmarker().then(() => {
      if (!cancelled) rafRef.current = requestAnimationFrame(tick);
    }).catch((e) => console.error('initHandLandmarker failed', e));

    return (): void => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [video, enabled]);
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/vision/useWebcam.ts src/vision/useFrameLoop.ts
git commit -m "feat(vision): webcam hook + RAF frame loop with MediaPipe"
```

---

### Task 8: Canvas overlay for landmarks

**Files:**
- Create: `src/vision/LandmarkOverlay.tsx`
- Create: `src/vision/drawing.ts`

- [ ] **Step 1: Create `src/vision/drawing.ts`**

```ts
import type { FrameDetection } from '@/types/vision';

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

export function drawDetection(
  ctx: CanvasRenderingContext2D,
  detection: FrameDetection,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const hand of detection.hands) {
    const color = hand.handedness === 'Right' ? '#7cffb2' : '#7cb2ff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = color;

    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = hand.landmarks[a];
      const pb = hand.landmarks[b];
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.stroke();
    }
    for (const p of hand.landmarks) {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

- [ ] **Step 2: Create `src/vision/LandmarkOverlay.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { drawDetection } from './drawing';
import type { FrameDetection } from '@/types/vision';

export interface LandmarkOverlayProps {
  readonly width: number;
  readonly height: number;
  readonly detectionRef: React.RefObject<FrameDetection | null>;
}

export function LandmarkOverlay({ width, height, detectionRef }: LandmarkOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    let rafId = 0;
    const loop = (): void => {
      const detection = detectionRef.current;
      if (detection !== null) {
        drawDetection(ctx, detection, width, height);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return (): void => cancelAnimationFrame(rafId);
  }, [width, height, detectionRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
    />
  );
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/vision/LandmarkOverlay.tsx src/vision/drawing.ts
git commit -m "feat(vision): canvas overlay for hand landmarks"
```

---

## Phase 3 — Audio Engine

### Task 9: AudioEngine bootstrap + SubtractiveSynth

**Files:**
- Create: `src/audio/engine.ts`
- Create: `src/audio/modes/subtractive.ts`
- Test: `src/audio/modes/subtractive.test.ts`

- [ ] **Step 1: Install Tone.js**

```bash
npm install tone
```

- [ ] **Step 2: Write failing test for SubtractiveSynth**

Create `src/audio/modes/subtractive.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SubtractiveSynth } from './subtractive';

describe('SubtractiveSynth', () => {
  let synth: SubtractiveSynth;

  beforeEach(() => {
    synth = new SubtractiveSynth();
  });

  it('deve identificar-se como modo subtractive', () => {
    expect(synth.kind).toBe('subtractive');
  });

  it('deve aceitar setParam para cutoff sem lançar erro', () => {
    expect(() => synth.setParam('cutoff', 1000, 10)).not.toThrow();
  });

  it('deve aceitar setParam para resonance sem lançar erro', () => {
    expect(() => synth.setParam('resonance', 5, 10)).not.toThrow();
  });

  it('deve ignorar parâmetros desconhecidos silenciosamente', () => {
    expect(() => synth.setParam('inexistente', 1, 10)).not.toThrow();
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npm run test -- subtractive
```
Expected: FAIL (module not found).

- [ ] **Step 4: Create `src/audio/modes/subtractive.ts`**

```ts
import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';

export class SubtractiveSynth implements SynthMode {
  public readonly kind = 'subtractive' as const;
  private synth: Tone.MonoSynth;
  private filter: Tone.Filter;
  private out: Tone.Gain;

  constructor() {
    this.filter = new Tone.Filter({ type: 'lowpass', frequency: 1200, Q: 1 });
    this.out = new Tone.Gain(0.7);
    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.4 },
    });
    this.synth.chain(this.filter, this.out, Tone.getDestination());
  }

  async start(): Promise<void> {
    await Tone.start();
  }

  stop(): void {
    this.synth.triggerRelease();
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    switch (name) {
      case 'cutoff':
        this.filter.frequency.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'resonance':
        this.filter.Q.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'amplitude':
        this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      default:
        return;
    }
  }

  noteOn(midiNote: number, velocity: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.synth.triggerAttack(freq, Tone.now(), Math.max(0, Math.min(1, velocity)));
  }

  noteOff(_midiNote: number): void {
    this.synth.triggerRelease();
  }

  dispose(): void {
    this.synth.dispose();
    this.filter.dispose();
    this.out.dispose();
  }
}
```

- [ ] **Step 5: Mock Tone.js for tests**

Update `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('tone', () => {
  const param = { setTargetAtTime: vi.fn() };
  const ctor = (): unknown => ({
    chain: vi.fn(),
    connect: vi.fn(),
    dispose: vi.fn(),
    triggerAttack: vi.fn(),
    triggerRelease: vi.fn(),
    frequency: param,
    Q: param,
    gain: param,
  });
  return {
    start: vi.fn(async () => undefined),
    now: (): number => 0,
    getDestination: (): unknown => ({}),
    MonoSynth: vi.fn(ctor),
    Filter: vi.fn(ctor),
    Gain: vi.fn(ctor),
    FMSynth: vi.fn(ctor),
    PolySynth: vi.fn(ctor),
    Sampler: vi.fn(ctor),
    Frequency: (n: number) => ({ toFrequency: (): number => 440 * Math.pow(2, (n - 69) / 12) }),
  };
});
```

- [ ] **Step 6: Run test to confirm it passes**

```bash
npm run test -- subtractive
```
Expected: PASS (4 tests).

- [ ] **Step 7: Create `src/audio/engine.ts`**

```ts
import * as Tone from 'tone';
import type { AudioEngineStatus, SynthMode, SynthModeKind } from '@/types/audio';
import { SubtractiveSynth } from './modes/subtractive';

let currentMode: SynthMode | null = null;
let started = false;

export async function startAudio(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export async function setMode(kind: SynthModeKind): Promise<SynthMode> {
  if (currentMode !== null) {
    currentMode.stop();
    currentMode.dispose();
    currentMode = null;
  }
  switch (kind) {
    case 'subtractive':
      currentMode = new SubtractiveSynth();
      break;
    case 'fm':
    case 'sampler':
      throw new Error(`Mode "${kind}" not yet implemented`);
  }
  await currentMode.start();
  return currentMode;
}

export function getCurrentMode(): SynthMode | null {
  return currentMode;
}

export function getStatus(): AudioEngineStatus {
  return {
    running: started,
    contextState: started ? Tone.getContext().state : 'unloaded',
    currentMode: currentMode?.kind ?? null,
  };
}

export function disposeAudio(): void {
  if (currentMode !== null) {
    currentMode.dispose();
    currentMode = null;
  }
  started = false;
}
```

- [ ] **Step 8: Verify typecheck and full test suite**

```bash
npm run typecheck
npm run test
```
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(audio): engine bootstrap + SubtractiveSynth mode with tests"
```

---

### Task 10: FmSynth mode

**Files:**
- Create: `src/audio/modes/fm.ts`
- Test: `src/audio/modes/fm.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/audio/modes/fm.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FmSynth } from './fm';

describe('FmSynth', () => {
  let synth: FmSynth;
  beforeEach(() => { synth = new FmSynth(); });

  it('deve identificar-se como modo fm', () => {
    expect(synth.kind).toBe('fm');
  });

  it('deve aceitar setParam para modulationIndex sem lançar erro', () => {
    expect(() => synth.setParam('modulationIndex', 5, 10)).not.toThrow();
  });

  it('deve aceitar setParam para amplitude sem lançar erro', () => {
    expect(() => synth.setParam('amplitude', 0.5, 10)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- fm
```
Expected: FAIL.

- [ ] **Step 3: Create `src/audio/modes/fm.ts`**

```ts
import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';

export class FmSynth implements SynthMode {
  public readonly kind = 'fm' as const;
  private synth: Tone.FMSynth;
  private out: Tone.Gain;

  constructor() {
    this.out = new Tone.Gain(0.7);
    this.synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
    });
    this.synth.chain(this.out, Tone.getDestination());
  }

  async start(): Promise<void> {
    await Tone.start();
  }

  stop(): void {
    this.synth.triggerRelease();
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    switch (name) {
      case 'modulationIndex':
        this.synth.modulationIndex.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'amplitude':
        this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      default:
        return;
    }
  }

  noteOn(midiNote: number, velocity: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.synth.triggerAttack(freq, Tone.now(), Math.max(0, Math.min(1, velocity)));
  }

  noteOff(_midiNote: number): void {
    this.synth.triggerRelease();
  }

  dispose(): void {
    this.synth.dispose();
    this.out.dispose();
  }
}
```

- [ ] **Step 4: Extend the Tone mock for modulationIndex**

Update `tests/setup.ts` ctor inside `vi.mock('tone', ...)`. Replace the `ctor` with:

```ts
const ctor = (): unknown => ({
  chain: vi.fn(),
  connect: vi.fn(),
  dispose: vi.fn(),
  triggerAttack: vi.fn(),
  triggerRelease: vi.fn(),
  frequency: param,
  Q: param,
  gain: param,
  modulationIndex: param,
});
```

- [ ] **Step 5: Wire FmSynth into engine**

Edit `src/audio/engine.ts`, replacing the `setMode` switch:
```ts
import { FmSynth } from './modes/fm';
```
and replace the switch body:
```ts
switch (kind) {
  case 'subtractive':
    currentMode = new SubtractiveSynth();
    break;
  case 'fm':
    currentMode = new FmSynth();
    break;
  case 'sampler':
    throw new Error('Sampler mode not yet implemented');
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test
npm run typecheck
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(audio): FmSynth mode + engine integration"
```

---

### Task 11: SamplerSynth mode

**Files:**
- Create: `src/audio/modes/sampler.ts`
- Test: `src/audio/modes/sampler.test.ts`
- Create: `public/samples/README.md`

- [ ] **Step 1: Write failing test**

Create `src/audio/modes/sampler.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SamplerSynth } from './sampler';

describe('SamplerSynth', () => {
  let synth: SamplerSynth;
  beforeEach(() => { synth = new SamplerSynth(); });

  it('deve identificar-se como modo sampler', () => {
    expect(synth.kind).toBe('sampler');
  });

  it('deve aceitar amplitude sem erro', () => {
    expect(() => synth.setParam('amplitude', 0.5, 10)).not.toThrow();
  });

  it('deve aceitar noteOn sem erro', () => {
    expect(() => synth.noteOn(60, 0.8)).not.toThrow();
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- sampler
```
Expected: FAIL.

- [ ] **Step 3: Create `src/audio/modes/sampler.ts`**

```ts
import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';

const DEFAULT_SAMPLES: Readonly<Record<string, string>> = {
  C3: '/samples/piano/C3.mp3',
  C4: '/samples/piano/C4.mp3',
  C5: '/samples/piano/C5.mp3',
};

export class SamplerSynth implements SynthMode {
  public readonly kind = 'sampler' as const;
  private sampler: Tone.Sampler;
  private out: Tone.Gain;

  constructor() {
    this.out = new Tone.Gain(0.7);
    this.sampler = new Tone.Sampler({ urls: DEFAULT_SAMPLES, release: 0.6 });
    this.sampler.connect(this.out);
    this.out.connect(Tone.getDestination());
  }

  async start(): Promise<void> {
    await Tone.start();
    await Tone.loaded();
  }

  stop(): void {
    this.sampler.releaseAll();
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    if (name === 'amplitude') {
      this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
    }
  }

  noteOn(midiNote: number, velocity: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.sampler.triggerAttack(freq, Tone.now(), Math.max(0, Math.min(1, velocity)));
  }

  noteOff(midiNote: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.sampler.triggerRelease(freq, Tone.now());
  }

  dispose(): void {
    this.sampler.dispose();
    this.out.dispose();
  }
}
```

- [ ] **Step 4: Extend Tone mock**

Update `tests/setup.ts`, add to ctor object:
```ts
releaseAll: vi.fn(),
```
And add to the returned mock module object:
```ts
loaded: async (): Promise<void> => undefined,
```

- [ ] **Step 5: Wire into engine**

In `src/audio/engine.ts`:
```ts
import { SamplerSynth } from './modes/sampler';
```
Replace the switch:
```ts
switch (kind) {
  case 'subtractive': currentMode = new SubtractiveSynth(); break;
  case 'fm':          currentMode = new FmSynth();          break;
  case 'sampler':     currentMode = new SamplerSynth();     break;
}
```

- [ ] **Step 6: Create `public/samples/README.md`**

```markdown
# Samples

Place piano samples at:
- public/samples/piano/C3.mp3
- public/samples/piano/C4.mp3
- public/samples/piano/C5.mp3

Free samples are available from Salamander Grand Piano, freepats, or similar
royalty-free sources. App will work without these files (Tone.Sampler fails
silently on missing samples and produces no sound for sampler mode).
```

- [ ] **Step 7: Run tests**

```bash
npm run test
npm run typecheck
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(audio): SamplerSynth mode + engine integration"
```

---

## Phase 4 — Mapping & State

### Task 12: Pure mapping functions

**Files:**
- Create: `src/mapping/scales.ts`
- Create: `src/mapping/curves.ts`
- Test: `src/mapping/curves.test.ts`
- Test: `src/mapping/scales.test.ts`

- [ ] **Step 1: Write failing scale test**

Create `src/mapping/scales.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { quantizeToScale, MAJOR_SCALE } from './scales';

describe('quantizeToScale', () => {
  it('deve mapear 0 ao primeiro grau da escala', () => {
    expect(quantizeToScale(0, MAJOR_SCALE, 60)).toBe(60);
  });

  it('deve mapear valores intermediários ao grau correspondente', () => {
    expect(quantizeToScale(0.5, MAJOR_SCALE, 60)).toBeGreaterThan(60);
    expect(quantizeToScale(0.5, MAJOR_SCALE, 60)).toBeLessThan(72);
  });

  it('deve fazer clamp em 0 e 1', () => {
    expect(quantizeToScale(-1, MAJOR_SCALE, 60)).toBe(60);
    expect(quantizeToScale(2, MAJOR_SCALE, 60)).toBe(60 + MAJOR_SCALE[MAJOR_SCALE.length - 1]);
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- scales
```
Expected: FAIL.

- [ ] **Step 3: Create `src/mapping/scales.ts`**

```ts
export const MAJOR_SCALE: readonly number[] = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
export const MINOR_SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24];
export const PENTATONIC_SCALE: readonly number[] = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export function quantizeToScale(
  normalizedInput: number,
  scale: readonly number[],
  rootMidi: number,
): number {
  const clamped = Math.max(0, Math.min(1, normalizedInput));
  const index = Math.floor(clamped * scale.length);
  const safeIndex = Math.min(index, scale.length - 1);
  return rootMidi + scale[safeIndex];
}
```

- [ ] **Step 4: Write failing curves test**

Create `src/mapping/curves.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mapValue } from './curves';

describe('mapValue', () => {
  it('linear: mapeia centro corretamente', () => {
    expect(mapValue(0.5, 0, 1, 100, 200, 'linear')).toBe(150);
  });

  it('linear: faz clamp aos limites', () => {
    expect(mapValue(-1, 0, 1, 100, 200, 'linear')).toBe(100);
    expect(mapValue(2, 0, 1, 100, 200, 'linear')).toBe(200);
  });

  it('exponencial: cresce mais devagar no início', () => {
    const v25 = mapValue(0.25, 0, 1, 100, 1000, 'exponential');
    expect(v25).toBeLessThan(550);
    expect(v25).toBeGreaterThan(100);
  });

  it('quantizedScale: produz valores discretos', () => {
    const a = mapValue(0.3, 0, 1, 60, 84, 'quantizedScale');
    const b = mapValue(0.31, 0, 1, 60, 84, 'quantizedScale');
    expect(Number.isInteger(a)).toBe(true);
    expect(Number.isInteger(b)).toBe(true);
  });
});
```

- [ ] **Step 5: Confirm failure**

```bash
npm run test -- curves
```
Expected: FAIL.

- [ ] **Step 6: Create `src/mapping/curves.ts`**

```ts
import type { MappingCurve } from '@/types/gesture';
import { MAJOR_SCALE, quantizeToScale } from './scales';

function normalize(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0;
  return (value - inMin) / (inMax - inMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapValue(
  rawInput: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  curve: MappingCurve,
): number {
  const t = clamp(normalize(rawInput, inMin, inMax), 0, 1);
  switch (curve) {
    case 'linear':
      return outMin + t * (outMax - outMin);
    case 'exponential': {
      const expT = (Math.pow(2, t * 10) - 1) / (Math.pow(2, 10) - 1);
      return outMin + expT * (outMax - outMin);
    }
    case 'quantizedScale': {
      const rootMidi = Math.round(outMin);
      return quantizeToScale(t, MAJOR_SCALE, rootMidi);
    }
  }
}
```

- [ ] **Step 7: Run tests**

```bash
npm run test
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/mapping
git commit -m "feat(mapping): pure scale + curve transformations with tests"
```

---

### Task 13: GestureMapper bridge

**Files:**
- Create: `src/mapping/gestureMapper.ts`
- Test: `src/mapping/gestureMapper.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/mapping/gestureMapper.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { extractFeatures, applyBindings } from './gestureMapper';
import type { FrameDetection, DetectedHand, HandLandmarks } from '@/types/vision';
import type { GestureBinding } from '@/types/gesture';

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
    const mode = { kind: 'subtractive' as const, setParam, start: async () => undefined, stop: () => undefined, noteOn: () => undefined, noteOff: () => undefined, dispose: () => undefined };
    const bindings: GestureBinding[] = [{
      id: 't1', hand: 'Right', feature: 'positionX', target: 'cutoff', curve: 'linear',
      inputMin: 0, inputMax: 1, outputMin: 100, outputMax: 1000, smoothingMs: 10,
    }];
    const detection: FrameDetection = { hands: [makeHand('Right', 0.5, 0.0)], timestampMs: 0 };
    applyBindings(detection, bindings, mode);
    expect(setParam).toHaveBeenCalledWith('cutoff', expect.any(Number), 10);
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- gestureMapper
```
Expected: FAIL.

- [ ] **Step 3: Create `src/mapping/gestureMapper.ts`**

```ts
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
    out.push({
      hand: 'both',
      feature: 'handsDistance',
      value: handsDistance(detection.hands[0].landmarks, detection.hands[1].landmarks),
    });
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mapping/gestureMapper.ts src/mapping/gestureMapper.test.ts
git commit -m "feat(mapping): gesture feature extraction + binding application"
```

---

### Task 14: Zustand global store + Jotai parameter atoms

**Files:**
- Create: `src/state/synthStore.ts`
- Create: `src/state/paramAtoms.ts`

- [ ] **Step 1: Install state libs**

```bash
npm install zustand jotai
```

- [ ] **Step 2: Create `src/state/synthStore.ts`**

```ts
import { create } from 'zustand';
import type { SynthModeKind } from '@/types/audio';
import type { GestureBinding } from '@/types/gesture';
import { DEFAULT_GESTURE_BINDINGS } from '@/constants/mapping';

interface SynthStoreState {
  readonly mode: SynthModeKind;
  readonly bindings: readonly GestureBinding[];
  readonly audioStarted: boolean;
  setMode: (mode: SynthModeKind) => void;
  setBindings: (bindings: readonly GestureBinding[]) => void;
  setAudioStarted: (started: boolean) => void;
}

export const useSynthStore = create<SynthStoreState>((set) => ({
  mode: 'subtractive',
  bindings: DEFAULT_GESTURE_BINDINGS,
  audioStarted: false,
  setMode: (mode): void => set({ mode }),
  setBindings: (bindings): void => set({ bindings }),
  setAudioStarted: (audioStarted): void => set({ audioStarted }),
}));
```

- [ ] **Step 3: Create `src/state/paramAtoms.ts`**

```ts
import { atom, type WritableAtom } from 'jotai';
import type { GestureTargetParam } from '@/types/gesture';

type ParamAtom = WritableAtom<number, [number], void>;

function makeParamAtom(initial: number): ParamAtom {
  return atom(initial) as ParamAtom;
}

export const paramAtoms: Readonly<Record<GestureTargetParam, ParamAtom>> = {
  pitch: makeParamAtom(60),
  amplitude: makeParamAtom(0.5),
  cutoff: makeParamAtom(1200),
  resonance: makeParamAtom(1),
  lfoDepth: makeParamAtom(0),
  modulationIndex: makeParamAtom(5),
  sustain: makeParamAtom(0),
};
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(state): Zustand store + Jotai parameter atoms"
```

---

## Phase 5 — UI Composition

### Task 15: Knob component

**Files:**
- Create: `src/ui/components/Knob.tsx`
- Create: `src/ui/components/Knob.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/ui/components/Knob.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Knob } from './Knob';

describe('Knob', () => {
  it('renderiza com label e valor formatado', () => {
    render(<Knob label="Cutoff" value={1200} min={200} max={8000} unit="Hz" />);
    expect(screen.getByText('Cutoff')).toBeInTheDocument();
    expect(screen.getByText(/1200\s?Hz/)).toBeInTheDocument();
  });

  it('faz clamp do valor exibido aos limites', () => {
    render(<Knob label="X" value={9000} min={200} max={8000} unit="Hz" />);
    expect(screen.getByText(/8000\s?Hz/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- Knob
```
Expected: FAIL.

- [ ] **Step 3: Create `src/ui/components/Knob.tsx`**

```tsx
import { cn } from '@/lib/cn';

export interface KnobProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly unit?: string;
  readonly className?: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function Knob({ label, value, min, max, unit, className }: KnobProps): JSX.Element {
  const clamped = clamp(value, min, max);
  const normalized = (clamped - min) / (max - min);
  const angle = -135 + normalized * 270;
  const displayValue = unit !== undefined ? `${Math.round(clamped)} ${unit}` : Math.round(clamped).toString();

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={26} fill="#1b1f27" stroke="#2a2f3a" strokeWidth={2} />
        <line
          x1={32} y1={32}
          x2={32 + 22 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={32 + 22 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke="#7cffb2" strokeWidth={3} strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-zinc-300">{label}</span>
      <span className="text-[10px] text-zinc-500 tabular-nums">{displayValue}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- Knob
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/Knob.tsx src/ui/components/Knob.test.tsx
git commit -m "feat(ui): Knob display component"
```

---

### Task 16: Mode selector

**Files:**
- Create: `src/ui/components/ModeSelector.tsx`

- [ ] **Step 1: Install Radix Toggle Group**

```bash
npm install @radix-ui/react-toggle-group
```

- [ ] **Step 2: Create `src/ui/components/ModeSelector.tsx`**

```tsx
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';
import type { SynthModeKind } from '@/types/audio';

const MODES: ReadonlyArray<{ readonly value: SynthModeKind; readonly label: string }> = [
  { value: 'subtractive', label: 'Subtrativo' },
  { value: 'fm', label: 'FM' },
  { value: 'sampler', label: 'Sampler' },
];

export interface ModeSelectorProps {
  readonly value: SynthModeKind;
  readonly onChange: (mode: SynthModeKind) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps): JSX.Element {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v): void => {
        if (v === 'subtractive' || v === 'fm' || v === 'sampler') onChange(v);
      }}
      className="inline-flex rounded-md border border-zinc-700 overflow-hidden"
    >
      {MODES.map((m) => (
        <ToggleGroup.Item
          key={m.value}
          value={m.value}
          className={cn(
            'px-3 py-1.5 text-xs',
            'data-[state=on]:bg-accent data-[state=on]:text-black',
            'data-[state=off]:bg-zinc-900 data-[state=off]:text-zinc-300',
          )}
        >
          {m.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(ui): ModeSelector component with Radix ToggleGroup"
```

---

### Task 17: Audio visualizer (oscilloscope)

**Files:**
- Create: `src/ui/components/Visualizer.tsx`

- [ ] **Step 1: Create `src/ui/components/Visualizer.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export interface VisualizerProps {
  readonly width: number;
  readonly height: number;
}

export function Visualizer({ width, height }: VisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const analyser = new Tone.Analyser('waveform', 512);
    Tone.getDestination().connect(analyser);

    let rafId = 0;
    const draw = (): void => {
      const data = analyser.getValue() as Float32Array;
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#7cffb2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = width / data.length;
      for (let i = 0; i < data.length; i += 1) {
        const v = data[i];
        const x = i * step;
        const y = height / 2 + v * height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return (): void => {
      cancelAnimationFrame(rafId);
      analyser.dispose();
    };
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded border border-zinc-800" />;
}
```

- [ ] **Step 2: Add Analyser to Tone mock**

Update `tests/setup.ts` inside the mocked module export object:
```ts
Analyser: vi.fn(() => ({
  getValue: (): Float32Array => new Float32Array(512),
  dispose: vi.fn(),
})),
```

- [ ] **Step 3: Verify typecheck and tests**

```bash
npm run typecheck
npm run test
```
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(ui): waveform visualizer"
```

---

### Task 18: Compose Main page

**Files:**
- Modify: `src/App.tsx`
- Create: `src/ui/pages/MainPage.tsx`

- [ ] **Step 1: Create `src/ui/pages/MainPage.tsx`**

```tsx
import { useCallback, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useSynthStore } from '@/state/synthStore';
import { paramAtoms } from '@/state/paramAtoms';
import { useWebcam } from '@/vision/useWebcam';
import { useFrameLoop } from '@/vision/useFrameLoop';
import { LandmarkOverlay } from '@/vision/LandmarkOverlay';
import { Visualizer } from '@/ui/components/Visualizer';
import { Knob } from '@/ui/components/Knob';
import { ModeSelector } from '@/ui/components/ModeSelector';
import { getCurrentMode, setMode, startAudio } from '@/audio/engine';
import { applyBindings } from '@/mapping/gestureMapper';
import type { FrameDetection } from '@/types/vision';

const VIDEO_W = 640;
const VIDEO_H = 480;

export function MainPage(): JSX.Element {
  const { videoRef, status, error, start } = useWebcam();
  const { mode, bindings, audioStarted, setMode: setModeStore, setAudioStarted } = useSynthStore();
  const detectionRef = useRef<FrameDetection | null>(null);

  const cutoff = useAtomValue(paramAtoms.cutoff);
  const resonance = useAtomValue(paramAtoms.resonance);
  const amplitude = useAtomValue(paramAtoms.amplitude);

  const [bootstrapping, setBootstrapping] = useState(false);

  const handleStart = useCallback(async (): Promise<void> => {
    setBootstrapping(true);
    try {
      await startAudio();
      await setMode(mode);
      await start();
      setAudioStarted(true);
    } catch (e) {
      console.error('start failed', e);
    } finally {
      setBootstrapping(false);
    }
  }, [mode, start, setAudioStarted]);

  const handleModeChange = useCallback(async (next: typeof mode): Promise<void> => {
    setModeStore(next);
    if (audioStarted) await setMode(next);
  }, [audioStarted, setModeStore]);

  useFrameLoop({
    video: videoRef.current,
    enabled: status === 'ready',
    onFrame: (detection): void => {
      detectionRef.current = detection;
      const m = getCurrentMode();
      if (m !== null) applyBindings(detection, bindings, m);
    },
  });

  return (
    <main className="min-h-screen p-6 grid grid-cols-[auto_1fr] gap-6">
      <section className="relative" style={{ width: VIDEO_W, height: VIDEO_H }}>
        <video
          ref={videoRef}
          width={VIDEO_W}
          height={VIDEO_H}
          playsInline
          muted
          className="rounded border border-zinc-800 bg-zinc-950 transform -scale-x-100"
        />
        <LandmarkOverlay width={VIDEO_W} height={VIDEO_H} detectionRef={detectionRef} />
        {status !== 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 rounded">
            {status === 'error' ? (
              <p className="text-red-400 text-sm max-w-xs text-center px-4">{error}</p>
            ) : (
              <button
                onClick={(): void => { void handleStart(); }}
                disabled={bootstrapping}
                className="px-4 py-2 rounded bg-accent text-black text-sm font-medium disabled:opacity-50"
              >
                {bootstrapping ? 'Iniciando…' : 'Iniciar áudio e câmera'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-medium">SintetizAI</h1>
          <ModeSelector value={mode} onChange={(m): void => { void handleModeChange(m); }} />
        </header>

        <div className="grid grid-cols-3 gap-3 p-3 rounded border border-zinc-800 bg-panel">
          <Knob label="Cutoff" value={cutoff} min={200} max={8000} unit="Hz" />
          <Knob label="Reson." value={resonance} min={0.5} max={20} />
          <Knob label="Amp" value={amplitude * 100} min={0} max={100} unit="%" />
        </div>

        <Visualizer width={640} height={120} />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { MainPage } from '@/ui/pages/MainPage';

export default function App(): JSX.Element {
  return <MainPage />;
}
```

- [ ] **Step 3: Verify typecheck and dev server**

```bash
npm run typecheck
npm run dev
```
Expected: typecheck passes. Manually verify in browser that page renders with Start button (you may not have hand_landmarker.task yet — that's expected; UI should still render).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/ui/pages/MainPage.tsx
git commit -m "feat(ui): compose MainPage wiring vision + audio + UI"
```

---

### Task 19: Throttled parameter atom updates

**Files:**
- Modify: `src/ui/pages/MainPage.tsx`
- Create: `src/state/paramThrottle.ts`

- [ ] **Step 1: Create `src/state/paramThrottle.ts`**

```ts
import { getDefaultStore } from 'jotai';
import { paramAtoms } from './paramAtoms';
import type { GestureTargetParam } from '@/types/gesture';

const UPDATE_INTERVAL_MS = 60;
const lastUpdate = new Map<GestureTargetParam, number>();
const pendingValue = new Map<GestureTargetParam, number>();

export function publishParam(target: GestureTargetParam, value: number, nowMs: number): void {
  pendingValue.set(target, value);
  const last = lastUpdate.get(target) ?? 0;
  if (nowMs - last >= UPDATE_INTERVAL_MS) {
    lastUpdate.set(target, nowMs);
    const atom = paramAtoms[target];
    getDefaultStore().set(atom, value);
  }
}
```

- [ ] **Step 2: Wire throttle into gesture application**

Modify `src/mapping/gestureMapper.ts`. Add at top:
```ts
import { publishParam } from '@/state/paramThrottle';
```

Replace the `applyBindings` function body so it also publishes to atoms:
```ts
export function applyBindings(
  detection: FrameDetection,
  bindings: readonly GestureBinding[],
  mode: SynthMode,
): void {
  const features = extractFeatures(detection);
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
```

- [ ] **Step 3: Update existing test**

Existing `src/mapping/gestureMapper.test.ts` test still passes since `publishParam` is called as a side effect; jotai default store accepts the write in a JSDOM environment. Run tests:

```bash
npm run test
```
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(state): throttled parameter atom publication at 60ms"
```

---

## Phase 6 — Persistence

### Task 20: Dexie database + Zod schema

**Files:**
- Create: `src/persistence/db.ts`
- Create: `src/persistence/presetSchema.ts`
- Create: `src/persistence/presetRepo.ts`
- Test: `src/persistence/presetRepo.test.ts`

- [ ] **Step 1: Install deps**

```bash
npm install dexie zod
npm install -D fake-indexeddb
```

- [ ] **Step 2: Add fake-indexeddb to test setup**

Edit `tests/setup.ts`, add at top:
```ts
import 'fake-indexeddb/auto';
```

- [ ] **Step 3: Create `src/persistence/presetSchema.ts`**

```ts
import { z } from 'zod';

export const GestureBindingSchema = z.object({
  id: z.string().min(1),
  hand: z.enum(['Left', 'Right', 'both']),
  feature: z.enum(['positionX', 'positionY', 'pinchDistance', 'palmOpenness', 'handsDistance', 'fistDetected']),
  target: z.enum(['pitch', 'amplitude', 'cutoff', 'resonance', 'lfoDepth', 'modulationIndex', 'sustain']),
  curve: z.enum(['linear', 'exponential', 'quantizedScale']),
  inputMin: z.number(),
  inputMax: z.number(),
  outputMin: z.number(),
  outputMax: z.number(),
  smoothingMs: z.number().min(1).max(500),
});

export const PresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  mode: z.enum(['subtractive', 'fm', 'sampler']),
  synthParams: z.record(z.string(), z.number()),
  gestureBindings: z.array(GestureBindingSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ParsedPreset = z.infer<typeof PresetSchema>;
```

- [ ] **Step 4: Create `src/persistence/db.ts`**

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { Preset } from '@/types/preset';

class SintetizDB extends Dexie {
  presets!: EntityTable<Preset, 'id'>;

  constructor() {
    super('sintetizai');
    this.version(1).stores({ presets: 'id, name, mode, updatedAt' });
  }
}

export const db = new SintetizDB();
```

- [ ] **Step 5: Write failing test**

Create `src/persistence/presetRepo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { savePreset, listPresets, deletePreset, loadPreset } from './presetRepo';
import { db } from './db';
import type { Preset } from '@/types/preset';

const VALID_PRESET: Preset = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test',
  mode: 'subtractive',
  synthParams: { cutoff: 1200 },
  gestureBindings: [],
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
};

describe('presetRepo', () => {
  beforeEach(async () => {
    await db.presets.clear();
  });

  it('salva e recupera um preset por id', async () => {
    await savePreset(VALID_PRESET);
    const loaded = await loadPreset(VALID_PRESET.id);
    expect(loaded?.name).toBe('Test');
  });

  it('lista presets', async () => {
    await savePreset(VALID_PRESET);
    const all = await listPresets();
    expect(all).toHaveLength(1);
  });

  it('rejeita preset inválido (sem name)', async () => {
    const invalid = { ...VALID_PRESET, name: '' };
    await expect(savePreset(invalid)).rejects.toThrow();
  });

  it('remove preset por id', async () => {
    await savePreset(VALID_PRESET);
    await deletePreset(VALID_PRESET.id);
    const loaded = await loadPreset(VALID_PRESET.id);
    expect(loaded).toBeUndefined();
  });
});
```

- [ ] **Step 6: Confirm failure**

```bash
npm run test -- presetRepo
```
Expected: FAIL (module missing).

- [ ] **Step 7: Create `src/persistence/presetRepo.ts`**

```ts
import { db } from './db';
import { PresetSchema } from './presetSchema';
import type { Preset } from '@/types/preset';

export async function savePreset(preset: Preset): Promise<void> {
  const validated = PresetSchema.parse(preset);
  await db.presets.put(validated);
}

export async function loadPreset(id: string): Promise<Preset | undefined> {
  return db.presets.get(id);
}

export async function listPresets(): Promise<readonly Preset[]> {
  return db.presets.orderBy('updatedAt').reverse().toArray();
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}
```

- [ ] **Step 8: Run tests**

```bash
npm run test
```
Expected: passes.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(persistence): Dexie preset repository with Zod validation"
```

---

### Task 21: Preset UI panel

**Files:**
- Create: `src/ui/components/PresetPanel.tsx`
- Modify: `src/ui/pages/MainPage.tsx`

- [ ] **Step 1: Create `src/ui/components/PresetPanel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useSynthStore } from '@/state/synthStore';
import { deletePreset, listPresets, savePreset } from '@/persistence/presetRepo';
import type { Preset } from '@/types/preset';

function uuid(): string {
  return crypto.randomUUID();
}

export function PresetPanel(): JSX.Element {
  const { mode, bindings, setBindings, setMode } = useSynthStore();
  const [name, setName] = useState('Meu preset');
  const [presets, setPresets] = useState<readonly Preset[]>([]);

  const refresh = async (): Promise<void> => {
    setPresets(await listPresets());
  };

  useEffect(() => { void refresh(); }, []);

  const handleSave = async (): Promise<void> => {
    const now = new Date().toISOString();
    const preset: Preset = {
      id: uuid(),
      name: name.trim().length > 0 ? name : 'Sem nome',
      mode,
      synthParams: {},
      gestureBindings: bindings,
      createdAt: now,
      updatedAt: now,
    };
    await savePreset(preset);
    await refresh();
  };

  const handleLoad = (preset: Preset): void => {
    setMode(preset.mode);
    setBindings(preset.gestureBindings);
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deletePreset(id);
    await refresh();
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded border border-zinc-800 bg-panel">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e): void => setName(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
          placeholder="Nome do preset"
        />
        <button
          onClick={(): void => { void handleSave(); }}
          className="px-3 py-1 rounded bg-accent text-black text-xs font-medium"
        >
          Salvar
        </button>
      </div>
      <ul className="flex flex-col gap-1 max-h-40 overflow-auto">
        {presets.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <button
              onClick={(): void => handleLoad(p)}
              className="flex-1 text-left text-zinc-300 hover:text-accent truncate"
            >
              {p.name} <span className="text-zinc-600">[{p.mode}]</span>
            </button>
            <button
              onClick={(): void => { void handleDelete(p.id); }}
              className="text-zinc-500 hover:text-red-400 px-2"
              aria-label="Apagar preset"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Add to MainPage**

In `src/ui/pages/MainPage.tsx`, add import:
```tsx
import { PresetPanel } from '@/ui/components/PresetPanel';
```

Inside the right-side `<section>`, after the `<Visualizer />`, add:
```tsx
<PresetPanel />
```

- [ ] **Step 3: Verify typecheck and dev server**

```bash
npm run typecheck
npm run dev
```
Expected: passes. Manually verify in browser the preset panel renders and saves/lists items.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(ui): preset panel for save/load/delete via IndexedDB"
```

---

## Phase 7 — End-to-End & Polish

### Task 22: Playwright smoke test with mocked webcam

**Files:**
- Create: `e2e/boot.spec.ts`
- Create: `e2e/fixtures/fake-video.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `e2e/fixtures/fake-video.ts`**

```ts
export const FAKE_GET_USER_MEDIA = `
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext('2d');
  setInterval(() => {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#7cffb2';
    ctx.fillRect(Math.random()*600, Math.random()*440, 40, 40);
  }, 33);
  const stream = canvas.captureStream(30);
  navigator.mediaDevices.getUserMedia = async () => stream;
})();
`;
```

- [ ] **Step 3: Create `e2e/boot.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { FAKE_GET_USER_MEDIA } from './fixtures/fake-video';

test('boot: renderiza UI e botão de iniciar', async ({ page, context }) => {
  await context.grantPermissions(['camera']);
  await page.addInitScript(FAKE_GET_USER_MEDIA);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SintetizAI' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Iniciar áudio e câmera/i })).toBeVisible();
});

test('seleção de modo: clica em FM e atualiza estado', async ({ page, context }) => {
  await context.grantPermissions(['camera']);
  await page.addInitScript(FAKE_GET_USER_MEDIA);
  await page.goto('/');
  await page.getByRole('button', { name: 'FM' }).click();
  await expect(page.getByRole('button', { name: 'FM' })).toHaveAttribute('data-state', 'on');
});
```

- [ ] **Step 4: Run E2E**

```bash
npm run test:e2e
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "test(e2e): smoke tests with mocked webcam"
```

---

### Task 23: README + final verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# SintetizAI

Sintetizador musical web controlado por gestos das mãos via webcam. 3 modos de síntese
(subtrativo, FM, sampler), mapeamento gestual configurável e presets locais.

## Requisitos

- Node 20+
- Chrome/Edge/Firefox recente com WebGL e AudioWorklet
- Webcam

## Setup

```bash
npm install
```

Baixe o modelo MediaPipe (instruções em `public/models/README.md`) e os samples opcionais
(instruções em `public/samples/README.md`).

## Comandos

```bash
npm run dev         # servidor de desenvolvimento
npm run typecheck   # verifica tipos
npm run lint        # verifica estilo
npm run test        # testes unitários (Vitest)
npm run test:e2e    # testes end-to-end (Playwright)
npm run build       # build de produção
```

## Arquitetura

Documentação completa em `docs/superpowers/specs/2026-05-23-sintetizai-design.md`.

Princípio crítico: dados de alta frequência (gestos a 60 FPS, áudio) nunca atravessam o
reconciler do React. Vivem em `useRef` e `AudioParam.setTargetAtTime`. A UI React recebe
apenas snapshots throttled (60ms) via Jotai atoms.
```

- [ ] **Step 2: Run full verification suite**

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
Expected: all pass with no errors.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: project README with setup and architecture notes"
```

- [ ] **Step 4: Final manual smoke test**

```bash
npm run dev
```
Open http://localhost:5173 in browser, click "Iniciar áudio e câmera", verify:
1. Camera permission prompt appears
2. Video feed shows with mirrored display
3. Landmarks overlay (green/blue dots) appears on detected hands
4. Switching modes works without errors in console
5. Knobs update as hands move
6. Visualizer shows waveform
7. Save preset → reload page → preset still listed → load preset restores state

Stop dev server. If anything fails, file follow-up issues; do not mark plan complete.

- [ ] **Step 5: Tag MVP release**

```bash
git tag -a v0.1.0-mvp -m "MVP: vision + 3 synth modes + preset persistence"
```

---

## Completion criteria

- [ ] All 23 tasks committed
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (Vitest, all suites)
- [ ] `npm run test:e2e` passes (Playwright)
- [ ] `npm run build` produces a working production bundle
- [ ] Manual smoke test (Task 23 Step 4) succeeds in Chrome
- [ ] Bundle size of `dist/` (excluding models) ≤ 600 KB gzip

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('tone', () => {
  const param = { setTargetAtTime: vi.fn(), value: 0 };
  function MockNode(this: object): void {
    Object.assign(this, {
      chain: vi.fn(),
      connect: vi.fn(),
      toDestination: vi.fn(function (this: object) { return this; }),
      dispose: vi.fn(),
      triggerAttack: vi.fn(),
      triggerRelease: vi.fn(),
      releaseAll: vi.fn(),
      start: vi.fn(function (this: object) { return this; }),
      stop: vi.fn(function (this: object) { return this; }),
      state: 'stopped',
      loaded: true,
      playbackRate: 1,
      loopStart: 0,
      loopEnd: 0,
      fadeIn: 0,
      fadeOut: 0,
      buffer: { get: (): undefined => undefined },
      volume: { value: 0 },
      frequency: param,
      Q: param,
      gain: param,
      wet: param,
      feedback: param,
      modulationIndex: param,
      distortion: 0,
      type: 'lowpass',
      min: 0,
      max: 0,
    });
  }
  return {
    start: vi.fn(async () => undefined),
    now: (): number => 0,
    getDestination: (): unknown => ({}),
    getContext: (): { state: string } => ({ state: 'running' }),
    loaded: async (): Promise<void> => undefined,
    gainToDb: (v: number): number => 20 * Math.log10(Math.max(v, 1e-6)),
    MonoSynth: MockNode,
    Filter: MockNode,
    Gain: MockNode,
    FMSynth: MockNode,
    PolySynth: MockNode,
    Sampler: MockNode,
    Player: MockNode,
    LFO: MockNode,
    Distortion: MockNode,
    Chorus: MockNode,
    FeedbackDelay: MockNode,
    Reverb: MockNode,
    Analyser: vi.fn(() => ({
      getValue: (): Float32Array => new Float32Array(512),
      dispose: vi.fn(),
    })),
    Frequency: (n: number): { toFrequency: () => number } => ({
      toFrequency: (): number => 440 * Math.pow(2, (n - 69) / 12),
    }),
  };
});

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('tone', () => {
  const param = { setTargetAtTime: vi.fn() };
  function MockNode(this: object): void {
    Object.assign(this, {
      chain: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn(),
      triggerAttack: vi.fn(),
      triggerRelease: vi.fn(),
      releaseAll: vi.fn(),
      frequency: param,
      Q: param,
      gain: param,
      modulationIndex: param,
    });
  }
  return {
    start: vi.fn(async () => undefined),
    now: (): number => 0,
    getDestination: (): unknown => ({}),
    getContext: (): { state: string } => ({ state: 'running' }),
    loaded: async (): Promise<void> => undefined,
    MonoSynth: MockNode,
    Filter: MockNode,
    Gain: MockNode,
    FMSynth: MockNode,
    PolySynth: MockNode,
    Sampler: MockNode,
    Frequency: (n: number): { toFrequency: () => number } => ({
      toFrequency: (): number => 440 * Math.pow(2, (n - 69) / 12),
    }),
  };
});

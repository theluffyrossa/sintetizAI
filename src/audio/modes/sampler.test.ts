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

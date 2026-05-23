import { describe, it, expect, beforeEach } from 'vitest';
import { SamplerSynth } from './sampler';

describe('SamplerSynth (sampler backend)', () => {
  let synth: SamplerSynth;
  beforeEach(() => {
    synth = new SamplerSynth({ C3: '/x.mp3', C4: '/y.mp3' });
  });

  it('deve identificar-se como modo sampler', () => {
    expect(synth.kind).toBe('sampler');
  });

  it('deve aceitar amplitude sem erro', () => {
    expect(() => synth.setParam('amplitude', 0.5, 10)).not.toThrow();
  });

  it('deve aceitar noteOn sem erro', () => {
    expect(() => synth.noteOn(60, 0.8)).not.toThrow();
  });

  it('deve aceitar setParam para pitch sem lançar erro', () => {
    expect(() => synth.setParam('pitch', 60, 10)).not.toThrow();
  });
});

describe('SamplerSynth (looper backend via default pack)', () => {
  let synth: SamplerSynth;
  beforeEach(() => { synth = new SamplerSynth(); });

  it('deve aceitar noteOn / noteOff sem erro em pack com loop', () => {
    expect(() => synth.noteOn(60, 0.8)).not.toThrow();
    expect(() => synth.noteOff(60)).not.toThrow();
  });

  it('deve aceitar pitch sem erro em pack com loop', () => {
    synth.noteOn(60, 0.8);
    expect(() => synth.setParam('pitch', 67, 10)).not.toThrow();
  });

  it('stop deve poder ser chamado sem erro mesmo sem noteOn', () => {
    expect(() => synth.stop()).not.toThrow();
  });
});

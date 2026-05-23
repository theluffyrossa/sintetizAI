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

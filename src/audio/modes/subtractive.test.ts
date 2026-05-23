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

  it('deve aceitar setParam para pitch sem lançar erro', () => {
    expect(() => synth.setParam('pitch', 60, 10)).not.toThrow();
  });

  it('deve ignorar parâmetros desconhecidos silenciosamente', () => {
    expect(() => synth.setParam('inexistente', 1, 10)).not.toThrow();
  });
});

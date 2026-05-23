import { describe, it, expect, beforeEach } from 'vitest';
import { FxChain } from './fxChain';

describe('FxChain', () => {
  let fx: FxChain;

  beforeEach(() => {
    fx = new FxChain();
  });

  it('deve expor um nó de entrada para encadeamento', () => {
    expect(fx.input).toBeDefined();
  });

  it('deve aceitar setParam para cutoff sem erro', () => {
    expect(() => fx.setParam('cutoff', 1500, 10)).not.toThrow();
  });

  it('deve aceitar setParam para resonance sem erro', () => {
    expect(() => fx.setParam('resonance', 4, 10)).not.toThrow();
  });

  it('deve aceitar setParam para lfoRate sem erro', () => {
    expect(() => fx.setParam('lfoRate', 3, 10)).not.toThrow();
  });

  it('deve aceitar setParam para lfoDepth sem erro', () => {
    expect(() => fx.setParam('lfoDepth', 0.5, 10)).not.toThrow();
  });

  it('deve aceitar setParam para drive sem erro', () => {
    expect(() => fx.setParam('drive', 0.6, 10)).not.toThrow();
  });

  it('deve aceitar setParam para delayMix sem erro', () => {
    expect(() => fx.setParam('delayMix', 0.4, 10)).not.toThrow();
  });

  it('deve aceitar setParam para reverbMix sem erro', () => {
    expect(() => fx.setParam('reverbMix', 0.5, 10)).not.toThrow();
  });

  it('deve aceitar setParam para chorusMix sem erro', () => {
    expect(() => fx.setParam('chorusMix', 0.7, 10)).not.toThrow();
  });

  it('deve permitir trocar o tipo do filtro', () => {
    expect(() => fx.setFilterType('highpass')).not.toThrow();
    expect(() => fx.setFilterType('bandpass')).not.toThrow();
  });

  it('deve ignorar parâmetros desconhecidos silenciosamente', () => {
    expect(() => fx.setParam('inexistente', 1, 10)).not.toThrow();
  });

  it('deve poder ser disposed sem erro', () => {
    expect(() => fx.dispose()).not.toThrow();
  });
});

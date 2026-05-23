import { describe, it, expect } from 'vitest';
import { quantizeToScale, MAJOR_SCALE } from './scales';

describe('quantizeToScale', () => {
  it('deve mapear 0 ao primeiro grau da escala', () => {
    expect(quantizeToScale(0, MAJOR_SCALE, 60)).toBe(60);
  });

  it('deve mapear valores intermediários ao grau correspondente', () => {
    expect(quantizeToScale(0.5, MAJOR_SCALE, 60)).toBeGreaterThan(60);
    expect(quantizeToScale(0.5, MAJOR_SCALE, 60)).toBeLessThanOrEqual(72);
  });

  it('deve fazer clamp em 0 e 1', () => {
    expect(quantizeToScale(-1, MAJOR_SCALE, 60)).toBe(60);
    const last = MAJOR_SCALE[MAJOR_SCALE.length - 1];
    expect(last).toBeDefined();
    expect(quantizeToScale(2, MAJOR_SCALE, 60)).toBe(60 + (last as number));
  });
});

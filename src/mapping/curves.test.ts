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

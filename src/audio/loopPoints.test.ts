import { describe, it, expect } from 'vitest';
import { detectLoopPoints, type BufferLike } from './loopPoints';

function makeBuffer(samples: readonly number[], sampleRate: number = 1000): BufferLike {
  const data = new Float32Array(samples);
  return {
    duration: samples.length / sampleRate,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: (): Float32Array => data,
  };
}

describe('detectLoopPoints', () => {
  it('apara silêncio no início', () => {
    const buf = makeBuffer([0, 0, 0, 0, 0.5, 0.5, 0.5], 1000);
    const points = detectLoopPoints(buf, 0.01);
    expect(points.start).toBeCloseTo(4 / 1000);
  });

  it('apara decay no final', () => {
    const buf = makeBuffer([0.5, 0.5, 0.5, 0.001, 0.0001, 0], 1000);
    const points = detectLoopPoints(buf, 0.01);
    expect(points.end).toBeCloseTo(3 / 1000);
  });

  it('retorna buffer inteiro se totalmente silencioso', () => {
    const buf = makeBuffer([0, 0, 0, 0], 1000);
    const points = detectLoopPoints(buf, 0.01);
    expect(points.start).toBe(0);
    expect(points.end).toBeCloseTo(buf.duration);
  });

  it('considera o pico entre canais', () => {
    const left = new Float32Array([0, 0, 0.5, 0]);
    const right = new Float32Array([0.5, 0, 0, 0]);
    const buf: BufferLike = {
      duration: 4 / 1000,
      sampleRate: 1000,
      numberOfChannels: 2,
      getChannelData: (c: number): Float32Array => (c === 0 ? left : right),
    };
    const points = detectLoopPoints(buf, 0.01);
    expect(points.start).toBeCloseTo(0);
    expect(points.end).toBeCloseTo(3 / 1000);
  });
});

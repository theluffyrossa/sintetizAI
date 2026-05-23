import { describe, it, expect } from 'vitest';
import { pinchDistance, positionXY, palmOpenness, handsDistance } from './features';
import type { HandLandmarks } from '@/types/vision';

function makeLandmarks(positions: ReadonlyArray<readonly [number, number, number]>): HandLandmarks {
  const points = positions.map(([x, y, z]) => ({ x, y, z }));
  return points as unknown as HandLandmarks;
}

const ZEROS: ReadonlyArray<readonly [number, number, number]> = Array.from(
  { length: 21 },
  () => [0, 0, 0] as readonly [number, number, number],
);

describe('pinchDistance', () => {
  it('deve calcular distância euclidiana entre polegar (4) e indicador (8)', () => {
    const positions = [...ZEROS];
    positions[4] = [0, 0, 0];
    positions[8] = [0.3, 0.4, 0];
    const hand = makeLandmarks(positions);
    expect(pinchDistance(hand)).toBeCloseTo(0.5, 5);
  });
});

describe('positionXY', () => {
  it('deve retornar coordenadas X/Y do wrist (landmark 0)', () => {
    const positions = [...ZEROS];
    positions[0] = [0.42, 0.73, 0];
    const hand = makeLandmarks(positions);
    expect(positionXY(hand)).toEqual({ x: 0.42, y: 0.73 });
  });
});

describe('palmOpenness', () => {
  it('deve aumentar quando dedos estão estendidos para longe do wrist', () => {
    const closed = makeLandmarks(ZEROS);
    const positions = [...ZEROS];
    positions[8] = [0, 1, 0];
    positions[12] = [0, 1, 0];
    positions[16] = [0, 1, 0];
    positions[20] = [0, 1, 0];
    const open = makeLandmarks(positions);
    expect(palmOpenness(open)).toBeGreaterThan(palmOpenness(closed));
  });
});

describe('handsDistance', () => {
  it('deve retornar distância entre wrists das duas mãos', () => {
    const aPositions = [...ZEROS];
    aPositions[0] = [0, 0, 0];
    const a = makeLandmarks(aPositions);
    const bPositions = [...ZEROS];
    bPositions[0] = [1, 0, 0];
    const b = makeLandmarks(bPositions);
    expect(handsDistance(a, b)).toBeCloseTo(1, 5);
  });
});

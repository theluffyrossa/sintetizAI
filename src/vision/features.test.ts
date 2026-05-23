import { describe, it, expect } from 'vitest';
import {
  pinchDistance,
  positionXY,
  palmOpenness,
  handsDistance,
  handTilt,
  handVelocity,
  handDepth,
  middlePinch,
  fingerSpread,
} from './features';
import type { HandLandmarks, Landmark3D } from '@/types/vision';

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

describe('handTilt', () => {
  it('deve retornar ~0 quando mão está vertical (middleMcp acima do wrist)', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.8, 0];
    positions[9] = [0.5, 0.3, 0];
    const hand = makeLandmarks(positions);
    expect(handTilt(hand)).toBeCloseTo(0, 5);
  });

  it('deve retornar próximo de +1 quando mão tomba para a direita', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0];
    positions[9] = [0.9, 0.5, 0];
    const hand = makeLandmarks(positions);
    expect(handTilt(hand)).toBeCloseTo(1, 5);
  });

  it('deve retornar próximo de -1 quando mão tomba para a esquerda', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0];
    positions[9] = [0.1, 0.5, 0];
    const hand = makeLandmarks(positions);
    expect(handTilt(hand)).toBeCloseTo(-1, 5);
  });

  it('deve fazer clamp em [-1, 1]', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0];
    positions[9] = [0.5, 0.9, 0];
    const hand = makeLandmarks(positions);
    const value = handTilt(hand);
    expect(value).toBeLessThanOrEqual(1);
    expect(value).toBeGreaterThanOrEqual(-1);
  });
});

describe('handVelocity', () => {
  it('deve retornar 0 quando não há frame anterior', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0];
    const hand = makeLandmarks(positions);
    expect(handVelocity(hand, undefined, 16)).toBe(0);
  });

  it('deve calcular velocidade normalizada para deslocamento conhecido', () => {
    const positions = [...ZEROS];
    positions[0] = [0.3, 0.5, 0];
    const hand = makeLandmarks(positions);
    const prev: Landmark3D = { x: 0, y: 0.5, z: 0 };
    const value = handVelocity(hand, prev, 100);
    expect(value).toBeCloseTo(3.0 / 3.0, 5);
  });

  it('deve fazer clamp em 1 para movimento extremo', () => {
    const positions = [...ZEROS];
    positions[0] = [1.0, 0.5, 0];
    const hand = makeLandmarks(positions);
    const prev: Landmark3D = { x: 0, y: 0.5, z: 0 };
    expect(handVelocity(hand, prev, 10)).toBe(1);
  });
});

describe('handDepth', () => {
  it('deve retornar 0.5 quando wrist.z = 0', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0];
    const hand = makeLandmarks(positions);
    expect(handDepth(hand)).toBeCloseTo(0.5, 5);
  });

  it('deve retornar próximo de 1 quando mão está perto da câmera (z muito negativo)', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, -0.15];
    const hand = makeLandmarks(positions);
    expect(handDepth(hand)).toBeCloseTo(1, 5);
  });

  it('deve retornar próximo de 0 quando mão está longe da câmera (z muito positivo)', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, 0.15];
    const hand = makeLandmarks(positions);
    expect(handDepth(hand)).toBeCloseTo(0, 5);
  });

  it('deve fazer clamp em [0, 1]', () => {
    const positions = [...ZEROS];
    positions[0] = [0.5, 0.5, -1.0];
    const hand = makeLandmarks(positions);
    expect(handDepth(hand)).toBe(1);
  });
});

describe('middlePinch', () => {
  it('deve calcular distância entre polegar (4) e médio (12)', () => {
    const positions = [...ZEROS];
    positions[4] = [0, 0, 0];
    positions[12] = [0.6, 0.8, 0];
    const hand = makeLandmarks(positions);
    expect(middlePinch(hand)).toBeCloseTo(1.0, 5);
  });
});

describe('fingerSpread', () => {
  it('deve retornar próximo de 0 quando dedos estão colados', () => {
    const positions = [...ZEROS];
    positions[8] = [0.5, 0.3, 0];
    positions[12] = [0.5, 0.3, 0];
    positions[16] = [0.5, 0.3, 0];
    positions[20] = [0.5, 0.3, 0];
    const hand = makeLandmarks(positions);
    expect(fingerSpread(hand)).toBeCloseTo(0, 5);
  });

  it('deve retornar valor maior quando dedos se espalham em leque', () => {
    const closed = [...ZEROS];
    closed[8] = [0.5, 0.3, 0];
    closed[12] = [0.5, 0.3, 0];
    closed[16] = [0.5, 0.3, 0];
    closed[20] = [0.5, 0.3, 0];
    const open = [...ZEROS];
    open[8] = [0.3, 0.3, 0];
    open[12] = [0.45, 0.3, 0];
    open[16] = [0.6, 0.3, 0];
    open[20] = [0.75, 0.3, 0];
    expect(fingerSpread(makeLandmarks(open))).toBeGreaterThan(fingerSpread(makeLandmarks(closed)));
  });

  it('deve fazer clamp em 1 para espalhamento extremo', () => {
    const positions = [...ZEROS];
    positions[8] = [0, 0.3, 0];
    positions[12] = [0.5, 0.3, 0];
    positions[16] = [1.0, 0.3, 0];
    positions[20] = [1.5, 0.3, 0];
    const hand = makeLandmarks(positions);
    expect(fingerSpread(hand)).toBe(1);
  });
});

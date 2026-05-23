import { getDefaultStore } from 'jotai';
import { paramAtoms } from './paramAtoms';
import type { GestureTargetParam } from '@/types/gesture';

const UPDATE_INTERVAL_MS = 60;
const lastUpdate = new Map<GestureTargetParam, number>();

export function publishParam(target: GestureTargetParam, value: number, nowMs: number): void {
  const last = lastUpdate.get(target) ?? 0;
  if (nowMs - last >= UPDATE_INTERVAL_MS) {
    lastUpdate.set(target, nowMs);
    const atom = paramAtoms[target];
    getDefaultStore().set(atom, value);
  }
}

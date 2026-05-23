import { atom, type WritableAtom } from 'jotai';
import type { GestureTargetParam } from '@/types/gesture';

type ParamAtom = WritableAtom<number, [number], void>;

function makeParamAtom(initial: number): ParamAtom {
  return atom(initial) as ParamAtom;
}

export const paramAtoms: Readonly<Record<GestureTargetParam, ParamAtom>> = {
  pitch: makeParamAtom(60),
  amplitude: makeParamAtom(0.5),
  cutoff: makeParamAtom(1200),
  resonance: makeParamAtom(1),
  lfoDepth: makeParamAtom(0),
  modulationIndex: makeParamAtom(5),
  sustain: makeParamAtom(0),
};

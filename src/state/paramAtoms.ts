import { atom, type WritableAtom } from 'jotai';
import type { GestureTargetParam } from '@/types/gesture';
import {
  CHORUS_MIX_DEFAULT,
  DELAY_MIX_DEFAULT,
  DRIVE_DEFAULT,
  FILTER_DEFAULT_CUTOFF_HZ,
  FILTER_DEFAULT_RESONANCE,
  LFO_DEFAULT_DEPTH,
  LFO_DEFAULT_RATE_HZ,
  REVERB_MIX_DEFAULT,
} from '@/constants/audio';

type ParamAtom = WritableAtom<number, [number], void>;

function makeParamAtom(initial: number): ParamAtom {
  return atom(initial) as ParamAtom;
}

export const paramAtoms: Readonly<Record<GestureTargetParam, ParamAtom>> = {
  pitch: makeParamAtom(60),
  amplitude: makeParamAtom(0.5),
  cutoff: makeParamAtom(FILTER_DEFAULT_CUTOFF_HZ),
  resonance: makeParamAtom(FILTER_DEFAULT_RESONANCE),
  lfoRate: makeParamAtom(LFO_DEFAULT_RATE_HZ),
  lfoDepth: makeParamAtom(LFO_DEFAULT_DEPTH),
  drive: makeParamAtom(DRIVE_DEFAULT),
  delayMix: makeParamAtom(DELAY_MIX_DEFAULT),
  reverbMix: makeParamAtom(REVERB_MIX_DEFAULT),
  chorusMix: makeParamAtom(CHORUS_MIX_DEFAULT),
  modulationIndex: makeParamAtom(5),
  sustain: makeParamAtom(0),
};

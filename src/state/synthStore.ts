import { create } from 'zustand';
import type { SynthModeKind } from '@/types/audio';
import type { GestureBinding } from '@/types/gesture';
import { DEFAULT_GESTURE_BINDINGS } from '@/constants/mapping';
import { DEFAULT_SAMPLE_PACK_ID } from '@/constants/samplePacks';

interface SynthStoreState {
  readonly mode: SynthModeKind;
  readonly bindings: readonly GestureBinding[];
  readonly audioStarted: boolean;
  readonly samplePackId: string;
  setMode: (mode: SynthModeKind) => void;
  setBindings: (bindings: readonly GestureBinding[]) => void;
  setAudioStarted: (started: boolean) => void;
  setSamplePackId: (id: string) => void;
}

export const useSynthStore = create<SynthStoreState>((set) => ({
  mode: 'subtractive',
  bindings: DEFAULT_GESTURE_BINDINGS,
  audioStarted: false,
  samplePackId: DEFAULT_SAMPLE_PACK_ID,
  setMode: (mode): void => set({ mode }),
  setBindings: (bindings): void => set({ bindings }),
  setAudioStarted: (audioStarted): void => set({ audioStarted }),
  setSamplePackId: (samplePackId): void => set({ samplePackId }),
}));

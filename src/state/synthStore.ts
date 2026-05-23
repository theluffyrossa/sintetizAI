import { create } from 'zustand';
import type { SynthModeKind } from '@/types/audio';
import type { GestureBinding } from '@/types/gesture';
import { DEFAULT_GESTURE_BINDINGS } from '@/constants/mapping';

interface SynthStoreState {
  readonly mode: SynthModeKind;
  readonly bindings: readonly GestureBinding[];
  readonly audioStarted: boolean;
  setMode: (mode: SynthModeKind) => void;
  setBindings: (bindings: readonly GestureBinding[]) => void;
  setAudioStarted: (started: boolean) => void;
}

export const useSynthStore = create<SynthStoreState>((set) => ({
  mode: 'subtractive',
  bindings: DEFAULT_GESTURE_BINDINGS,
  audioStarted: false,
  setMode: (mode): void => set({ mode }),
  setBindings: (bindings): void => set({ bindings }),
  setAudioStarted: (audioStarted): void => set({ audioStarted }),
}));

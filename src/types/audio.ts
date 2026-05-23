export type SynthModeKind = 'subtractive' | 'fm' | 'sampler';

export interface SynthMode {
  readonly kind: SynthModeKind;
  start(): Promise<void>;
  stop(): void;
  setParam(name: string, value: number, smoothingMs: number): void;
  noteOn(midiNote: number, velocity: number): void;
  noteOff(midiNote: number): void;
  dispose(): void;
}

export interface AudioEngineStatus {
  readonly running: boolean;
  readonly contextState: AudioContextState | 'unloaded';
  readonly currentMode: SynthModeKind | null;
}

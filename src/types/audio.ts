export type SynthModeKind = 'subtractive' | 'fm' | 'sampler';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';

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

export interface SamplePack {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly urls: Readonly<Record<string, string>>;
  readonly loop?: boolean;
  readonly baseMidi?: number;
  readonly loopStart?: number;
  readonly loopEnd?: number;
  readonly playbackRateScale?: number;
}

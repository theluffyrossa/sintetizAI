export const AUDIO_BUFFER_SIZE = 128;
export const DEFAULT_SMOOTHING_MS = 12;
export const PITCH_MIN_MIDI = 48;
export const PITCH_MAX_MIDI = 84;
export const CUTOFF_MIN_HZ = 200;
export const CUTOFF_MAX_HZ = 8000;
export const RESONANCE_MIN = 0.5;
export const RESONANCE_MAX = 20;
export const AMPLITUDE_MIN = 0.15;
export const AMPLITUDE_MAX = 1;
export const DEFAULT_BASE_MIDI = 60;
export const SAMPLER_RELEASE_S = 0.6;
export const LOOP_SILENCE_THRESHOLD = 0.003;
export const LOOP_FADE_S = 0.008;

export const FILTER_DEFAULT_TYPE = 'lowpass' as const;
export const FILTER_DEFAULT_CUTOFF_HZ = 1200;
export const FILTER_DEFAULT_RESONANCE = 1;
export const FILTER_ROLLOFF_DB = -24;

export const LFO_RATE_MIN_HZ = 0.05;
export const LFO_RATE_MAX_HZ = 12;
export const LFO_DEFAULT_RATE_HZ = 2;
export const LFO_DEPTH_MIN = 0;
export const LFO_DEPTH_MAX = 1;
export const LFO_DEFAULT_DEPTH = 0;
export const LFO_CUTOFF_OCTAVE_RANGE = 4;

export const DRIVE_MIN = 0;
export const DRIVE_MAX = 1;
export const DRIVE_DEFAULT = 0;

export const DELAY_TIME_S = 0.32;
export const DELAY_FEEDBACK_DEFAULT = 0.35;
export const DELAY_MIX_DEFAULT = 0;

export const REVERB_DECAY_S = 1.6;
export const REVERB_PREDELAY_S = 0.02;
export const REVERB_MIX_DEFAULT = 0.08;
export const REVERB_MIX_MAX = 0.4;

export const CHORUS_FREQUENCY_HZ = 1.5;
export const CHORUS_DEPTH = 0.7;
export const CHORUS_DELAY_TIME_MS = 3.5;
export const CHORUS_MIX_DEFAULT = 0;

export const FX_MIX_MIN = 0;
export const FX_MIX_MAX = 1;

export const MODULATION_INDEX_MIN = 0;
export const MODULATION_INDEX_MAX = 10;
export const SUSTAIN_MIN = 0;
export const SUSTAIN_MAX = 1;

export const DRUM_LOOP_URL = '/samples/drum/tech-house-drums-man_120bpm.wav';
export const DRUM_LOOP_DEFAULT_VOLUME_DB = -8;

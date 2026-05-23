import type { SamplePack } from '@/types/audio';

export const SAMPLE_PACKS: readonly SamplePack[] = [
  {
    id: 'filtered-gate-d-major',
    label: 'Filtered Gate Synth (D maior)',
    description: 'Loop de acordes synth filtrados, 84 BPM, Ré maior',
    urls: {
      D4: '/samples/sampleo/filtered-gate-synth-chords_84bpm_D_major.wav',
    },
    baseMidi: 62,
    playbackRateScale: 0.75,
  },
  {
    id: 'sloppy-future-rave-e-minor',
    label: 'Sloppy Future Rave Lead (E menor)',
    description: 'Loop de lead future rave, 124 BPM, Mi menor',
    urls: {
      E4: '/samples/sampleo/sloppy-future-rave-lead-loop_124bpm_E_minor.wav',
    },
    baseMidi: 64,
    playbackRateScale: 0.75,
  },
];

export const DEFAULT_SAMPLE_PACK_ID = 'filtered-gate-d-major';

export function findSamplePack(id: string): SamplePack | undefined {
  return SAMPLE_PACKS.find((p) => p.id === id);
}

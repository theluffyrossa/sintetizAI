import * as Tone from 'tone';
import type { FilterType } from '@/types/audio';
import {
  CHORUS_DELAY_TIME_MS,
  CHORUS_DEPTH,
  CHORUS_FREQUENCY_HZ,
  CHORUS_MIX_DEFAULT,
  DELAY_FEEDBACK_DEFAULT,
  DELAY_MIX_DEFAULT,
  DELAY_TIME_S,
  DRIVE_DEFAULT,
  FILTER_DEFAULT_CUTOFF_HZ,
  FILTER_DEFAULT_RESONANCE,
  FILTER_DEFAULT_TYPE,
  FILTER_ROLLOFF_DB,
  LFO_CUTOFF_OCTAVE_RANGE,
  LFO_DEFAULT_DEPTH,
  LFO_DEFAULT_RATE_HZ,
  REVERB_DECAY_S,
  REVERB_MIX_DEFAULT,
  REVERB_PREDELAY_S,
} from '@/constants/audio';

export class FxChain {
  public readonly input: Tone.ToneAudioNode;

  private filter: Tone.Filter;
  private lfo: Tone.LFO;
  private drive: Tone.Distortion;
  private chorus: Tone.Chorus;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;

  private baseCutoff: number = FILTER_DEFAULT_CUTOFF_HZ;
  private lfoDepth: number = LFO_DEFAULT_DEPTH;

  constructor() {
    this.filter = new Tone.Filter({
      type: FILTER_DEFAULT_TYPE,
      frequency: FILTER_DEFAULT_CUTOFF_HZ,
      Q: FILTER_DEFAULT_RESONANCE,
      rolloff: FILTER_ROLLOFF_DB,
    });

    this.lfo = new Tone.LFO({
      frequency: LFO_DEFAULT_RATE_HZ,
      min: FILTER_DEFAULT_CUTOFF_HZ,
      max: FILTER_DEFAULT_CUTOFF_HZ,
      type: 'sine',
    });
    this.lfo.connect(this.filter.frequency);
    this.lfo.start();

    this.drive = new Tone.Distortion({ distortion: DRIVE_DEFAULT, wet: DRIVE_DEFAULT, oversample: '2x' });
    this.chorus = new Tone.Chorus({
      frequency: CHORUS_FREQUENCY_HZ,
      delayTime: CHORUS_DELAY_TIME_MS,
      depth: CHORUS_DEPTH,
      wet: CHORUS_MIX_DEFAULT,
    }).start();

    this.delay = new Tone.FeedbackDelay({
      delayTime: DELAY_TIME_S,
      feedback: DELAY_FEEDBACK_DEFAULT,
      wet: DELAY_MIX_DEFAULT,
    });

    this.reverb = new Tone.Reverb({
      decay: REVERB_DECAY_S,
      preDelay: REVERB_PREDELAY_S,
      wet: REVERB_MIX_DEFAULT,
    });

    this.filter.chain(this.drive, this.chorus, this.delay, this.reverb, Tone.getDestination());
    this.input = this.filter;
  }

  setFilterType(type: FilterType): void {
    this.filter.type = type;
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const ramp = Math.max(smoothingMs, 1) / 1000;
    const now = Tone.now();
    switch (name) {
      case 'cutoff':
        this.baseCutoff = value;
        this.updateLfoRange(ramp, now);
        return;
      case 'resonance':
        this.filter.Q.setTargetAtTime(value, now, ramp);
        return;
      case 'lfoRate':
        this.lfo.frequency.setTargetAtTime(value, now, ramp);
        return;
      case 'lfoDepth':
        this.lfoDepth = clamp01(value);
        this.updateLfoRange(ramp, now);
        return;
      case 'drive':
        this.drive.wet.setTargetAtTime(clamp01(value), now, ramp);
        this.drive.distortion = clamp01(value);
        return;
      case 'delayMix':
        this.delay.wet.setTargetAtTime(clamp01(value), now, ramp);
        return;
      case 'delayFeedback':
        this.delay.feedback.setTargetAtTime(clamp01(value), now, ramp);
        return;
      case 'reverbMix':
        this.reverb.wet.setTargetAtTime(clamp01(value), now, ramp);
        return;
      case 'chorusMix':
        this.chorus.wet.setTargetAtTime(clamp01(value), now, ramp);
        return;
      default:
        return;
    }
  }

  private updateLfoRange(ramp: number, now: number): void {
    const factor = Math.pow(2, LFO_CUTOFF_OCTAVE_RANGE * this.lfoDepth);
    const min = this.baseCutoff / factor;
    const max = this.baseCutoff * factor;
    if (this.lfoDepth <= 0) {
      this.filter.frequency.setTargetAtTime(this.baseCutoff, now, ramp);
      this.lfo.min = this.baseCutoff;
      this.lfo.max = this.baseCutoff;
      return;
    }
    this.lfo.min = min;
    this.lfo.max = max;
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.dispose();
    this.filter.dispose();
    this.drive.dispose();
    this.chorus.dispose();
    this.delay.dispose();
    this.reverb.dispose();
  }
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

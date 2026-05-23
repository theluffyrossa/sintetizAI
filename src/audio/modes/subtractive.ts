import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';

export class SubtractiveSynth implements SynthMode {
  public readonly kind = 'subtractive' as const;
  private synth: Tone.MonoSynth;
  private filter: Tone.Filter;
  private out: Tone.Gain;

  constructor() {
    this.filter = new Tone.Filter({ type: 'lowpass', frequency: 1200, Q: 1 });
    this.out = new Tone.Gain(0.7);
    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.4 },
    });
    this.synth.chain(this.filter, this.out, Tone.getDestination());
  }

  async start(): Promise<void> {
    await Tone.start();
  }

  stop(): void {
    this.synth.triggerRelease();
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    switch (name) {
      case 'cutoff':
        this.filter.frequency.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'resonance':
        this.filter.Q.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'amplitude':
        this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      default:
        return;
    }
  }

  noteOn(midiNote: number, velocity: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.synth.triggerAttack(freq, Tone.now(), Math.max(0, Math.min(1, velocity)));
  }

  noteOff(_midiNote: number): void {
    this.synth.triggerRelease();
  }

  dispose(): void {
    this.synth.dispose();
    this.filter.dispose();
    this.out.dispose();
  }
}

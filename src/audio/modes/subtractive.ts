import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';
import { FxChain } from '@/audio/fxChain';

export class SubtractiveSynth implements SynthMode {
  public readonly kind = 'subtractive' as const;
  private synth: Tone.MonoSynth;
  private out: Tone.Gain;
  private fx: FxChain;

  constructor() {
    this.out = new Tone.Gain(0.7);
    this.fx = new FxChain();
    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.4 },
    });
    this.synth.chain(this.out, this.fx.input);
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
      case 'amplitude':
        this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
        return;
      case 'pitch': {
        const freq = Tone.Frequency(value, 'midi').toFrequency();
        this.synth.frequency.setTargetAtTime(freq, Tone.now(), rampSeconds);
        return;
      }
      default:
        this.fx.setParam(name, value, smoothingMs);
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
    this.out.dispose();
    this.fx.dispose();
  }
}

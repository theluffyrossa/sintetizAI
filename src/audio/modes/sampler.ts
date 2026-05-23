import * as Tone from 'tone';
import type { SynthMode } from '@/types/audio';

const DEFAULT_SAMPLES: Readonly<Record<string, string>> = {
  C3: '/samples/piano/C3.mp3',
  C4: '/samples/piano/C4.mp3',
  C5: '/samples/piano/C5.mp3',
};

export class SamplerSynth implements SynthMode {
  public readonly kind = 'sampler' as const;
  private sampler: Tone.Sampler;
  private out: Tone.Gain;

  constructor() {
    this.out = new Tone.Gain(0.7);
    this.sampler = new Tone.Sampler({ urls: DEFAULT_SAMPLES, release: 0.6 });
    this.sampler.connect(this.out);
    this.out.connect(Tone.getDestination());
  }

  async start(): Promise<void> {
    await Tone.start();
    await Tone.loaded();
  }

  stop(): void {
    this.sampler.releaseAll();
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    if (name === 'amplitude') {
      this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
    }
  }

  noteOn(midiNote: number, velocity: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.sampler.triggerAttack(freq, Tone.now(), Math.max(0, Math.min(1, velocity)));
  }

  noteOff(midiNote: number): void {
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.sampler.triggerRelease(freq, Tone.now());
  }

  dispose(): void {
    this.sampler.dispose();
    this.out.dispose();
  }
}

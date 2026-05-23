import * as Tone from 'tone';
import type { SamplePack, SynthMode } from '@/types/audio';
import { DEFAULT_SAMPLE_PACK_ID, findSamplePack } from '@/constants/samplePacks';
import { DEFAULT_BASE_MIDI, LOOP_FADE_S, SAMPLER_RELEASE_S } from '@/constants/audio';
import { FxChain } from '@/audio/fxChain';
import { detectLoopPoints } from '@/audio/loopPoints';

type Backend =
  | { readonly kind: 'sampler'; readonly node: Tone.Sampler }
  | { kind: 'looper'; readonly node: Tone.Player; readonly baseMidi: number; readonly rateScale: number; ready: boolean; pendingPlay: boolean };

function resolvePack(urls: Readonly<Record<string, string>> | undefined): SamplePack {
  if (urls === undefined) {
    const pack = findSamplePack(DEFAULT_SAMPLE_PACK_ID);
    if (pack === undefined) {
      throw new Error(`Default sample pack "${DEFAULT_SAMPLE_PACK_ID}" não encontrado em SAMPLE_PACKS`);
    }
    return pack;
  }
  return {
    id: 'inline',
    label: 'inline',
    description: 'inline',
    urls,
  };
}

function pickLoopUrl(urls: Readonly<Record<string, string>>): string {
  const first = Object.values(urls)[0];
  if (first === undefined) throw new Error('Sample pack em loop precisa de pelo menos uma URL');
  return first;
}

function applyLoopPoints(player: Tone.Player, pack: SamplePack): void {
  const audioBuffer = player.buffer.get();
  if (audioBuffer === undefined) return;
  const detected = detectLoopPoints(audioBuffer);
  const start = pack.loopStart ?? detected.start;
  const end = pack.loopEnd ?? detected.end;
  if (end <= start) return;
  player.loopStart = start;
  player.loopEnd = end;
}

export class SamplerSynth implements SynthMode {
  public readonly kind = 'sampler' as const;
  private backend: Backend;
  private out: Tone.Gain;
  private fx: FxChain;
  private activeMidi: number | null = null;
  private lastVelocity = 0.8;

  constructor(urls?: Readonly<Record<string, string>>) {
    this.out = new Tone.Gain(0.7);
    this.fx = new FxChain();
    const pack = resolvePack(urls);
    if (pack.loop !== false) {
      const backend: Backend = {
        kind: 'looper',
        node: undefined as unknown as Tone.Player,
        baseMidi: pack.baseMidi ?? DEFAULT_BASE_MIDI,
        rateScale: pack.playbackRateScale ?? 1,
        ready: false,
        pendingPlay: false,
      };
      const player = new Tone.Player({
        url: pickLoopUrl(pack.urls),
        loop: true,
        autostart: false,
        fadeIn: LOOP_FADE_S,
        fadeOut: LOOP_FADE_S,
        onload: (): void => {
          applyLoopPoints(backend.node, pack);
          backend.ready = true;
          if (backend.pendingPlay && backend.node.state !== 'started') {
            backend.node.start();
            backend.pendingPlay = false;
          }
        },
        onerror: (err: Error): void => {
          console.error('SamplerSynth: falha ao carregar sample', err);
        },
      });
      player.connect(this.out);
      Object.assign(backend, { node: player });
      this.backend = backend;
    } else {
      const sampler = new Tone.Sampler({ urls: pack.urls, release: SAMPLER_RELEASE_S });
      sampler.connect(this.out);
      this.backend = { kind: 'sampler', node: sampler };
    }
    this.out.connect(this.fx.input);
  }

  async start(): Promise<void> {
    await Tone.start();
    await Tone.loaded();
    if (this.backend.kind === 'looper' && this.backend.node.loaded) {
      this.backend.ready = true;
    }
  }

  stop(): void {
    if (this.backend.kind === 'looper') {
      this.backend.pendingPlay = false;
      this.backend.node.stop();
    } else {
      this.backend.node.releaseAll();
    }
    this.activeMidi = null;
  }

  setParam(name: string, value: number, smoothingMs: number): void {
    const rampSeconds = Math.max(smoothingMs, 1) / 1000;
    if (name === 'amplitude') {
      this.out.gain.setTargetAtTime(value, Tone.now(), rampSeconds);
      return;
    }
    if (name === 'pitch') {
      const targetMidi = Math.round(value);
      if (this.activeMidi === null || targetMidi === this.activeMidi) return;
      if (this.backend.kind === 'looper') {
        const semitones = targetMidi - this.backend.baseMidi;
        this.backend.node.playbackRate = Math.pow(2, semitones / 12) * this.backend.rateScale;
        this.activeMidi = targetMidi;
        return;
      }
      const prevFreq = Tone.Frequency(this.activeMidi, 'midi').toFrequency();
      this.backend.node.triggerRelease(prevFreq, Tone.now());
      const nextFreq = Tone.Frequency(targetMidi, 'midi').toFrequency();
      this.backend.node.triggerAttack(nextFreq, Tone.now(), this.lastVelocity);
      this.activeMidi = targetMidi;
      return;
    }
    this.fx.setParam(name, value, smoothingMs);
  }

  noteOn(midiNote: number, velocity: number): void {
    const clampedVel = Math.max(0, Math.min(1, velocity));
    if (this.backend.kind === 'looper') {
      const semitones = midiNote - this.backend.baseMidi;
      this.backend.node.playbackRate = Math.pow(2, semitones / 12) * this.backend.rateScale;
      this.backend.node.volume.value = Tone.gainToDb(clampedVel);
      if (this.backend.ready || this.backend.node.loaded) {
        this.backend.ready = true;
        if (this.backend.node.state !== 'started') {
          this.backend.node.start();
        }
      } else {
        this.backend.pendingPlay = true;
      }
    } else {
      const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
      this.backend.node.triggerAttack(freq, Tone.now(), clampedVel);
    }
    this.activeMidi = midiNote;
    this.lastVelocity = clampedVel;
  }

  noteOff(midiNote: number): void {
    if (this.backend.kind === 'looper') {
      this.backend.pendingPlay = false;
      if (this.backend.node.state === 'started') this.backend.node.stop();
    } else {
      const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
      this.backend.node.triggerRelease(freq, Tone.now());
    }
    this.activeMidi = null;
  }

  dispose(): void {
    this.backend.node.dispose();
    this.out.dispose();
    this.fx.dispose();
  }
}

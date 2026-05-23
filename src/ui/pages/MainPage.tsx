import { useCallback, useRef, useState, type JSX } from 'react';
import { useAtomValue } from 'jotai';
import { useSynthStore } from '@/state/synthStore';
import { paramAtoms } from '@/state/paramAtoms';
import { useWebcam } from '@/vision/useWebcam';
import { useFrameLoop } from '@/vision/useFrameLoop';
import { LandmarkOverlay } from '@/vision/LandmarkOverlay';
import { Visualizer } from '@/ui/components/Visualizer';
import { Knob } from '@/ui/components/Knob';
import { ModeSelector } from '@/ui/components/ModeSelector';
import { SamplePackPicker } from '@/ui/components/SamplePackPicker';
import { PresetPanel } from '@/ui/components/PresetPanel';
import { getCurrentMode, setMode, startAudio } from '@/audio/engine';
import { startDrumLoop, stopDrumLoop } from '@/audio/drumLoop';
import { applyBindings } from '@/mapping/gestureMapper';
import type { FrameDetection } from '@/types/vision';
import type { SynthModeKind } from '@/types/audio';
import {
  CUTOFF_MAX_HZ,
  CUTOFF_MIN_HZ,
  RESONANCE_MAX,
  RESONANCE_MIN,
} from '@/constants/audio';

const VIDEO_W = 640;
const VIDEO_H = 480;
const SUSTAIN_MIDI_NOTE = 60;
const SUSTAIN_VELOCITY = 0.8;

export function MainPage(): JSX.Element {
  const { videoRef, status, error, start } = useWebcam();
  const mode = useSynthStore((s) => s.mode);
  const bindings = useSynthStore((s) => s.bindings);
  const audioStarted = useSynthStore((s) => s.audioStarted);
  const samplePackId = useSynthStore((s) => s.samplePackId);
  const setModeStore = useSynthStore((s) => s.setMode);
  const setAudioStarted = useSynthStore((s) => s.setAudioStarted);
  const setSamplePackId = useSynthStore((s) => s.setSamplePackId);
  const detectionRef = useRef<FrameDetection | null>(null);
  const sustainedRef = useRef<boolean>(false);

  const cutoff = useAtomValue(paramAtoms.cutoff);
  const resonance = useAtomValue(paramAtoms.resonance);
  const amplitude = useAtomValue(paramAtoms.amplitude);
  const lfoRate = useAtomValue(paramAtoms.lfoRate);
  const lfoDepth = useAtomValue(paramAtoms.lfoDepth);
  const drive = useAtomValue(paramAtoms.drive);
  const delayMix = useAtomValue(paramAtoms.delayMix);
  const reverbMix = useAtomValue(paramAtoms.reverbMix);
  const chorusMix = useAtomValue(paramAtoms.chorusMix);

  const [bootstrapping, setBootstrapping] = useState(false);
  const [drumPlaying, setDrumPlaying] = useState(false);
  const [drumLoading, setDrumLoading] = useState(false);

  const [startError, setStartError] = useState<string | null>(null);

  const handleToggleDrum = useCallback(async (): Promise<void> => {
    if (drumPlaying) {
      stopDrumLoop();
      setDrumPlaying(false);
      return;
    }
    setDrumLoading(true);
    try {
      await startAudio();
      await startDrumLoop();
      setDrumPlaying(true);
    } catch (e) {
      console.error('Falha ao iniciar bateria', e);
    } finally {
      setDrumLoading(false);
    }
  }, [drumPlaying]);

  const handleStart = useCallback(async (): Promise<void> => {
    setBootstrapping(true);
    setStartError(null);
    try {
      await start();
      await startAudio();
      await setMode(mode, { samplePackId });
      setAudioStarted(true);
    } catch (e) {
      console.error('handleStart failed', e);
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setStartError(msg);
    } finally {
      setBootstrapping(false);
    }
  }, [mode, samplePackId, start, setAudioStarted]);

  const handleModeChange = useCallback(async (next: SynthModeKind): Promise<void> => {
    setModeStore(next);
    if (audioStarted) {
      sustainedRef.current = false;
      try {
        await setMode(next, { samplePackId });
      } catch (e) {
        console.error('Falha ao trocar de modo', e);
      }
    }
  }, [audioStarted, setModeStore, samplePackId]);

  const handleSamplePackChange = useCallback(async (id: string): Promise<void> => {
    setSamplePackId(id);
    if (audioStarted && mode === 'sampler') {
      sustainedRef.current = false;
      try {
        await setMode('sampler', { samplePackId: id });
      } catch (e) {
        console.error('Falha ao trocar de sample pack', e);
      }
    }
  }, [audioStarted, mode, setSamplePackId]);

  useFrameLoop({
    videoRef,
    enabled: status === 'ready',
    onFrame: (detection): void => {
      detectionRef.current = detection;
      const m = getCurrentMode();
      if (m === null) return;
      const handsPresent = detection.hands.length > 0;
      if (handsPresent && !sustainedRef.current) {
        m.noteOn(SUSTAIN_MIDI_NOTE, SUSTAIN_VELOCITY);
        sustainedRef.current = true;
      } else if (!handsPresent && sustainedRef.current) {
        m.noteOff(SUSTAIN_MIDI_NOTE);
        sustainedRef.current = false;
      }
      applyBindings(detection, bindings, m);
    },
  });

  return (
    <main className="min-h-screen p-6 grid grid-cols-[auto_1fr] gap-6">
      <section className="relative" style={{ width: VIDEO_W, height: VIDEO_H }}>
        <video
          ref={videoRef}
          width={VIDEO_W}
          height={VIDEO_H}
          playsInline
          muted
          className="rounded border border-zinc-800 bg-zinc-950 transform -scale-x-100"
        />
        <LandmarkOverlay width={VIDEO_W} height={VIDEO_H} detectionRef={detectionRef} />
        {status !== 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 rounded gap-3 p-4">
            <button
              onClick={(): void => { void handleStart(); }}
              disabled={bootstrapping}
              className="px-4 py-2 rounded bg-accent text-black text-sm font-medium disabled:opacity-50"
            >
              {bootstrapping ? 'Iniciando…' : 'Iniciar áudio e câmera'}
            </button>
            {(status === 'error' || startError !== null) && (
              <p className="text-red-400 text-xs max-w-xs text-center break-words">
                {startError ?? error}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-medium">SintetizAI</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(): void => { void handleToggleDrum(); }}
              disabled={drumLoading}
              aria-pressed={drumPlaying}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors disabled:opacity-50 ${
                drumPlaying
                  ? 'bg-accent text-black border-accent'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {drumLoading ? 'Carregando…' : drumPlaying ? 'Bateria: ON' : 'Bateria: OFF'}
            </button>
            <ModeSelector value={mode} onChange={(m): void => { void handleModeChange(m); }} />
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 p-3 rounded border border-zinc-800 bg-panel">
          <Knob label="Cutoff" value={cutoff} min={CUTOFF_MIN_HZ} max={CUTOFF_MAX_HZ} unit="Hz" />
          <Knob label="Reson." value={resonance} min={RESONANCE_MIN} max={RESONANCE_MAX} />
          <Knob label="Amp" value={amplitude * 100} min={0} max={100} unit="%" />
        </div>

        <div className="grid grid-cols-6 gap-3 p-3 rounded border border-zinc-800 bg-panel">
          <Knob label="LFO Rate" value={lfoRate} min={0} max={12} unit="Hz" />
          <Knob label="LFO Depth" value={lfoDepth * 100} min={0} max={100} unit="%" />
          <Knob label="Drive" value={drive * 100} min={0} max={100} unit="%" />
          <Knob label="Delay" value={delayMix * 100} min={0} max={100} unit="%" />
          <Knob label="Reverb" value={reverbMix * 100} min={0} max={100} unit="%" />
          <Knob label="Chorus" value={chorusMix * 100} min={0} max={100} unit="%" />
        </div>

        <SamplePackPicker
          value={samplePackId}
          onChange={(id): void => { void handleSamplePackChange(id); }}
        />

        <Visualizer width={640} height={120} />

        <PresetPanel />
      </section>
    </main>
  );
}

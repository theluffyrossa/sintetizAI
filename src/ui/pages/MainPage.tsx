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
import { PresetPanel } from '@/ui/components/PresetPanel';
import { getCurrentMode, setMode, startAudio } from '@/audio/engine';
import { applyBindings } from '@/mapping/gestureMapper';
import type { FrameDetection } from '@/types/vision';
import type { SynthModeKind } from '@/types/audio';

const VIDEO_W = 640;
const VIDEO_H = 480;

export function MainPage(): JSX.Element {
  const { videoRef, status, error, start } = useWebcam();
  const mode = useSynthStore((s) => s.mode);
  const bindings = useSynthStore((s) => s.bindings);
  const audioStarted = useSynthStore((s) => s.audioStarted);
  const setModeStore = useSynthStore((s) => s.setMode);
  const setAudioStarted = useSynthStore((s) => s.setAudioStarted);
  const detectionRef = useRef<FrameDetection | null>(null);

  const cutoff = useAtomValue(paramAtoms.cutoff);
  const resonance = useAtomValue(paramAtoms.resonance);
  const amplitude = useAtomValue(paramAtoms.amplitude);

  const [bootstrapping, setBootstrapping] = useState(false);

  const handleStart = useCallback(async (): Promise<void> => {
    setBootstrapping(true);
    try {
      await startAudio();
      await setMode(mode);
      await start();
      setAudioStarted(true);
    } catch (e) {
      console.error('start failed', e);
    } finally {
      setBootstrapping(false);
    }
  }, [mode, start, setAudioStarted]);

  const handleModeChange = useCallback(async (next: SynthModeKind): Promise<void> => {
    setModeStore(next);
    if (audioStarted) await setMode(next);
  }, [audioStarted, setModeStore]);

  useFrameLoop({
    video: videoRef.current,
    enabled: status === 'ready',
    onFrame: (detection): void => {
      detectionRef.current = detection;
      const m = getCurrentMode();
      if (m !== null) applyBindings(detection, bindings, m);
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
          <div className="absolute inset-0 grid place-items-center bg-black/70 rounded">
            {status === 'error' ? (
              <p className="text-red-400 text-sm max-w-xs text-center px-4">{error}</p>
            ) : (
              <button
                onClick={(): void => { void handleStart(); }}
                disabled={bootstrapping}
                className="px-4 py-2 rounded bg-accent text-black text-sm font-medium disabled:opacity-50"
              >
                {bootstrapping ? 'Iniciando…' : 'Iniciar áudio e câmera'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-medium">SintetizAI</h1>
          <ModeSelector value={mode} onChange={(m): void => { void handleModeChange(m); }} />
        </header>

        <div className="grid grid-cols-3 gap-3 p-3 rounded border border-zinc-800 bg-panel">
          <Knob label="Cutoff" value={cutoff} min={200} max={8000} unit="Hz" />
          <Knob label="Reson." value={resonance} min={0.5} max={20} />
          <Knob label="Amp" value={amplitude * 100} min={0} max={100} unit="%" />
        </div>

        <Visualizer width={640} height={120} />

        <PresetPanel />
      </section>
    </main>
  );
}

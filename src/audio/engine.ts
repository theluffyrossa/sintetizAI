import * as Tone from 'tone';
import type { AudioEngineStatus, SynthMode, SynthModeKind } from '@/types/audio';
import { SubtractiveSynth } from './modes/subtractive';

let currentMode: SynthMode | null = null;
let started = false;

export async function startAudio(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export async function setMode(kind: SynthModeKind): Promise<SynthMode> {
  if (currentMode !== null) {
    currentMode.stop();
    currentMode.dispose();
    currentMode = null;
  }
  switch (kind) {
    case 'subtractive':
      currentMode = new SubtractiveSynth();
      break;
    case 'fm':
    case 'sampler':
      throw new Error(`Mode "${kind}" not yet implemented`);
  }
  await currentMode.start();
  return currentMode;
}

export function getCurrentMode(): SynthMode | null {
  return currentMode;
}

export function getStatus(): AudioEngineStatus {
  return {
    running: started,
    contextState: started ? Tone.getContext().state : 'unloaded',
    currentMode: currentMode?.kind ?? null,
  };
}

export function disposeAudio(): void {
  if (currentMode !== null) {
    currentMode.dispose();
    currentMode = null;
  }
  started = false;
}

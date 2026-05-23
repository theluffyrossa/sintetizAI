import * as Tone from 'tone';
import { DRUM_LOOP_URL, DRUM_LOOP_DEFAULT_VOLUME_DB } from '@/constants/audio';

let player: Tone.Player | null = null;
let loading = false;

async function ensurePlayer(): Promise<Tone.Player> {
  if (player !== null) return player;
  const created = new Tone.Player({
    url: DRUM_LOOP_URL,
    loop: true,
    autostart: false,
    volume: DRUM_LOOP_DEFAULT_VOLUME_DB,
  }).toDestination();
  player = created;
  await Tone.loaded();
  return created;
}

export async function startDrumLoop(): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    const p = await ensurePlayer();
    if (p.state !== 'started') {
      p.start();
    }
  } finally {
    loading = false;
  }
}

export function stopDrumLoop(): void {
  if (player === null) return;
  if (player.state === 'started') {
    player.stop();
  }
}

export function isDrumLoopPlaying(): boolean {
  return player !== null && player.state === 'started';
}

export function disposeDrumLoop(): void {
  if (player !== null) {
    player.stop();
    player.dispose();
    player = null;
  }
}

import { LOOP_SILENCE_THRESHOLD } from '@/constants/audio';

export interface LoopPoints {
  readonly start: number;
  readonly end: number;
}

export interface BufferLike {
  readonly duration: number;
  readonly sampleRate: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

export function detectLoopPoints(buffer: BufferLike, threshold: number = LOOP_SILENCE_THRESHOLD): LoopPoints {
  const channels = buffer.numberOfChannels;
  const length = buffer.getChannelData(0).length;
  const sampleRate = buffer.sampleRate;

  let firstAudible = -1;
  for (let i = 0; i < length; i += 1) {
    let peak = 0;
    for (let c = 0; c < channels; c += 1) {
      const v = Math.abs(buffer.getChannelData(c)[i] ?? 0);
      if (v > peak) peak = v;
    }
    if (peak > threshold) {
      firstAudible = i;
      break;
    }
  }

  let lastAudible = -1;
  for (let i = length - 1; i >= 0; i -= 1) {
    let peak = 0;
    for (let c = 0; c < channels; c += 1) {
      const v = Math.abs(buffer.getChannelData(c)[i] ?? 0);
      if (v > peak) peak = v;
    }
    if (peak > threshold) {
      lastAudible = i;
      break;
    }
  }

  if (firstAudible < 0 || lastAudible <= firstAudible) {
    return { start: 0, end: buffer.duration };
  }

  return {
    start: firstAudible / sampleRate,
    end: (lastAudible + 1) / sampleRate,
  };
}

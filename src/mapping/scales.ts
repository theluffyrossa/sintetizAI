export const MAJOR_SCALE: readonly number[] = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
export const MINOR_SCALE: readonly number[] = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24];
export const PENTATONIC_SCALE: readonly number[] = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export function quantizeToScale(
  normalizedInput: number,
  scale: readonly number[],
  rootMidi: number,
): number {
  const clamped = Math.max(0, Math.min(1, normalizedInput));
  const index = Math.floor(clamped * scale.length);
  const safeIndex = Math.min(index, scale.length - 1);
  const offset = scale[safeIndex];
  if (offset === undefined) {
    throw new Error('scale must not be empty');
  }
  return rootMidi + offset;
}

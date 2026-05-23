import { db } from './db';
import { PresetSchema } from './presetSchema';
import type { Preset } from '@/types/preset';

export async function savePreset(preset: Preset): Promise<void> {
  const validated = PresetSchema.parse(preset);
  await db.presets.put(validated as Preset);
}

export async function loadPreset(id: string): Promise<Preset | undefined> {
  return db.presets.get(id);
}

export async function listPresets(): Promise<readonly Preset[]> {
  return db.presets.orderBy('updatedAt').reverse().toArray();
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

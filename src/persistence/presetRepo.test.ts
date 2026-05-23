import { describe, it, expect, beforeEach } from 'vitest';
import { savePreset, listPresets, deletePreset, loadPreset } from './presetRepo';
import { db } from './db';
import type { Preset } from '@/types/preset';

const VALID_PRESET: Preset = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test',
  mode: 'subtractive',
  synthParams: { cutoff: 1200 },
  gestureBindings: [],
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
};

describe('presetRepo', () => {
  beforeEach(async () => {
    await db.presets.clear();
  });

  it('salva e recupera um preset por id', async () => {
    await savePreset(VALID_PRESET);
    const loaded = await loadPreset(VALID_PRESET.id);
    expect(loaded?.name).toBe('Test');
  });

  it('lista presets', async () => {
    await savePreset(VALID_PRESET);
    const all = await listPresets();
    expect(all).toHaveLength(1);
  });

  it('rejeita preset inválido (sem name)', async () => {
    const invalid = { ...VALID_PRESET, name: '' };
    await expect(savePreset(invalid)).rejects.toThrow();
  });

  it('remove preset por id', async () => {
    await savePreset(VALID_PRESET);
    await deletePreset(VALID_PRESET.id);
    const loaded = await loadPreset(VALID_PRESET.id);
    expect(loaded).toBeUndefined();
  });
});

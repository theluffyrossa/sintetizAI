import Dexie, { type EntityTable } from 'dexie';
import type { Preset } from '@/types/preset';

class SintetizDB extends Dexie {
  declare presets: EntityTable<Preset, 'id'>;

  constructor() {
    super('sintetizai');
    this.version(1).stores({ presets: 'id, name, mode, updatedAt' });
  }
}

export const db = new SintetizDB();

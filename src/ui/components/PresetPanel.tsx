import { useCallback, useEffect, useState, type JSX } from 'react';
import { useSynthStore } from '@/state/synthStore';
import { deletePreset, listPresets, savePreset } from '@/persistence/presetRepo';
import type { Preset } from '@/types/preset';

function uuid(): string {
  return crypto.randomUUID();
}

export function PresetPanel(): JSX.Element {
  const mode = useSynthStore((s) => s.mode);
  const bindings = useSynthStore((s) => s.bindings);
  const setBindings = useSynthStore((s) => s.setBindings);
  const setMode = useSynthStore((s) => s.setMode);
  const [name, setName] = useState('Meu preset');
  const [presets, setPresets] = useState<readonly Preset[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    setPresets(await listPresets());
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleSave = async (): Promise<void> => {
    const now = new Date().toISOString();
    const preset: Preset = {
      id: uuid(),
      name: name.trim().length > 0 ? name : 'Sem nome',
      mode,
      synthParams: {},
      gestureBindings: bindings,
      createdAt: now,
      updatedAt: now,
    };
    await savePreset(preset);
    await refresh();
  };

  const handleLoad = (preset: Preset): void => {
    setMode(preset.mode);
    setBindings(preset.gestureBindings);
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deletePreset(id);
    await refresh();
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded border border-zinc-800 bg-panel">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e): void => setName(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
          placeholder="Nome do preset"
        />
        <button
          onClick={(): void => { void handleSave(); }}
          className="px-3 py-1 rounded bg-accent text-black text-xs font-medium"
        >
          Salvar
        </button>
      </div>
      <ul className="flex flex-col gap-1 max-h-40 overflow-auto">
        {presets.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <button
              onClick={(): void => handleLoad(p)}
              className="flex-1 text-left text-zinc-300 hover:text-accent truncate"
            >
              {p.name} <span className="text-zinc-600">[{p.mode}]</span>
            </button>
            <button
              onClick={(): void => { void handleDelete(p.id); }}
              className="text-zinc-500 hover:text-red-400 px-2"
              aria-label="Apagar preset"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

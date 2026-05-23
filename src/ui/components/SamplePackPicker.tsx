import type { JSX } from 'react';
import { cn } from '@/lib/cn';
import { SAMPLE_PACKS } from '@/constants/samplePacks';

export interface SamplePackPickerProps {
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly disabled?: boolean;
}

export function SamplePackPicker({ value, onChange, disabled = false }: SamplePackPickerProps): JSX.Element {
  return (
    <div className="p-3 rounded border border-zinc-800 bg-panel flex flex-col gap-2">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-200">Sample pack</h2>
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Sampler</span>
      </header>
      <ul className="flex flex-col gap-1.5">
        {SAMPLE_PACKS.map((pack) => {
          const selected = pack.id === value;
          return (
            <li key={pack.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={(): void => onChange(pack.id)}
                aria-pressed={selected}
                className={cn(
                  'w-full text-left px-3 py-2 rounded border text-xs transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700',
                )}
              >
                <div className="font-medium">{pack.label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{pack.description}</div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

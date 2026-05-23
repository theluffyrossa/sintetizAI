import type { JSX } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';
import type { SynthModeKind } from '@/types/audio';

const MODES: ReadonlyArray<{ readonly value: SynthModeKind; readonly label: string }> = [
  { value: 'subtractive', label: 'Subtrativo' },
  { value: 'fm', label: 'FM' },
  { value: 'sampler', label: 'Sampler' },
];

export interface ModeSelectorProps {
  readonly value: SynthModeKind;
  readonly onChange: (mode: SynthModeKind) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps): JSX.Element {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v): void => {
        if (v === 'subtractive' || v === 'fm' || v === 'sampler') onChange(v);
      }}
      className="inline-flex rounded-md border border-zinc-700 overflow-hidden"
    >
      {MODES.map((m) => (
        <ToggleGroup.Item
          key={m.value}
          value={m.value}
          className={cn(
            'px-3 py-1.5 text-xs',
            'data-[state=on]:bg-accent data-[state=on]:text-black',
            'data-[state=off]:bg-zinc-900 data-[state=off]:text-zinc-300',
          )}
        >
          {m.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

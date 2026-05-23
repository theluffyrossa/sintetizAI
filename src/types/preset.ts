import type { SynthModeKind } from './audio';
import type { GestureBinding } from './gesture';

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly mode: SynthModeKind;
  readonly synthParams: Readonly<Record<string, number>>;
  readonly gestureBindings: readonly GestureBinding[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

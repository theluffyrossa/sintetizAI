import { z } from 'zod';

export const GestureBindingSchema = z.object({
  id: z.string().min(1),
  hand: z.enum(['Left', 'Right', 'both']),
  feature: z.enum(['positionX', 'positionY', 'pinchDistance', 'palmOpenness', 'handsDistance', 'fistDetected']),
  target: z.enum(['pitch', 'amplitude', 'cutoff', 'resonance', 'lfoDepth', 'modulationIndex', 'sustain']),
  curve: z.enum(['linear', 'exponential', 'quantizedScale']),
  inputMin: z.number(),
  inputMax: z.number(),
  outputMin: z.number(),
  outputMax: z.number(),
  smoothingMs: z.number().min(1).max(500),
});

export const PresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  mode: z.enum(['subtractive', 'fm', 'sampler']),
  synthParams: z.record(z.string(), z.number()),
  gestureBindings: z.array(GestureBindingSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ParsedPreset = z.infer<typeof PresetSchema>;

# SintetizAI — Design Spec

**Data:** 2026-05-23
**Status:** Proposto
**Autor:** brainstorming session (Claude + devteam1@tavweb.com.br)

---

## 1. Visão geral

SintetizAI é um sintetizador musical web onde o usuário controla a síntese sonora através das mãos, captadas pela webcam e analisadas em tempo real por visão computacional. Cada mão e cada gesto é mapeado a parâmetros do sintetizador (pitch, filter, envelope, modulação, etc.), permitindo tocar e modular som sem instrumento físico.

A aplicação roda 100% no navegador, sem backend, e suporta três modos de síntese intercambiáveis em tempo real.

## 2. Objetivos e não-objetivos

### Objetivos
- App web client-side em React 19 + TypeScript estrito
- Detecção de até 2 mãos via webcam com 21 landmarks 3D cada
- Latência total (gesto → som) ≤ 100ms (alvo: 30-50ms)
- 3 modos de síntese: subtrativo, FM, sampler
- Mapeamento gesto → parâmetro configurável
- Salvamento e carregamento de presets locais (IndexedDB)
- Visualização da webcam com overlay dos landmarks e dos parâmetros ativos
- Visualização do áudio em tempo real (oscilografia + espectro)

### Não-objetivos (escopo fora do MVP)
- Integração WebMIDI (in/out) — adicionar em fase posterior
- Gravação multi-track / loop station
- Backend / sincronização entre dispositivos
- Modo mobile/touch (foco em desktop com webcam)
- Treinamento de modelos custom de gestos
- VST/AU plugins externos

## 3. Stack técnico definido

| Camada | Tecnologia | Versão alvo |
|---|---|---|
| Build | Vite | 6.x |
| Framework | React | 19.x |
| Linguagem | TypeScript | 5.6+ (strict) |
| Visão computacional | `@mediapipe/tasks-vision` | 0.10.35+ |
| Engine de áudio | Tone.js | 15.x |
| DSP de baixo nível | AudioWorklet API nativa | — |
| Estado global | Zustand | 5.x |
| Estado atômico (parâmetros) | Jotai | 2.x |
| UI primitives | Radix UI + shadcn/ui | latest |
| Styling | Tailwind CSS | 4.x |
| Animação | Framer Motion | 11.x |
| Persistência local | Dexie (IndexedDB) | 4.x |
| Validação de schemas | Zod | 3.x |
| Roteamento | React Router | 7.x |
| Testes unitários | Vitest | latest |
| Testes E2E | Playwright | latest |
| Overlay webcam | Canvas 2D nativo + `requestAnimationFrame` | — |
| Visualizer áudio | `AnalyserNode` + Canvas | nativo |
| Worker bridge (futuro) | `ringbuf.js` (padenot) | latest |

### Decisões de arquitetura críticas
1. **Dados de alta frequência (>30Hz) jamais atravessam o reconciler do React.** Landmarks e samples vivem em `useRef` / `AudioParam`. React só recebe updates throttled a 10-20Hz para feedback visual.
2. **AudioWorklet obrigatório** para qualquer DSP custom. `ScriptProcessorNode` está deprecated.
3. **Self-host dos modelos MediaPipe** (`hand_landmarker.task`, WASM) — evita dependência do CDN do Google em produção.
4. **Sem tipagem inline** — types e interfaces em arquivos dedicados em `src/types/`.
5. **Sem comentários no código** — nomes autoexplicativos; comentário só para invariante não-óbvia.

## 4. Arquitetura

### Diagrama de threads
```
┌─ MAIN THREAD ─────────────────────────────────────────────┐
│                                                            │
│  <video> webcam ──► MediaPipe HandLandmarker               │
│                            │                               │
│                            ▼                               │
│                     GestureMapper (useRef)                 │
│                       │              │                     │
│              ┌────────┘              └──────────┐          │
│              ▼                                  ▼          │
│       Canvas Overlay                   Tone.js Engine      │
│       (landmarks, debug)                (AudioParam ramps) │
│              │                                  │          │
│              ▼                                  ▼          │
│       React UI (Radix + shadcn)         AudioContext       │
│       (knobs, presets, modo) ◄──── throttle(15Hz)          │
│                                                            │
└────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                  ┌─ AUDIO THREAD ─────────────┐
                  │ AudioWorklet (Tone.js +    │
                  │ módulos custom opcionais)  │
                  │ buffer 128 samples (~3ms)  │
                  └─────────────────┬──────────┘
                                    ▼
                                🔊 Saída
```

### Estrutura de pastas
```
src/
├── vision/              # Wrapper MediaPipe, detecção, frame loop
│   ├── handLandmarker.ts
│   ├── gestureDetector.ts
│   └── frameLoop.ts
├── audio/               # Engine Tone.js, modos de síntese
│   ├── engine.ts
│   ├── modes/
│   │   ├── subtractive.ts
│   │   ├── fm.ts
│   │   └── sampler.ts
│   ├── effects.ts
│   └── presets.ts
├── mapping/             # Bridge gesto → parâmetro de áudio (zero React)
│   ├── gestureMap.ts
│   ├── paramBindings.ts
│   └── scales.ts
├── ui/                  # Componentes React
│   ├── components/      # Knob, Slider, Display, Visualizer
│   ├── panels/          # SynthPanel, GesturePanel, PresetPanel
│   └── pages/           # MainPage
├── state/               # Zustand stores + Jotai atoms
│   ├── synthStore.ts
│   ├── presetStore.ts
│   └── paramAtoms.ts
├── persistence/         # Dexie database, schemas Zod
│   ├── db.ts
│   └── presetRepo.ts
├── workers/             # OffscreenCanvas visualizer (se necessário)
├── types/               # Type/interface declarations
│   ├── vision.ts
│   ├── audio.ts
│   ├── gesture.ts
│   └── preset.ts
└── constants/           # MIN_PITCH, MAX_CUTOFF, MODEL_PATHS, etc.
```

### Componentes principais

**VisionPipeline** (`src/vision/`)
- Inicializa `HandLandmarker` com `delegate: "GPU"`, `numHands: 2`, `runningMode: "VIDEO"`
- Loop via `requestAnimationFrame` consumindo `<video>` element
- Emite eventos com landmarks via `EventTarget` ou callback ref — não usa setState

**GestureMapper** (`src/mapping/`)
- Função pura recebe landmarks → calcula features (distância polegar-indicador, posição XY, gesto categórico)
- Aplica curva de mapeamento (linear/exponencial/quantizado por escala) → escreve em `AudioParam.setTargetAtTime(value, now, smoothingTime)`
- Smoothing time configurável (5-20ms) para evitar zipper noise

**AudioEngine** (`src/audio/`)
- Instancia um único `Tone.Context` no boot
- Modos como classes (`SubtractiveSynth`, `FmSynth`, `SamplerSynth`) com interface comum `SynthMode`
- Switch entre modos: silencia o atual (`triggerRelease`), conecta o próximo no destino
- Cadeia de efeitos compartilhada (reverb, delay) opcional

**React UI** (`src/ui/`)
- Knobs custom SVG (sem libs mortas como react-rotary-knob)
- Lê valores dos parâmetros via Jotai atoms throttled
- Layout: webcam à esquerda, painéis à direita, visualizer no rodapé

### Mapeamento gestual MVP (revisável em UI)

| Mão | Feature | Parâmetro padrão | Range |
|---|---|---|---|
| Direita | Posição Y (vertical) | Pitch (quantizado por escala) | C3–C6 |
| Direita | Distância polegar↔indicador | Velocity/amplitude | 0–1 |
| Direita | Gesto `closed_fist` | Sustain (note hold) | bool |
| Esquerda | Posição X (horizontal) | Filter cutoff | 200Hz–8kHz log |
| Esquerda | Distância polegar↔indicador | Filter resonance (Q) | 0.5–20 |
| Esquerda | Gesto `open_palm` | LFO depth | 0–1 |
| Ambas | Distância entre mãos | Modulação (FM index ou wavetable pos) | 0–10 |

Mapeamento é dado declarativo (`GestureBinding[]`), persistido no preset. Usuário pode reconfigurar via UI.

### Modos de síntese

**Subtrativo (Tone.js `MonoSynth`/`PolySynth`)**
- 1 oscilador (saw/square/triangle/sine)
- Filtro lowpass com cutoff + Q
- ADSR de amplitude e de filtro
- LFO opcional roteável

**FM (Tone.js `FMSynth`)**
- Carrier + 1 modulator
- Harmonicity, modulation index, ADSR
- Limite: 2 operadores (Tone.js)

**Sampler (Tone.js `Sampler`)**
- Carrega samples padrão (piano, strings) embarcados via Vite asset
- Usuário pode trocar samples (upload local)
- Pitch shift por playback rate

### Fluxo de dados (frame único)

1. `<video>` emite frame → MediaPipe `detectForVideo(video, timestamp)`
2. Retorna `HandLandmarkerResult` com 21 landmarks × 2 mãos + world coords
3. `GestureMapper` calcula features (puro)
4. Para cada binding ativo: `audioParam.setTargetAtTime(mappedValue, now, smoothingTime)`
5. Em paralelo: Canvas overlay redesenha landmarks (mesmo `requestAnimationFrame`)
6. A cada ~60ms (throttle): Jotai atoms recebem snapshot → React knobs re-renderizam suavemente

### Persistência (Dexie + Zod)

```ts
PresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  mode: z.enum(['subtractive', 'fm', 'sampler']),
  synthParams: z.record(z.string(), z.number()),
  gestureBindings: z.array(GestureBindingSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

## 5. Tratamento de erros

- **Permissão de câmera negada** → tela de erro com instrução clara, sem stack trace
- **Webcam não disponível** → fallback informativo
- **Modelo MediaPipe falha em carregar** → retry com backoff, depois mensagem ao usuário
- **AudioContext não pode iniciar** (autoplay policy) → botão "Iniciar áudio" sempre visível até primeiro gesto do usuário
- **WebGL/GPU delegate falha** → fallback automático para CPU delegate (degradação graciosa)
- **Erros internos** → log estruturado (console.error com contexto), nunca silenciados

## 6. Testes

### Unitários (Vitest)
- `GestureMapper` (puro): feature extraction, curve mapping, scale quantization
- `presetRepo`: CRUD com schema validation
- `audioEngine`: switch de modos, cleanup de nodes

### Integração
- VisionPipeline + GestureMapper com landmarks fake fixtures
- AudioEngine carrega/troca presets sem vazamento de nodes

### E2E (Playwright)
- Mock `getUserMedia` com vídeo fixture pré-gravado
- Suite golden-path: app carrega → permissão → detecção → som sai → preset salva → recarrega

## 7. Performance (alvos)

| Métrica | Alvo |
|---|---|
| Latência gesto → som | ≤ 50ms (P50), ≤ 100ms (P95) |
| FPS visão | ≥ 30 (alvo 60) |
| Bundle inicial (gzip) | ≤ 600 KB (sem modelos) |
| Modelos carregados sob demanda | ≤ 10 MB total |
| Memória residente | ≤ 350 MB |

## 8. Segurança / privacidade

- Webcam só é ativada após gesto explícito do usuário (button click)
- Nenhum frame de vídeo sai do navegador
- Nenhum analytics de terceiros no MVP
- CSP estrita: `default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; worker-src 'self' blob:;`
- Modelos MediaPipe self-hosted (sem CDN externo em produção)

## 9. Fases de entrega

### Fase 1 — Esqueleto e visão (semana 1-2)
- Vite + React 19 + TS strict + Tailwind 4
- VisionPipeline funcional com overlay de landmarks no canvas
- Sem áudio ainda; só prova que detecção 60 FPS funciona

### Fase 2 — Áudio mínimo (semana 2-3)
- Tone.js inicializado, MonoSynth tocando
- 1 binding hardcoded (distância polegar-indicador → cutoff)
- Validar latência e qualidade do mapeamento

### Fase 3 — Três modos + UI (semana 3-5)
- SubtractiveSynth, FmSynth, SamplerSynth com interface comum
- Painel UI: knobs custom, seletor de modo, sliders
- Visualizer áudio (oscilografia + espectro via AnalyserNode)

### Fase 4 — Bindings configuráveis + presets (semana 5-6)
- UI para editar `GestureBinding[]`
- Salvar/carregar presets via Dexie
- Validação Zod no boundary

### Fase 5 — Polimento, testes, perf (semana 6-7)
- Suite Vitest + Playwright
- Profiling, otimizações de re-render
- Acessibilidade (Radix já dá grande parte)
- Documentação README

## 10. Critérios de sucesso

- [ ] Usuário abre a app, dá permissão de câmera, vê suas mãos com landmarks em ≤ 5 segundos
- [ ] Move a mão → som responde sem delay perceptível
- [ ] Pode trocar entre os 3 modos sem glitch
- [ ] Pode salvar um preset, recarregar a página, e o preset volta intacto
- [ ] Funciona em Chrome, Edge, Firefox estáveis (Safari best-effort por suporte parcial WebMIDI/AudioWorklet)
- [ ] Sem warnings de console em uso normal
- [ ] `tsc --noEmit` passa em modo strict, sem `any`
- [ ] Bundle inicial ≤ 600KB gzip

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Latência percebida acima de 100ms | Profiling cedo na Fase 2; usar AudioParam ramps, não setValue |
| MediaPipe degrada com luz ruim | Configurar `minTrackingConfidence` e visualizar "qualidade do tracking" na UI |
| Re-renders do React quebram performance | Refs para dados quentes; React DevTools profiler check em cada fase |
| Bundle de modelos pesado | Lazy load do `.task`; mostrar progresso de download |
| Política de autoplay de áudio | Botão "Start" sempre presente antes do primeiro som |
| Safari incompatibilidade | Detectar features; mostrar aviso amigável se faltar AudioWorklet |

## 12. Itens fora de escopo (backlog futuro)

- WebMIDI in/out (controlador físico + envio para DAW)
- Faust → AudioWorklet para FM 6-op estilo DX7 e wavetable autoral
- Modo mobile/tablet (touch + câmera frontal)
- Recording multi-track, looper, gravação para WAV/OGG
- Compartilhamento de presets via URL ou backend
- Treinamento de gestos custom pelo próprio usuário
- Modo colaborativo (WebRTC peer-to-peer)

---

## Anexo A — Links de referência

- MediaPipe HandLandmarker Web JS: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- MediaPipe GestureRecognizer: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js
- `@mediapipe/tasks-vision` (npm): https://www.npmjs.com/package/@mediapipe/tasks-vision
- Tone.js: https://tonejs.github.io/
- Tone.js + React: https://github.com/Tonejs/Tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue
- AudioWorklet design pattern (Chrome): https://developer.chrome.com/blog/audio-worklet-design-pattern/
- Vite: https://vitejs.dev/
- Zustand: https://github.com/pmndrs/zustand
- Jotai: https://jotai.org/
- shadcn/ui: https://ui.shadcn.com/
- Dexie: https://dexie.org/
- ringbuf.js: https://github.com/padenot/ringbuf.js/

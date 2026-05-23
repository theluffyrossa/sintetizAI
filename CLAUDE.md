# CLAUDE.md — SintetizAI

> Instruções de projeto para qualquer agente Claude trabalhando neste repositório.
> Estas regras **complementam** (não substituem) as diretrizes globais do usuário em `~/.claude/CLAUDE.md`.

## 1. O que é o SintetizAI

Sintetizador musical web controlado por gestos das mãos via webcam. Roda 100% no navegador (sem backend). Três modos de síntese intercambiáveis em tempo real (subtrativo, FM, sampler), mapeamento gestual configurável e presets persistidos em IndexedDB.

**Documentos canônicos** (leia antes de qualquer task não-trivial):
- Spec de design: `docs/superpowers/specs/2026-05-23-sintetizai-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-05-23-sintetizai.md`

Se o que você está fazendo contradiz a spec, **pare e pergunte** — não decida sozinho mudar a spec.

## 2. Stack obrigatório

| Camada | Lib | Versão |
|---|---|---|
| Build | Vite | 6.x |
| Framework | React | 19.x |
| Linguagem | TypeScript | 5.6+ strict |
| Visão | `@mediapipe/tasks-vision` | 0.10+ |
| Áudio | Tone.js | 15.x |
| Estado global | Zustand | 5.x |
| Estado atômico | Jotai | 2.x |
| UI primitives | Radix UI + shadcn/ui | latest |
| Styling | Tailwind CSS | 4.x |
| Animação | Framer Motion | 11.x |
| Persistência | Dexie (IndexedDB) | 4.x |
| Validação | Zod | 3.x |
| Testes unitários | Vitest | latest |
| Testes E2E | Playwright | latest |

**Não troque libs sem aprovação.** A escolha foi resultado de pesquisa documentada.

## 3. Regras absolutas de código

Herdadas de `~/.claude/CLAUDE.md` e reforçadas neste projeto:

1. **Sem comentários no código.** Nomes devem revelar intenção. Único caso permitido: invariante não-óbvia (ex: workaround documentado).
2. **Sem `any`** — nunca. Use `unknown` + narrow, ou defina um type adequado.
3. **Sem tipagem inline.** Types e interfaces vivem em `src/types/`.
4. **Return types explícitos** em toda função/método público.
5. **Sem `console.log`.** Use `console.warn` ou `console.error` apenas para erros reais.
6. **Sem `var`.** Apenas `const` (default) ou `let` (quando reatribuição é necessária).
7. **Sem `==`.** Sempre `===` e `!==`.
8. **Sem valores hardcoded** dispersos pelo código. Constantes nomeadas em `src/constants/`.
9. **Sem `await` em loops** quando operações são independentes — use `Promise.all`.
10. **Sem ignorar erros silenciosamente.** Trate ou propague com contexto.

## 4. Convenções do projeto

### Estrutura de pastas (não reorganize sem motivo)
```
src/
  vision/           Wrapper MediaPipe, detecção, frame loop, overlay
  audio/            Engine Tone.js + modos de síntese
    modes/          SubtractiveSynth, FmSynth, SamplerSynth
  mapping/          Bridge gesto → AudioParam (zero React)
  ui/
    components/     Knob, ModeSelector, Visualizer, PresetPanel
    pages/          MainPage
  state/            Zustand store + Jotai atoms + throttle
  persistence/      Dexie db + Zod schemas + repo
  workers/          OffscreenCanvas visualizer (futuro)
  types/            Type/interface declarations
  constants/        Magic numbers e strings nomeadas
  lib/              cn helper e utilitários genéricos
```

### Imports
- Sempre alias `@/` para `src/` (configurado em `tsconfig.json` e `vite.config.ts`).
- Exemplo: `import { mapValue } from '@/mapping/curves';`
- Nunca use `../../../` para subir mais de um nível.

### Nomenclatura
- Componentes React: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Funções puras / utilitários: `camelCase.ts`
- Constantes globais: `UPPER_SNAKE_CASE`
- Booleans: prefixo afirmativo (`isActive`, `hasPermission`, `canEdit`)

### Tipos
- Prefira `readonly` em propriedades de interface e arrays imutáveis.
- Prefira `interface` para objetos públicos, `type` para uniões/aliases.
- Sem `unknown` em parâmetros públicos — defina o tipo correto.

## 5. Princípio arquitetural crítico

> **Dados de alta frequência (>30 Hz) NUNCA atravessam o reconciler do React.**

Isto inclui:
- Landmarks de mão (60 FPS)
- Amostras de áudio
- Cálculos de FFT em tempo real

Estes dados vivem em:
- `useRef` no React
- Callbacks diretos
- `AudioParam.setTargetAtTime()` (Tone.js)
- `EventTarget` ou ring buffers

React recebe **apenas snapshots throttled** (~15 Hz / 60 ms) via Jotai atoms (`src/state/paramThrottle.ts`) para atualizar knobs e displays.

Se você está chamando `setState` dentro de um `requestAnimationFrame` ou no callback do MediaPipe, **pare** — está errado.

## 6. Testes (TDD obrigatório)

Cada task do plano segue o ciclo:
1. Escreva o teste falhando.
2. Rode o teste e veja falhar.
3. Implemente o mínimo para passar.
4. Rode o teste e veja passar.
5. Commit.

### O que testar
- **Funções puras** (mapping, features de visão, validação): teste exaustivo em Vitest.
- **Repo de persistência**: integração com fake-indexeddb.
- **Componentes simples** (Knob, ModeSelector): testes de render com React Testing Library.
- **Fluxos E2E**: Playwright com webcam mockada (canvas → `captureStream`).

### O que **não** testar
- Implementação interna de bibliotecas externas (Tone.js, MediaPipe).
- DOM contracts triviais que já são cobertos por TS.
- Lógica condicional inventada para deixar o teste mais "interessante".

### Mock do Tone.js
Já configurado em `tests/setup.ts`. Adicione propriedades ao mock quando uma nova API de Tone for usada (não remova as existentes).

## 7. Comandos

```bash
npm run dev          # dev server (http://localhost:5173)
npm run build        # typecheck + build de produção
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest (run mode)
npm run test:watch   # Vitest (watch mode)
npm run test:e2e     # Playwright
```

**Antes de qualquer commit em fase de implementação:**
```bash
npm run typecheck && npm run lint && npm run test
```

## 8. Git

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Escopo opcional entre parênteses: `feat(audio): ...`, `fix(vision): ...`.
- Mensagens em português é OK; consistência conta mais que idioma.
- Commits pequenos e atômicos — preferir 5 commits pequenos a 1 commit gigante.
- **Nunca** force-push em main. Branches de feature: `feat/nome-descritivo`.
- **Nunca** commite: `.env`, `node_modules`, modelos pesados (`.task`), samples (`.mp3`, `.wav`).

## 9. Performance — alvos não negociáveis

| Métrica | Limite |
|---|---|
| Latência gesto → som (P50) | ≤ 50 ms |
| Latência gesto → som (P95) | ≤ 100 ms |
| FPS visão | ≥ 30 (alvo 60) |
| Bundle inicial gzip | ≤ 600 KB |
| Memória residente | ≤ 350 MB |

Se uma mudança piora qualquer um destes, **mensione no PR e justifique**.

## 10. Segurança e privacidade

- Webcam ativada **apenas** após clique explícito do usuário (botão).
- Nenhum frame de vídeo sai do navegador — sem upload, sem analytics de terceiros.
- CSP estrita configurada no servidor.
- Modelos MediaPipe **self-hosted** em produção (`public/models/`, `public/mediapipe/wasm/`). CDN só em dev.
- Nenhum secret no código. `.env` no `.gitignore` desde o dia 1.

## 11. Tratamento de erros

- Permissão de câmera negada → tela explicativa, sem stack trace.
- Modelo MediaPipe falha → retry com backoff, depois mensagem clara.
- AudioContext bloqueado (autoplay policy) → botão "Iniciar áudio" visível.
- GPU delegate falha → fallback para CPU automaticamente.
- Erros internos → `console.error` com contexto (nunca `console.log`).

Erros **nunca** são engolidos silenciosamente. Use exceções com mensagens descritivas.

## 12. UI/UX

- Tema escuro padrão (`color-scheme: dark`).
- Cor de destaque: `#7cffb2` (accent verde-menta).
- Acessibilidade: Radix UI já cobre maior parte. Botões devem ter `aria-label` quando texto for visual (ícones, "✕").
- Mensagens ao usuário em português.
- Loading states explícitos — nunca deixar a UI travar sem feedback.

## 13. Como pedir ajuda

Se você é um subagente executando uma task e:
- Encontra ambiguidade na spec → **pergunte ao controlador**, não decida.
- Encontra erro que o plano não previu → **reporte como BLOCKED** com contexto.
- Acha que algo deveria ser diferente do plano → **pergunte antes de mudar**.
- Termina mas tem dúvida sobre qualidade → reporte como **DONE_WITH_CONCERNS** listando o que preocupa.

Não tente "ser esperto" mudando o escopo silenciosamente.

## 14. O que está fora do escopo do MVP

- WebMIDI in/out
- Faust → AudioWorklet customizado
- Modo mobile / touch
- Gravação multi-track / looper
- Backend / sync entre dispositivos
- Treinamento de gestos custom pelo usuário
- Modo colaborativo (WebRTC)

Se uma task pede algo dessa lista, é um erro — consulte o controlador.

## 15. Status atual

Use `git log --oneline` para entender o estado. O plano em `docs/superpowers/plans/2026-05-23-sintetizai.md` é a roadmap canônica. Cada task lá tem checkboxes — o estado da execução é refletido nos commits, não em variáveis externas.

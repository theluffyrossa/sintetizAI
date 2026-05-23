# SintetizAI

Sintetizador musical web controlado por gestos das mãos via webcam. 3 modos de síntese
(subtrativo, FM, sampler), mapeamento gestual configurável e presets locais.

## Requisitos

- Node 20+
- Chrome/Edge/Firefox recente com WebGL e AudioWorklet
- Webcam

## Setup

```bash
npm install
```

Baixe o modelo MediaPipe (instruções em `public/models/README.md`) e os samples opcionais
(instruções em `public/samples/README.md`).

## Comandos

```bash
npm run dev         # servidor de desenvolvimento
npm run typecheck   # verifica tipos
npm run lint        # verifica estilo
npm run test        # testes unitários (Vitest)
npm run test:e2e    # testes end-to-end (Playwright)
npm run build       # build de produção
```

## Arquitetura

Documentação completa em `docs/superpowers/specs/2026-05-23-sintetizai-design.md`.

Princípio crítico: dados de alta frequência (gestos a 60 FPS, áudio) nunca atravessam o
reconciler do React. Vivem em `useRef` e `AudioParam.setTargetAtTime`. A UI React recebe
apenas snapshots throttled (60ms) via Jotai atoms.

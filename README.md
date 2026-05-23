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

## Como usar

Clique em **Iniciar áudio e câmera**, autorize o acesso à webcam e posicione as mãos no
enquadramento. Os gestos padrão controlam síntese e efeitos em tempo real:

### Mão direita
- **Posição vertical (Y)** → altura da nota (pitch, escala quantizada)
- **Pinça (polegar + indicador)** → volume (amplitude)
- **Palma aberta** → profundidade do LFO (varredura dinâmica do filtro)
- **Inclinação da mão (roll)** → velocidade do LFO
- **Profundidade (afasta/aproxima da câmera)** → quantidade de chorus
- **Leque dos dedos (espalhamento)** → sustain do envelope

### Mão esquerda
- **Posição horizontal (X)** → cutoff do filtro
- **Pinça (polegar + indicador)** → ressonância do filtro
- **Palma aberta** → drive (saturação/distorção)
- **Velocidade da mão** → quantidade de delay
- **Pinça (polegar + médio)** → índice de modulação (modo FM)

### Duas mãos
- **Distância entre as mãos** → quantidade de reverb

### Modos de síntese
Use o seletor no topo direito para alternar entre **Subtractive**, **FM** e **Sampler** —
todos passam pela mesma cadeia de efeitos (filtro multimodo + LFO, drive, chorus, delay,
reverb).

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

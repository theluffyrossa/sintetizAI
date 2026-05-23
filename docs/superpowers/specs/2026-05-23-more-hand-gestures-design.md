# Design — Mais gestos de mão (features contínuas)

Data: 2026-05-23
Status: Aprovado (auto mode)

## Problema

O extrator de visão atual expõe apenas 5 features de mão (`positionX`, `positionY`, `pinchDistance`, `palmOpenness`, `handsDistance`) e `DEFAULT_GESTURE_BINDINGS` cobre 7 targets. Vários parâmetros declarados em `GestureTargetParam` (`lfoRate`, `delayMix`, `chorusMix`, `modulationIndex`, `sustain`) não têm binding padrão. Falta vocabulário gestual.

## Escopo

Adicionar 5 features contínuas novas no extrator de visão e 5 bindings padrão que as conectem aos targets soltos.

Fora de escopo: gestos discretos (triggers, eventos), UI de mapeamento, refactor do `gestureMapper` além do mínimo necessário para `handVelocity`.

## Features novas

Todas são funções puras em `src/vision/features.ts`. Saída normalizada por padrão (range definido por feature).

### `handTilt(hand: HandLandmarks): number`

Roll da mão no plano da câmera.

- Vetor `wrist → middleMcp` (landmark 9).
- `angle = atan2(dx, -dy)`.
- Normaliza por `π/2` e clamp em `[-1, 1]`.
- Saída: `-1` (tombada à esquerda) ... `0` (vertical) ... `1` (tombada à direita).
- Sem estado.

### `handVelocity(hand, prev, dtMs): number`

Magnitude da velocidade do punho em coordenadas de frame por segundo, normalizada.

- `dist3D(wrist, prevWrist) / (dtMs / 1000)`.
- Divide por `HAND_VELOCITY_MAX_NORM` e clamp `[0, 1]`.
- Primeiro frame (`prev === undefined`) retorna `0`.
- Estado vive no mapper, passado como parâmetro — a função permanece pura.

### `handDepth(hand: HandLandmarks): number`

Profundidade relativa do punho.

- Usa `wrist.z` (MediaPipe entrega `z` relativo centrado em 0).
- Mapeia `[HAND_DEPTH_MIN, HAND_DEPTH_MAX] = [-0.15, 0.15]` para `[0, 1]` invertido (z mais negativo = mais perto = saída maior).
- Clamp `[0, 1]`. Sem estado.

### `middlePinch(hand: HandLandmarks): number`

Distância 3D entre polegar (4) e médio (12). Mesma escala que `pinchDistance`. Sem estado.

### `fingerSpread(hand: HandLandmarks): number`

Leque entre tips consecutivos.

- Soma `dist(8,12) + dist(12,16) + dist(16,20)`.
- Divide por `FINGER_SPREAD_REF_DIST = 0.30` e clamp `[0, 1]`.
- Diferente de `palmOpenness` (tip ↔ wrist). Mão aberta com dedos colados → palmOpenness alto, fingerSpread baixo.
- Sem estado.

## Constantes novas (`src/constants/vision.ts`)

```
MIDDLE_MCP_INDEX = 9
HAND_VELOCITY_MAX_NORM = 3.0
HAND_DEPTH_MIN = -0.15
HAND_DEPTH_MAX = 0.15
FINGER_SPREAD_REF_DIST = 0.30
```

`MIDDLE_TIP_INDEX` já existe.

## Tipos

`GestureFeatureKind` ganha 5 valores:

```
| 'handTilt'
| 'handVelocity'
| 'handDepth'
| 'middlePinch'
| 'fingerSpread'
```

`GestureBinding` e `GestureTargetParam` não mudam.

## Mapper (`src/mapping/gestureMapper.ts`)

`extractFeatures` recebe um parâmetro adicional opcional para estado entre frames:

```
interface MapperState {
  prevByHand: Map<Handedness, { wrist: Landmark3D; tsMs: number }>;
}
```

- `extractFeatures(detection, state?)` lê `prev` de `state` e atualiza após cálculo.
- Se `state === undefined`, `handVelocity` retorna `0` e nada é persistido — preserva pureza para testes simples.
- `applyBindings` cria o `state` no escopo do módulo (singleton) — espelha o padrão "estado de alta frequência fora do React" do projeto.

## Bindings padrão novos (`src/constants/mapping.ts`)

5 entradas adicionadas ao `DEFAULT_GESTURE_BINDINGS`:

| id | hand | feature | target | curve | input range | output range |
|---|---|---|---|---|---|---|
| `rh-tilt-lforate` | Right | `handTilt` | `lfoRate` | linear | `-1..1` | `LFO_RATE_MIN_HZ..LFO_RATE_MAX_HZ` |
| `lh-velocity-delaymix` | Left | `handVelocity` | `delayMix` | linear | `0..1` | `FX_MIX_MIN..FX_MIX_MAX` |
| `rh-depth-chorusmix` | Right | `handDepth` | `chorusMix` | linear | `0..1` | `FX_MIX_MIN..FX_MIX_MAX` |
| `lh-middlepinch-modindex` | Left | `middlePinch` | `modulationIndex` | linear | `0.02..0.25` | `0..10` |
| `rh-spread-sustain` | Right | `fingerSpread` | `sustain` | linear | `0..1` | `0..1` |

Constantes `MODULATION_INDEX_MIN/MAX` e `SUSTAIN_MIN/MAX` adicionadas em `src/constants/audio.ts` se ainda não existirem.

Total: 12 bindings padrão (era 7).

## Testes (TDD)

### `src/vision/features.test.ts`
- `handTilt`: mão vertical → ~0; punho→middleMcp horizontal → ±1; clamp em extremos.
- `handVelocity`: sem `prev` → 0; movimento conhecido em dt conhecido → valor esperado; clamp ≤ 1.
- `handDepth`: wrist.z = 0 → 0.5; z = HAND_DEPTH_MIN → 1; z = HAND_DEPTH_MAX → 0; clamp fora do range.
- `middlePinch`: distância conhecida.
- `fingerSpread`: dedos colados → 0; espalhados acima do ref → 1; ≠ palmOpenness para o mesmo input.

### `src/mapping/gestureMapper.test.ts`
- `extractFeatures` sem state retorna `handVelocity = 0`.
- `extractFeatures` com state em 2 chamadas consecutivas com dt conhecido produz velocidade > 0.
- `extractFeatures` produz amostras para todas as features novas por mão detectada.

## Riscos e mitigações

- **Calibração de constantes** (`HAND_VELOCITY_MAX_NORM`, `HAND_DEPTH_MIN/MAX`, `FINGER_SPREAD_REF_DIST`): chutes informados, calibráveis sem mudança de API.
- **Sustain como target gestual contínuo**: modos podem ignorar via `setParam`. Aceitável — não quebra nada.
- **modulationIndex só faz sentido no FM**: idem. Outros modos ignoram o setParam.
- **Mais bindings ativos = mais carga por frame**: 12 bindings × 60 FPS = 720 set/s. Insignificante; `paramThrottle` já agrega para React.

## Não-objetivos

- Sem novo extrator MediaPipe.
- Sem mudança no `paramAtoms` / store / engine / UI.
- Sem persistência: bindings novos apenas no array padrão.

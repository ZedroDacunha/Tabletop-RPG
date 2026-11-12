---
id: MEL-015
titulo: Viagem entre vistas com duração ajustável
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: apresentação / câmera
arquivos-afetados: ['src/features/scenes/views.ts', 'src/features/scenes/views.test.ts', 'src/scene/Viewport.tsx', 'src/editor/Inspector.tsx', 'src/App.tsx']
tags: [melhoria, camera, apresentacao, animacao]
relacionados: [MEL-012, BUG-001]
---
# MEL-015 — Viagem entre vistas com duração ajustável

## Resumo
Cada vista guarda o tempo de viagem da câmera até ela (de `0` a `6 s`, padrão `1,2 s`): `0` corta seco, `1,5 s` desliza com suavidade.

## Motivação
Corte seco dá a sensação de slide perdido; viagem longa demais trava a mesa. O ritmo ideal muda por mapa e por momento, então virou ajuste por vista.

## Como era antes
- Trocar de vista movia a câmera instantaneamente (`camera.position.fromArray(...)`), sem transição.
- Nenhum controle de ritmo: ou corte, ou nada.

## Como ficou agora
- `Viewpoint.travel` opcional, clampado por `clampTravel` entre `0` e `MAX_TRAVEL` (6 s), arredondado a 0,1.
- `travelOf(view)` devolve o valor efetivo com padrão `DEFAULT_TRAVEL` (1,2 s); `travelLabel` mostra "1,2 s" no idioma da interface.
- Seletor no inspetor com `TRAVEL_OPTIONS` (`0`, `0,5`, `1`, `1,5`, `2`, `3`) e valores intermediários aceitos pelo clamp.
- Durante a viagem os controles de órbita ficam desligados (`controls.enabled = false`) e voltam ao chegar; a câmera final é salva no projeto (`remember()`).
- A interpolação usa `easeInOut` (cúbica) em posição **e** alvo, para o enquadramento não "escorregar" no fim.

## O que foi feito
1. `clampTravel`, `travelOf`, `travelLabel`, `DEFAULT_TRAVEL`, `MAX_TRAVEL`, `TRAVEL_OPTIONS` em `src/features/scenes/views.ts`.
2. `easeInOut` e `travelProgress` na mesma unidade de tempo (segundos), com a conversão de `performance.now()` feita uma vez — ver [[BUG-001 - Viagem entre vistas terminava no primeiro quadro]].
3. `CameraRig` em `src/scene/Viewport.tsx`: estado `travel` com `from`/`to`/`start`/`duration`; `useFrame` interpola, `invalidate()` mantém o `frameloop="demand"` acordado enquanto dura.
4. `command.duration` no comando de câmera; `duration <= 0` aplica o enquadramento direto, sem animação.
5. `setViewTravel` em `src/App.tsx` e o seletor `.view-travel` no inspetor.

## Decisões e alternativas descartadas
- **Duração global para o mapa**: um mapa de overview e um de interiores pedem ritmos diferentes; por vista é mais útil e não custa nada no arquivo.
- **Mola física (spring)**: resultado bonito, mas imprevisível para apresentar em mesa; a curva cúbica é previsível e testável.
- **`0,25 s` como mínimo**: virou `0` explícito (corte) para quem prefere slide sem animação.

## Arquivos alterados
- `src/features/scenes/views.ts`: `clampTravel`, `travelOf`, `travelLabel`, `DEFAULT_TRAVEL`, `MAX_TRAVEL`, `TRAVEL_OPTIONS`, `easeInOut`, `travelProgress`.
- `src/features/scenes/views.test.ts`: clamp, rótulo e progresso da viagem.
- `src/scene/Viewport.tsx`: estado de viagem no `CameraRig` e travamento dos controles.
- `src/editor/Inspector.tsx`: seletor `.view-travel`.
- `src/App.tsx`: `setViewTravel` e duração no comando de vista.

## Impacto
Apresentação com ritmo escolhido: corte para trocar de cena, deslize para revelar um pátio. A câmera nunca "briga" com o usuário durante a viagem.

## Como validar
1. Duas vistas, a segunda com `0 s`: a troca corta.
2. Com `3 s`: a câmera desliza e leva ~3 s (5 quadros distintos na verificação automatizada).
3. Arrastar com o mouse durante a viagem: a órbita não responde até o fim.
4. Recarregar: a duração de cada vista persistiu.

## Próximos passos
- Legenda por vista no modo apresentação.
- Viagem encadeada entre várias vistas (tour automático).

## Commit / PR
PR [#83](https://github.com/ZedroDacunha/Tabletop-RPG/pull/83).

## Notas relacionadas
- [[MEL-012 - Roteiro de apresentação com vistas navegáveis]]
- [[BUG-001 - Viagem entre vistas terminava no primeiro quadro]]

---
id: MEL-002
titulo: Gizmo preso ao objeto selecionado
tipo: interface/UX
status: concluída
data: 2026-11-11
area: cena 3D / manipulação
arquivos-afetados: ['src/scene/Viewport.tsx', 'src/styles.css']
tags: [melhoria, gizmo, ux, cena3d]
relacionados: [MEL-005, MEL-006]
---
# MEL-002 — Gizmo preso ao objeto selecionado

## Resumo
Mover, girar e escalar passaram a ter alças 3D (`TransformControls`) ancoradas na peça selecionada, discretas e com encaixe na grade.

## Motivação
Editar por campos numéricos é lento e não dá noção de espaço. Faltava um jeito direto de arrastar a peça e ver o resultado no lugar.

## Como era antes
- Só os campos do inspetor (`X`, `Y`, `Z`, rotação, escala) alteravam a peça.
- Nenhuma indicação visual de qual peça estava selecionada no mundo 3D.

## Como ficou agora
- `TransformControls` em `mover`, `girar` e `escalar`, preso ao objeto clicado.
- `size={.85}` — o gizmo fica menor que o padrão para não tapar a peça.
- Eixos com encaixe quando o snap está ligado: `translationSnap={gridSize}`, `rotationSnap={Math.PI/12}`, `scaleSnap={.1}`.
- Marcador de posicionamento com anel de raio fixo (`ringGeometry [.7,.8,32]`), para o alvo não crescer quando a câmera se afasta.

## O que foi feito
1. `Placed` passou a renderizar o `TransformControls` preso ao grupo da peça e a devolver as mudanças por `onTransform`, em vez de mutar o estado da cena.
2. `begin`/`apply`/`finish` separam pré-visualização de commit: o histórico só registra um passo por arraste.
3. Escala limitada por `clampScale` (0,05 a 50) para não gerar matriz degenerada.
4. Ajuste fino de tamanho e opacidade do gizmo no CSS/atributos, para não competir com a peça.

## Decisões e alternativas descartadas
- **Gizmo grande (padrão do drei)**: tapava peças pequenas como arbustos; `size=.85` ficou como meio-termo.
- **Arrastar a peça direto, sem alças**: dava conflito com o clique de seleção e com a câmera; as alças deixam claro o que vai acontecer.
- **Escala livre sem limite**: descartado após gerar peças invertidas e sombras quebradas.

## Arquivos alterados
- `src/scene/Viewport.tsx`: `Placed`, `GroupGizmo`, `clampScale`, marcador de posicionamento e `TransformControls`.
- `src/styles.css`: ajustes de cursor e destaque da peça selecionada.

## Impacto
Editar mapa virou manipulação direta; o passo de "selecionar → arrastar alça" substituiu "selecionar → digitar coordenada". É a base do gizmo de grupo de [[MEL-005 - Seleção múltipla de peças]] e dos grupos de [[MEL-006 - Grupos de peças nomeados]].

## Como validar
1. Selecionar uma peça e arrastar o eixo X: a peça acompanha e o inspetor atualiza no mesmo quadro.
2. Com snap ligado, soltar em posições múltiplas de `gridSize`.
3. Girar com `rotationSnap` ligado: passos de 15°.
4. Desfazer (`Ctrl+Z`): um único passo desfaz o arraste inteiro.

## Próximos passos
- Agrupar a barra de ferramentas do viewport por função.

## Commit / PR
PRs [#57](https://github.com/ZedroDacunha/Tabletop-RPG/pull/57) (gizmo) e [#58](https://github.com/ZedroDacunha/Tabletop-RPG/pull/58) (ajuste de tamanho e anel).

## Notas relacionadas
- [[MEL-005 - Seleção múltipla de peças]]
- [[MEL-006 - Grupos de peças nomeados]]
- [[MEL-007 - Régua e encaixe entre vizinhas]]

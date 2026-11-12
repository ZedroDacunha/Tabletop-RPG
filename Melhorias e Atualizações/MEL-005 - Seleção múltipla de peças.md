---
id: MEL-005
titulo: Seleção múltipla de peças
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / seleção
arquivos-afetados: ['src/App.tsx', 'src/features/projects/project.ts', 'src/scene/Viewport.tsx', 'src/editor/Inspector.tsx']
tags: [melhoria, selecao, ux, gizmo]
relacionados: [MEL-002, MEL-006, MEL-010]
---
# MEL-005 — Seleção múltipla de peças

## Resumo
Dá para selecionar várias peças (`Shift` + clique, `Ctrl`/`⌘` + `A`) e manipulá-las juntas com um gizmo no centro do conjunto.

## Motivação
Montar uma cerca, uma fileira de árvores ou um acampamento exige mexer em muitas peças ao mesmo tempo. Uma por uma, com a câmera se deslocando, é inviável.

## Como era antes
- Seleção de exatamente uma peça; o gizmo e o inspetor trabalhavam sobre ela.
- Nenhuma ação em lote.

## Como ficou agora
- `Shift` + clique alterna a peça na seleção; clique simples troca a seleção; clique no vazio limpa.
- `Ctrl`/`⌘` + `A` seleciona todas as peças visíveis.
- `Esc` limpa a seleção e cancela o posicionamento.
- Com mais de uma peça e uma ferramenta ativa, aparece um único gizmo no centro geométrico do conjunto, que move/gira/escala o grupo inteiro.
- `Delete`/`Backspace` remove todas as selecionadas e `Ctrl`/`⌘` + `D` duplica.

## O que foi feito
1. `toggleSelection(ids, id, additive)` e `selectionCenter(entities)` em `src/features/projects/project.ts` — lógica pura, testável.
2. `GroupGizmo` em `src/scene/Viewport.tsx`: um `THREE.Group` pivô no centro; no `mover`, aplica o mesmo deslocamento a todas; no `girar`, gira posição e orientação em torno do pivô; no `escalar`, escala posição e tamanho a partir do centro.
3. Guarda do estado inicial (`start.current`) em `begin`, para o arraste ser sempre relativo à posição original e não acumular erro.
4. Inspetor em modo lote: mostra a contagem e as ações aplicáveis, escondendo o que depende de uma peça só.

## Decisões e alternativas descartadas
- **Um gizmo por peça**: poluía a cena e multiplicava o custo de arraste; um pivô central é mais previsível.
- **Girar cada peça no próprio eixo**: não é o que se espera de "girar a seleção"; o pivô central permite montar um círculo em volta de uma fogueira, por exemplo.
- **Seleção por caixa (arrastar retângulo)**: ficou de fora por conflitar com o arraste de câmera; a seleção por clique aditivo cobre o uso atual.

## Arquivos alterados
- `src/features/projects/project.ts`: `toggleSelection`, `selectionCenter`.
- `src/scene/Viewport.tsx`: `GroupGizmo` e o render condicional por tamanho da seleção.
- `src/App.tsx`: `select`, `movableSelection`, `remove`, `duplicate` e atalhos.
- `src/editor/Inspector.tsx`: estado de lote.

## Impacto
Compor cenas grandes passou a ser rápido. É a fundação de grupos ([[MEL-006 - Grupos de peças nomeados]]), do alinhamento em lote ([[MEL-010 - Alinhamento em lote e modo apresentação]]) e da exportação de trechos ([[MEL-011 - Exportar e importar trechos entre mapas]]).

## Como validar
1. Clicar em três peças com `Shift`: as três ficam destacadas e o gizmo aparece no centro delas.
2. Arrastar o eixo X: as três andam juntas, mantendo distância.
3. Girar: as três orbitam o centro.
4. `Ctrl+D`: as três são duplicadas como uma seleção nova.
5. `Delete`: as três saem, e um `Ctrl+Z` traz todas de volta.

## Próximos passos
- Agrupar a barra de ferramentas do viewport por função (ver roadmap do README).

## Commit / PR
PR [#73](https://github.com/ZedroDacunha/Tabletop-RPG/pull/73).

## Notas relacionadas
- [[MEL-002 - Gizmo preso ao objeto selecionado]]
- [[MEL-006 - Grupos de peças nomeados]]
- [[MEL-010 - Alinhamento em lote e modo apresentação]]

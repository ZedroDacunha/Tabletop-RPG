---
id: MEL-004
titulo: Atalhos de teclado para mover e girar
tipo: interface/UX
status: concluída
data: 2026-11-11
area: editor / teclado
arquivos-afetados: ['src/App.tsx', 'src/features/projects/project.ts', 'README.md']
tags: [melhoria, atalhos, ux, acessibilidade]
relacionados: [MEL-002, MEL-005]
---
# MEL-004 — Atalhos de teclado para mover e girar

## Resumo
Setas movem a peça selecionada na grade, `Shift` + setas giram em passos de 15°, `Page Up`/`Page Down` sobem e descem e `Alt` faz ajuste fino.

## Motivação
Ajustar a última coluna de uma cerca com o mouse é impreciso; com teclado, é exato e repetível.

## Como era antes
- Ajuste só pelo mouse ou digitando nos campos do inspetor.
- Nenhum jeito de mover ou girar sem tirar a mão do teclado.

## Como ficou agora
- Setas: deslocamento de `gridSize` no eixo escolhido (`←/→` em X, `↑/↓` em Z).
- `Shift` + setas: rotação de 15° (`Math.PI/12`, o mesmo passo do snap do gizmo).
- `Page Up`/`Page Down`: altura (Y) em passos de 1.
- `Alt`: deslocamento fino — `gridSize / 4` em vez da célula inteira.
- Extras do mesmo handler: `F` foca a seleção, `1`–`4` escolhem a ferramenta, `G` liga/desliga a grade, `M` a régua, `P` o modo apresentação, `?` a ajuda, `Ctrl+D` duplica, `Ctrl+A` seleciona tudo, `Ctrl+G`/`Ctrl+Shift+G` agrupa e desagrupa.
- Cada combinação é um passo de histórico; segurar a tecla não gera dezenas de entradas invisíveis.

## O que foi feito
1. `nudgeEntity(entity, {x, y, z, rotate}, limit = 5000)` em `src/features/projects/project.ts`: pura, devolve a peça nova e mantém a posição dentro de `limit`.
2. `nudge` em `src/App.tsx`: lê `Alt`/`Shift`, decide o passo e aplica na seleção inteira, não só na primeira peça.
3. Tratamento de tecla ignora campos de texto e modais (`el.closest('input,textarea,select,[contenteditable="true"]')`), para não roubar a digitação.
4. Controles documentados no `README.md`.

## Decisões e alternativas descartadas
- **Setas moverem livremente**: descartado; fora da grade a peça desalinha na primeira vez que o snap for usado.
- **Girar com `Q`/`E`**: descartado para não colidir com outros atalhos e por exigir memorizar mais uma tecla.
- **`Alt` como passo maior**: invertido — modificador serve para precisão, então ele reduz o passo.

## Arquivos alterados
- `src/features/projects/project.ts`: `nudgeEntity`.
- `src/App.tsx`: `nudge` e o listener de teclado global.
- `README.md`: tabela de controles.

## Impacto
Posicionamento exato sem mouse. Os atalhos funcionam junto com o gizmo ([[MEL-002 - Gizmo preso ao objeto selecionado]]) e com a seleção múltipla ([[MEL-005 - Seleção múltipla de peças]]), inclusive em grupo.

## Como validar
1. Selecionar uma peça, apertar `→`: anda uma célula e o inspetor acompanha.
2. `Shift` + `→`: gira 15°.
3. `Alt` + `→`: anda 1/4 de célula.
4. `Page Up`: sobe 1.
5. Clicar num campo de texto e apertar `→`: o cursor anda no texto, a peça não se mexe.

## Próximos passos
- Atalhos para trocar de vista (`←`/`→` no modo apresentação já existem).

## Commit / PR
PR [#72](https://github.com/ZedroDacunha/Tabletop-RPG/pull/72).

## Notas relacionadas
- [[MEL-005 - Seleção múltipla de peças]]
- [[MEL-007 - Régua e encaixe entre vizinhas]]

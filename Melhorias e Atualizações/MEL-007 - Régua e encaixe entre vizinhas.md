---
id: MEL-007
titulo: Régua e encaixe entre vizinhas
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: cena 3D / precisão
arquivos-afetados: ['src/features/projects/project.ts', 'src/scene/Viewport.tsx', 'src/App.tsx', 'src/styles.css']
tags: [melhoria, regua, precisao, cena3d]
relacionados: [MEL-002, MEL-008]
---
# MEL-007 — Régua e encaixe entre vizinhas

## Resumo
Com `M`, a peça selecionada mostra uma linha pontilhada até a vizinha mais próxima, com a distância em metros, e o arraste encaixa automaticamente quando a diferença é pequena.

## Motivação
Alinhar duas peças "a olho" deixa vãos de 10 cm que estragam a leitura de um mapa na mesa. Faltava medir e encaixar.

## Como era antes
- Só a grade e o snap davam alguma noção de distância.
- Nenhuma informação de quanto uma peça está de outra.

## Como ficou agora
- `M` liga/desliga a régua (`settings.guides`); já vem ligada nos mapas novos.
- `nearestNeighbour(entity, objects)` encontra a vizinha mais próxima e devolve distância e deslocamento.
- `alignToNeighbours(position, entity, objects, threshold)` encaixa a posição quando o desvio em qualquer eixo é menor que `GUIDE_THRESHOLD` (0,75).
- `RulerLine` desenha a linha pontilhada entre as duas peças; um selo no viewport mostra a distância em metros e o nome da vizinha.

## O que foi feito
1. `nearestNeighbour`/`alignToNeighbours` puros em `src/features/projects/project.ts`, distinguindo "alinhado" (desvio abaixo do limite) de "perto" (distância absoluta).
2. `RulerLine` com `Line` tracejado e semi-transparente, para não competir com a peça.
3. Aplicação do encaixe no caminho do arraste (`onTransform`), sem criar passo extra de histórico.
4. Selo de leitura (`.ruler-readout`) reposicionado para não cobrir o inspetor em telas estreitas.
5. Preferência salva no projeto (`settings.guides`), respeitada ao reabrir o mapa.

## Decisões e alternativas descartadas
- **Sempre mostrar a régua para todas as peças**: virou teia ilegível; a régua fica só na peça selecionada e só com a seleção parada.
- **Encaixe em qualquer eixo com o mesmo limite**: os eixos X/Z usam o mesmo limite; Y fica de fora porque altura é intencionalmente livre.
- **Encaixe silencioso**: descartado — o selo mostra a distância, então o encaixe é compreensível e não "mágico".

## Arquivos alterados
- `src/features/projects/project.ts`: `nearestNeighbour`, `alignToNeighbours`, `GUIDE_THRESHOLD`, tipo `Neighbour`.
- `src/scene/Viewport.tsx`: `RulerLine` e o uso do vizinho mais próximo.
- `src/App.tsx`: atalho `M` e ajuste em `settings`.
- `src/styles.css`: `.ruler-readout`.

## Impacto
Alinhamentos exatos sem contar células. Serve de apoio ao alinhamento em lote de [[MEL-010 - Alinhamento em lote e modo apresentação]].

## Como validar
1. Selecionar uma peça, apertar `M`: a linha pontilhada e o selo aparecem.
2. Arrastar a peça para perto da vizinha: quando o desvio é menor que 0,75, ela encaixa e o selo mostra a distância.
3. Desligar `M` e repetir: sem linha e sem encaixe.
4. Recarregar: a preferência da régua persiste.

## Próximos passos
- Régua com medida entre dois pontos escolhidos manualmente.

## Commit / PR
PR [#75](https://github.com/ZedroDacunha/Tabletop-RPG/pull/75).

## Notas relacionadas
- [[MEL-002 - Gizmo preso ao objeto selecionado]]
- [[MEL-010 - Alinhamento em lote e modo apresentação]]

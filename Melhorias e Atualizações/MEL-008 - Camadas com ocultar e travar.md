---
id: MEL-008
titulo: Camadas com ocultar e travar
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / organização
arquivos-afetados: ['src/features/scenes/layers.ts', 'src/features/scenes/layers.test.ts', 'src/editor/Inspector.tsx', 'src/App.tsx']
tags: [melhoria, camadas, organizacao]
relacionados: [MEL-006, MEL-001]
---
# MEL-008 — Camadas com ocultar e travar

## Resumo
Toda peça pertence a uma camada — `Natureza`, `Construções`, `Objetos`, `Básicos` ou `Importados` — e cada camada pode ser ocultada ou travada de uma vez.

## Motivação
Depois de montar o cenário, o que se quer é mexer só nas peças de construção sem arrastar árvores sem querer. Faltava um "grupo por função" que não depende de seleção manual.

## Como era antes
- Visibilidade e trava existiam por peça, uma a uma (campos `visible` e `locked`).
- Nenhuma forma de esconder ou travar um conjunto inteiro de uma vez.

## Como ficou agora
- `layers` define cinco camadas, e `layerOf(entity)` deduz a camada a partir do tipo da peça (modelo importado cai em `Importados`).
- `layerSummary(objects, layer)` devolve `total`, `visible` e `locked` — é o que a interface mostra em cada linha ("12 · 2 ocultas · 1 travada").
- `setLayer(objects, layer, {visible, locked})` aplica a mudança a todas as peças da camada de uma vez.
- Ocultar tira a peça da cena e da seleção; travar mantém visível e bloqueia arraste, mas ainda permite selecionar no inspetor.

## O que foi feito
1. `src/features/scenes/layers.ts` com `LayerId`, `layers`, `layerOf`, `layerSummary` e `setLayer` — puros.
2. `layers.test.ts`: dedução por tipo, contagem com peças ocultas/travadas e aplicação em lote.
3. Seção de camadas no inspetor, com olho e cadeado por linha.
4. `changeLayer` em `src/App.tsx` registrando **um** passo de histórico por clique.
5. Peças travadas saem de `movableSelection`, então o gizmo e os atalhos de seta as ignoram.

## Decisões e alternativas descartadas
- **Camada escolhida à mão pela peça**: obrigaria a decidir de novo a cada peça; a dedução pelo tipo cobre 99% dos casos e não tem configuração.
- **Camadas criadas pelo usuário**: fica para quando houver necessidade de tema por mapa; hoje cinco fixas evitam mapas com camadas fantasma.
- **Ocultar = excluir**: não — ocultar é reversível e fica salvo no mapa.

## Arquivos alterados
- `src/features/scenes/layers.ts`: `LayerId`, `Layer`, `layers`, `layerOf`, `layerSummary`, `setLayer`.
- `src/features/scenes/layers.test.ts`: cobertura das funções puras.
- `src/editor/Inspector.tsx`: seção de camadas.
- `src/App.tsx`: `changeLayer` e `movableSelection`.

## Impacto
Trabalho em camadas: esconde a natureza, ajusta as construções, libera tudo. Também evita seleção acidental de peças travadas durante o posicionamento.

## Como validar
1. Abrir a seção de camadas: cada linha mostra total, ocultas e travadas.
2. Ocultar `Natureza`: as árvores somem da cena e o contador acompanha.
3. Travar `Construções`: tentar arrastar uma parede — nada acontece; `Delete` também não remove.
4. Recarregar: o estado das camadas veio junto com o mapa.
5. `npm test` cobre `layers.test.ts`.

## Próximos passos
- Camada por grupo, para separar "Taverna" de "Cidade" no mesmo mapa.

## Commit / PR
PR [#76](https://github.com/ZedroDacunha/Tabletop-RPG/pull/76).

## Notas relacionadas
- [[MEL-006 - Grupos de peças nomeados]]
- [[MEL-001 - Ambiência e acervo de 32 peças]]

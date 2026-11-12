---
id: MEL-018
titulo: Busca e ordenação em Meus mapas
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: biblioteca de mapas
arquivos-afetados: ['src/features/projects/library.ts', 'src/features/projects/library.test.ts', 'src/App.tsx', 'src/styles.css']
tags: [melhoria, biblioteca, busca, ordenacao]
relacionados: [MEL-009, MEL-013]
---
# MEL-018 — Busca e ordenação em Meus mapas

## Resumo
A janela `Meus mapas` ganhou campo de busca (sem diferenciar acento nem maiúsculas), seletor de ordem (`Mais recentes`, `Nome (A–Z)`, `Tamanho do mapa`) e contador `N de M mapas`.

## Motivação
Com duplicação disponível ([[MEL-013 - Duplicar mapa]]) a lista enche rápido. Rolar cartões procurando "Ruína do portão" entre doze cópias não escala.

## Como era antes
- Lista sempre em ordem de atualização, sem busca.
- Nenhuma indicação de quantos mapas existem.

## Como ficou agora
- `filterProjects(list, query)` normaliza com `NFD`, remove os acentos (`\u0300-\u036f`) e compara em minúsculas (`toLocaleLowerCase('pt-BR')`) — "ruina" acha `Ruína do portão`.
- Query vazia devolve a lista original (sem cópia), então não há custo quando ninguém está buscando.
- `sortProjects(list, mode)` nunca muta: sempre devolve array novo.
  - `recentes`: `updatedAt` decrescente.
  - `nome`: `localeCompare('pt-BR', {sensitivity: 'base'})`, então "Árvore" cai junto de "arvore".
  - `tamanho`: `size` decrescente, com nome como desempate (duas cópias do mesmo tamanho não trocam de lugar a cada render).
- Interface: campo `Buscar por nome…` com botão de limpar, `<select>` de ordenação, contador com `role="status"` e estado vazio próprio quando a busca não acha nada.
- O cartão mostra `peças · metros · quando`, para o tamanho ser visível sem abrir o mapa.
- O filtro e a ordem sobrevivem à troca de ordem (buscar, depois ordenar, mantém o recorte).

## O que foi feito
1. `MapSort`, `MAP_SORTS`, `filterProjects` e `sortProjects` em `src/features/projects/library.ts`, junto de `summarise`/`timeAgo`.
2. `plain(value)` centraliza a normalização de acento/caixa, usada só na busca (a ordenação usa `localeCompare` com `sensitivity: 'base'`).
3. `mapsQuery`/`mapsSort`/`shownMaps` em `src/App.tsx`: um `useMemo`/derivação por cima de `maps`, sem tocar no banco.
4. `.map-tools`, `.map-search`, `.map-sort` e `.map-count` em `styles.css`, com a mesma linguagem dos outros campos.
5. Testes de unidade: busca sem acento, busca por trecho do nome, lista original com query vazia, as três ordens, desempate por nome e não mutação do array de entrada.

## Decisões e alternativas descartadas
- **Busca com `includes` cru**: "ruina" não achava "Ruína"; normalizar resolve.
- **Ordenar dentro do IndexedDB**: exigiria índice por nome e por tamanho, e o filtro de acento continuaria no cliente; com dezenas de mapas, ordenar em memória é instantâneo.
- **`sort` no lugar**: mutaria a lista vinda do banco; a cópia (`[...list].sort`) evita efeito colateral silencioso.
- **Busca também por conteúdo (peças)**: custaria carregar todos os mapas; o resumo só traz nome, tamanho, data e pontos.

## Arquivos alterados
- `src/features/projects/library.ts`: `MapSort`, `MAP_SORTS`, `plain`, `filterProjects`, `sortProjects`.
- `src/features/projects/library.test.ts`: casos de busca e ordenação.
- `src/App.tsx`: `mapsQuery`, `mapsSort`, `shownMaps`, campo de busca, seletor, contador e estado vazio.
- `src/styles.css`: `.map-tools`, `.map-search`, `.map-sort`, `.map-count`.

## Impacto
Achar e comparar mapas virou imediato. Junto da duplicação, permite trabalhar com uma lista grande sem se perder. Suíte com **40 testes** verdes e verificação de navegador com **17 checagens**.

## Como validar
1. Criar três mapas (`Bosque`, `Ruína do portão`, `acampamento`) e abrir `Meus mapas`: contador `3 de 3 mapas`.
2. Buscar `ruina`: aparece só `Ruína do portão`, contador `1 de 3`.
3. Buscar `acamp`: aparece `acampamento`.
4. Limpar a busca ou apertar `Esc`: volta a lista completa.
5. Ordenar por `Tamanho do mapa`: 50 m, 30 m, 20 m, com o tamanho visível em cada cartão.
6. Buscar e depois trocar a ordem: o recorte continua aplicado.
7. `npm test`: 40/40.

## Próximos passos
- Renomear mapa direto no cartão.
- Filtro por data (últimos 7 dias) ou por peças.

## Commit / PR
PR [#86](https://github.com/ZedroDacunha/Tabletop-RPG/pull/86).

## Notas relacionadas
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[MEL-013 - Duplicar mapa]]

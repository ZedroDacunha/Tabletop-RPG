---
id: MEL-028
titulo: Filtro por período em Meus mapas
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: biblioteca de mapas
arquivos-afetados: ['src/features/projects/library.ts', 'src/features/projects/library.test.ts', 'src/App.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, biblioteca, filtro, ux]
relacionados: [MEL-009, MEL-018, MEL-013, MEL-026]
---
# MEL-028 — Filtro por período em Meus mapas

## Resumo
A biblioteca de mapas ganhou filtro por período — `Qualquer data`, `Últimos 7 dias` e `Últimos 30 dias` — que se combina com a busca por nome e com a ordenação por recentes, nome ou tamanho.

## Motivação
Com duplicação e renomeação ([[MEL-013 - Duplicar mapa]] e [[MEL-026 - Renomear mapa direto no cartão]]), a lista acumula mapas antigos que já não interessam. Buscar por nome só resolve quando se sabe o nome: faltava recortar por "o que mexi nesta semana".

## Como era antes
- Busca por nome ([[MEL-018 - Busca e ordenação em Meus mapas]]) e ordenação, sem recorte por data.
- Para achar o que foi editado recentemente, era contar os "há X dias" dos cartões na mão.
- Estado vazio só falava de busca.

## Como ficou agora
- `<select aria-label="Período dos mapas">` com `Qualquer data` (padrão), `Últimos 7 dias` e `Últimos 30 dias`.
- O período se combina com busca e ordenação: `período → busca → ordem`, nessa composição.
- Contador segue fiel: `1 de 3 mapas`, mesmo com os dois filtros ligados.
- Período em segundos de idade: usa `updatedAt` do resumo, que já é o que o cartão mostra.
- Estado vazio reescrito: "Nenhum mapa com esses filtros. Limpe a busca ou amplie o período."
- Layout: a busca ocupa a primeira linha do painel de filtros e os dois selects dividem a segunda, então nada fica espremido nos 460 px do modal.

## O que foi feito
1. `MapPeriod` (`'todos' | '7' | '30'`), `MAP_PERIODS` (rótulos) e `withinPeriod(list, period, now = Date.now())` em `src/features/projects/library.ts` — função pura, sem filtrar no banco.
2. Limite **inclusivo** (`t >= now - dias*24h`) e descarte de data inválida — um mapa com `updatedAt` quebrado não aparece como "recente".
3. `mapsPeriod` em `src/App.tsx` e a composição `sortProjects(withinPeriod(filterProjects(maps, mapsQuery), mapsPeriod), mapsSort)`.
4. `<select>` ao lado do de ordenação, com `aria-label="Período dos mapas"`.
5. CSS: `.map-tools` com `flex-wrap`, `.map-search` em `flex:1 1 100%`, `.map-sort`/`.map-period` com `flex:1 1 0` e sem largura fixa.
6. Teste de unidade cobrindo 7 dias (incluindo o limite exato), 30 dias (excluindo 45 dias), lista original devolvida igual em `todos` e data inválida.

## Decisões e alternativas descartadas
- **Filtrar por `createdAt`**: o cartão mostra "atualizado há…", então filtrar por outra data confundiria.
- **Opções "Hoje"/"Este ano"**: 7 e 30 dias cobrem a preparação de sessão; mais opções só alongam o select.
- **Índice no IndexedDB por data**: a lista já vem inteira do `index` (dezenas de resumos), filtrar em memória é instantâneo e mantém a regra testável.
- **Esconder o select quando há poucos mapas**: filtro que aparece e desaparece atrapalha mais do que ajuda.

## Arquivos alterados
- `src/features/projects/library.ts`: `MapPeriod`, `MAP_PERIODS`, `withinPeriod`.
- `src/features/projects/library.test.ts`: teste do período e do limite.
- `src/App.tsx`: `mapsPeriod`, composição dos filtros e o select.
- `src/styles.css`: `.map-tools`, `.map-search`, `.map-sort`, `.map-period`.
- `README.md`: bullet de Meus mapas e roadmap.

## Impacto
A biblioteca passa a responder "o que trabalhei recentemente" sem contar cartões. Com busca, ordenação, período, duplicar e renomear, a janela cobre o ciclo inteiro de organização de mapas.

## Como validar
1. Criar três mapas e envelhecer dois (10 e 45 dias) pelo IndexedDB, como no teste automatizado.
2. `Qualquer data`: `3 de 3 mapas`.
3. `Últimos 7 dias`: só o recente, `1 de 3 mapas`.
4. `Últimos 30 dias`: recente + 10 dias, `2 de 3 mapas`.
5. Com período ligado, buscar `ruina`: só o mapa que casa.
6. Trocar a ordem para `Tamanho do mapa` com o período ligado: a ordem continua certa.
7. `npm test`: 42/42.

## Próximos passos
- Legenda por vista no modo apresentação (novo item 2 do roadmap).
- Barra do viewport compacta em telas ≤650 px.

## Commit / PR
PR [#91](https://github.com/ZedroDacunha/Tabletop-RPG/pull/91).

## Notas relacionadas
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[MEL-018 - Busca e ordenação em Meus mapas]]
- [[MEL-026 - Renomear mapa direto no cartão]]

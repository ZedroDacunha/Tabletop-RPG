---
id: MEL-032
titulo: Biblioteca com cabeçalho único e busca fixa
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / biblioteca
arquivos-afetados: ['src/App.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, interface, biblioteca, acessibilidade]
relacionados: [MEL-016, MEL-031]
---
# MEL-032 — Biblioteca com cabeçalho único e busca fixa

## Resumo
O painel da biblioteca passou a ter um cabeçalho só — abas com contador e busca presa abaixo delas — em vez de três blocos empilhados antes da primeira peça. Abas, busca e filtros ficaram fora da área rolável; só a lista rola.

## Motivação
A biblioteca é o painel mais usado do editor, e o topo dela gastava altura com três faixas: abas, uma chamada de marketing que repetia o nome da aba (`Tudo para o seu mundo`, `Objetos do mapa`, `Cenários prontos`) e a busca. Pior: a busca rolava junto com a lista, então quem procurava uma peça no fim do acervo precisava voltar ao topo para trocar o termo.

## Como era antes
- Tabs (49 px) + `.library-intro` (~70 px) + busca (35 px) = cerca de 154 px antes da primeira peça.
- A busca ficava entre os blocos fixos, mas os filtros de `Categoria`/`Tipo` viviam dentro da aba de peças, junto da lista.
- Só a aba `Cena` mostrava contagem; `Biblioteca` e `Cenários` não.
- Notas decorativas no fim de cada lista (`Peças leves, prontas para criar.`, `Depois de inserir, mova as peças como quiser.`).
- Contador de cenários no plural fixo: `1 cenas`.

## Como ficou agora
- `.library-head` único (103 px): abas + busca, com borda inferior separando do conteúdo.
- `Biblioteca 64 · Cena 67 · Cenários 5`: contador em cada aba, destacado quando a aba está ativa.
- Abas como `role="tab"` com `aria-selected`, dentro de um `role="tablist"` com nome acessível.
- Filtros `Categoria` / `Tipo` colados ao cabeçalho e presentes **só** na aba de peças.
- A lista tem 12 px de respiro no topo; rolar o acervo não move abas, busca nem filtros.
- Em ≤650 px os contadores das abas somem para caber, mas a busca continua inteira.
- `1 cena` no singular; notas decorativas removidas.

## O que foi feito
1. `src/App.tsx`: `.library-head` envolve `.library-tabs` e `.search-field`; `.library-intro` saiu; as três abas viraram `role="tab"` com `<b className="tab-count">`; os filtros de peças foram extraídos do fragmento da aba e agora renderizam entre o cabeçalho e a lista.
2. `src/styles.css`: `.library-head` (flex, borda inferior), `.library-tabs` sem borda própria e com 46 px, estilo de `.tab-count` (e variação ativa), `.asset-filters` sem borda/margem próprias, `.library-scroll` com 12 px no topo; as 9 regras de `.library-intro` foram removidas.
3. Contadores: `catalog.length + project.assets.length` (peças), `project.objects.length` (cena) e `presets.length` (cenários) — os mesmos números que o select de categoria e o rodapé já usavam.
4. O contador da lista continua sendo o resultado filtrado; o da aba continua sendo o total.

## Decisões e alternativas descartadas
- **Manter a chamada de marketing e só compactá-la**: ela repetia o nome da aba e não dizia nada que a lista não dissesse.
- **Deixar a busca rolando com a lista**: é justamente o que obrigava a voltar ao topo.
- **Um contador só no título da lista**: não responde "quantas peças eu tenho" sem abrir a aba.
- **Contador refletindo a busca**: o total do mapa é a informação estável; o resultado filtrado já aparece no rótulo da lista (`64 peças`).
- **Filtros em todas as abas**: `Categoria`/`Tipo` só existem para peças.

## Arquivos alterados
- `src/App.tsx`: cabeçalho único, abas com contador e `role="tab"`, filtros reposicionados, plural de cenas.
- `src/styles.css`: `.library-head`, `.tab-count`, ajustes de filtros e de rolagem, remoção de `.library-intro`.
- `README.md`: bullet da biblioteca.

## Impacto
Cerca de 50 px a mais de lista visível e a busca sempre ao alcance. As três abas passaram a informar o tamanho do que guardam antes do clique.

## Como validar
1. Abrir a biblioteca: `Biblioteca 64 · Cena 67 · Cenários 5` e a busca logo abaixo, sem texto de apresentação.
2. Rolar até o fim do acervo: abas, busca e filtros continuam no lugar.
3. Trocar para `Cenários`: a busca passa a ser de cenários e os filtros de peças somem.
4. Buscar `acamp` em `Cenários`: sobra 1 cena e o rótulo diz `1 cena`.
5. Ir para `Cena` e buscar `Árvore 1`: a lista filtra e o contador da aba continua `67`.
6. Estreitar para 600 px: abas sem contador, busca e lista funcionando.

## Próximos passos
- Legenda por vista no modo apresentação (item 2 do roadmap).
- Exportar um trecho salvo como arquivo direto da lista de trechos.

## Commit / PR
PR [#97](https://github.com/ZedroDacunha/Tabletop-RPG/pull/97).

## Notas relacionadas
- [[MEL-016 - Painel da biblioteca separado por função]]
- [[MEL-031 - Tela de edicao organizada com barra docada]]
- [[MEL-028 - Filtro por período em Meus mapas]]

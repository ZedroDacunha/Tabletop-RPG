---
id: MEL-009
titulo: Meus mapas, biblioteca com miniaturas e troca rápida
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: persistência / biblioteca de mapas
arquivos-afetados: ['src/features/projects/storage.ts', 'src/features/projects/library.ts', 'src/editor/MapThumb.tsx', 'src/App.tsx', 'src/styles.css']
tags: [melhoria, biblioteca, indexeddb, persistencia]
relacionados: [BUG-004, MEL-013, MEL-018]
---
# MEL-009 — Meus mapas, biblioteca com miniaturas e troca rápida

## Resumo
"Meus mapas" lista todos os mapas guardados no navegador com miniatura, tamanho e "atualizado há X", e permite abrir outro sem recarregar a página.

## Motivação
Antes havia um único mapa no `localStorage`. Quem tem três cenas de campanha precisava exportar e importar arquivos para alternar entre elas.

## Como era antes
- Um único mapa, salvo num espaço fixo do navegador; abrir outro exigia importar um `.tabletop`.
- Nenhuma visão geral do que estava salvo.

## Como ficou agora
- IndexedDB com três lojas: `projects` (o mapa inteiro), `index` (resumo para a lista) e `meta` (último mapa aberto em `meta.last`).
- `summarise(project)` gera o resumo com até `MAX_DOTS` (150) pontos `{x, z, kind}` — o suficiente para desenhar a miniatura sem carregar o mapa.
- `MapThumb` desenha a planta em SVG a partir dos pontos, na cor do tipo da peça.
- `timeAgo` escreve "agora mesmo", "há 3 min", "há 2 h", "ontem", datas antigas.
- A janela `Meus mapas` mostra cartão por mapa (miniatura, nome, `peças · metros · quando`), com abrir, duplicar e excluir.
- Abrir um mapa atualiza `meta.last`, então recarregar a página volta ao último mapa usado.

## O que foi feito
1. `src/features/projects/storage.ts`: `listProjects`, `loadProject(id?)`, `saveProject`, `deleteProject`, com transações que escrevem `projects`, `index` e `meta` juntos.
2. `library.ts`: `ProjectSummary`, `MAX_DOTS`, `summarise`, `newestFirst`, `timeAgo` e testes de unidade.
3. `MapThumb` em SVG (sem canvas), para miniatura leve e nítida em qualquer densidade de tela.
4. `openMaps`/`openMap`/`removeMap` em `src/App.tsx`, sempre com `await flushSave()` antes de trocar de contexto — a correção que virou [[BUG-004 - Troca de mapa descartava alterações pendentes]].
5. Cartões e contador em `styles.css`, com a mesma linguagem do resto do editor.

## Decisões e alternativas descartadas
- **Miniatura em PNG (canvas)**: pesa no IndexedDB e fica borrada em telas 2x; o SVG a partir dos pontos custa poucos KB e é vetorial.
- **`localStorage` com várias chaves**: sem transação, um erro no meio deixava a lista inconsistente; o IndexedDB resolve atomicamente.
- **Lista com todos os pontos**: limitada a 150, senão um mapa de 800 peças geraria um resumo maior que o necessário.

## Arquivos alterados
- `src/features/projects/storage.ts`: banco, listar/carregar/salvar/excluir.
- `src/features/projects/library.ts`: `ProjectSummary`, `MAX_DOTS`, `summarise`, `newestFirst`, `timeAgo`.
- `src/features/projects/library.test.ts`: testes do resumo e da ordenação por data.
- `src/editor/MapThumb.tsx`: miniatura em SVG.
- `src/App.tsx`: `openMaps`, `openMap`, `removeMap`, `flushSave`.
- `src/styles.css`: cartões da biblioteca.

## Impacto
Vários mapas convivem no navegador, com troca em um clique e memória do último aberto. Foi a base de duplicar mapa ([[MEL-013 - Duplicar mapa]]) e da busca/ordenação ([[MEL-018 - Busca e ordenação em Meus mapas]]).

## Como validar
1. Criar dois mapas e abrir `Meus mapas`: dois cartões, cada um com miniatura e tamanho.
2. Abrir o segundo e recarregar: volta no segundo.
3. Excluir um mapa: o cartão desaparece e o outro continua abrindo.
4. Exportar, limpar o navegador, importar: o mapa volta inteiro.

## Próximos passos
- Renomear o mapa direto no cartão (ver roadmap do README).

## Commit / PR
PR [#77](https://github.com/ZedroDacunha/Tabletop-RPG/pull/77).

## Notas relacionadas
- [[BUG-004 - Troca de mapa descartava alterações pendentes]]
- [[MEL-013 - Duplicar mapa]]
- [[MEL-018 - Busca e ordenação em Meus mapas]]

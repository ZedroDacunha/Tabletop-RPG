---
id: MEL-013
titulo: Duplicar mapa
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: biblioteca de mapas
arquivos-afetados: ['src/features/projects/library.ts', 'src/features/projects/library.test.ts', 'src/features/projects/storage.ts', 'src/App.tsx']
tags: [melhoria, biblioteca, copia]
relacionados: [MEL-009, MEL-018]
---
# MEL-013 — Duplicar mapa

## Resumo
Um botão em cada cartão de `Meus mapas` cria uma cópia do mapa com nome livre — `Vila (cópia)`, `Vila (cópia 2)` — sem abrir o original nem mexer no "último mapa aberto".

## Motivação
Testar uma mudança sem estragar a versão boa é rotina em preparação de sessão. Sem duplicar, o caminho era exportar, renomear arquivo e importar.

## Como era antes
- Só exportar/importar arquivo, ou criar um mapa vazio e recomeçar.

## Como ficou agora
- `copyName(name, taken)` gera nome livre: tira sufixo `(cópia…)` do original, tenta `(cópia)`, depois `(cópia 2)`, `(cópia 3)`… respeitando `NAME_MAX` (80) e comparando sem diferenciar maiúsculas/acentos de caixa (`toLocaleLowerCase('pt-BR')`).
- `duplicateProject(id)` copia o registro com `id` novo, `updatedAt` novo e nome livre, gravando nas três lojas (`projects`, `index`, `meta`).
- A cópia **não** vira o mapa aberto: `meta.last` é preservado, então quem estava em outro mapa continua nele.
- O cartão atualiza na hora, sem recarregar a lista inteira do zero.

## O que foi feito
1. `copyName` e `NAME_MAX` em `src/features/projects/library.ts`, com testes.
2. `duplicateProject(id)` em `src/features/projects/storage.ts`: carrega, gera novo `Project` e grava; devolve `null` se o original não existe.
3. `duplicateMap` em `src/App.tsx`: chama o storage, atualiza a lista e avisa por notificação.
4. Botão `Duplicar` no cartão, com `aria-label` incluindo o nome do mapa.

## Decisões e alternativas descartadas
- **Duplicar e abrir a cópia**: surpreende quem só queria um backup; a cópia é criada e a lista ganha o cartão.
- **`(2)` como sufixo**: confunde com peças e versões; `(cópia 2)` é autoexplicativo.
- **Nome com timestamp**: feio na lista e sem relação com o que o usuário reconhece.

## Arquivos alterados
- `src/features/projects/library.ts`: `NAME_MAX`, `copyName`.
- `src/features/projects/library.test.ts`: primeiro nome livre, sufixos seguidos, normalização de caixa e limite de tamanho.
- `src/features/projects/storage.ts`: `duplicateProject`.
- `src/App.tsx`: `duplicateMap` e o botão do cartão.

## Impacto
Versionar um mapa ficou barato: duplicar, mexer na cópia, comparar. Junto com a busca de [[MEL-018 - Busca e ordenação em Meus mapas]], a lista continua navegável mesmo com muitas cópias.

## Como validar
1. Duplicar um mapa: aparece `Nome (cópia)` com a miniatura igual.
2. Duplicar de novo: `Nome (cópia 2)`.
3. Duplicar a cópia: o nome não vira `Nome (cópia) (cópia)`, e sim o próximo livre.
4. Duplicar e recarregar: o mapa aberto continua sendo o anterior.
5. `npm test` cobre `copyName`.

## Próximos passos
- Renomear mapa direto no cartão (ver roadmap do README).

## Commit / PR
PR [#81](https://github.com/ZedroDacunha/Tabletop-RPG/pull/81).

## Notas relacionadas
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[MEL-018 - Busca e ordenação em Meus mapas]]

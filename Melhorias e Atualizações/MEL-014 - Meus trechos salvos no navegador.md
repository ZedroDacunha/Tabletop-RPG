---
id: MEL-014
titulo: Meus trechos salvos no navegador
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: persistência / trechos
arquivos-afetados: ['src/features/projects/snippets.ts', 'src/features/projects/snippets.test.ts', 'src/features/projects/storage.ts', 'src/App.tsx', 'src/styles.css']
tags: [melhoria, trechos, biblioteca, indexeddb]
relacionados: [MEL-011, MEL-009]
---
# MEL-014 — Meus trechos salvos no navegador

## Resumo
Trechos podem ficar guardados no navegador, sem passar por arquivo: salvar a seleção como `Trecho 1`, colar em outro mapa, renomear e excluir — tudo por uma janela `Meus trechos`.

## Motivação
O arquivo `.trecho` ([[MEL-011 - Exportar e importar trechos entre mapas]]) resolve troca entre pessoas, mas é cerimônia demais para reusar uma taverna dentro da mesma máquina.

## Como era antes
- Exportar para arquivo e importar de volta a cada reuso.
- Nenhuma lista de composições favoritas.

## Como ficou agora
- Banco na versão 3, com duas lojas novas: `snippets` (o trecho completo) e `snippetIndex` (resumo para a lista).
- `storeClip` salva a seleção atual; o nome vem de `snippetName(taken)`, que devolve o primeiro `Trecho N` livre — sem colidir com nomes existentes.
- Janela `Meus trechos` com miniatura (mesmo `MapThumb`), nome editável no lugar, contagem de peças, mapa de origem e "atualizado há".
- `Colar` insere no mapa atual em área livre, com ids e grupos remapeados; `Excluir` remove das duas lojas na mesma transação.
- Limite de `MAX_SNIPPETS` (20) trechos e nome de até `SNIPPET_NAME_MAX` (60), normalizado por `cleanSnippetName` (espaços colapsados).

## O que foi feito
1. `src/features/projects/snippets.ts`: `SnippetSummary`, `MAX_SNIPPETS`, `SNIPPET_NAME_MAX`, `SNIPPET_PREFIX`, `summariseClip`, `snippetName`, `cleanSnippetName`.
2. `storage.ts`: `listSnippets`, `saveSnippet`, `openSnippet`, `renameSnippet`, `deleteSnippet`, todas gravando `snippets` + `snippetIndex` na mesma transação.
3. `summariseClip` guarda até `MAX_DOTS` pontos visíveis, arredondados a 2 casas, para a miniatura.
4. `openTrechos`/`storeClip`/`pasteSnippet`/`renameTrecho`/`removeTrecho` em `src/App.tsx`, com o `insertClip` reaproveitado do arquivo.
5. Linhas da janela com campo de renomear que confirma no `Enter`/`blur` e volta ao valor antigo se ficar vazio.

## Decisões e alternativas descartadas
- **Só em memória**: perde tudo ao recarregar; o IndexedDB já existia para os mapas.
- **Guardar o resumo junto do trecho na mesma loja**: a lista carregaria todos os trechos para desenhar uma linha; separar `snippetIndex` deixa a janela leve.
- **Salvar automático de tudo que é copiado**: poluiria a lista; salvar é ação explícita.

## Arquivos alterados
- `src/features/projects/snippets.ts`: `SnippetSummary`, `MAX_SNIPPETS`, `SNIPPET_NAME_MAX`, `SNIPPET_PREFIX`, `summariseClip`, `snippetName`, `cleanSnippetName`.
- `src/features/projects/snippets.test.ts`: nomes livres, normalização e resumo.
- `src/features/projects/storage.ts`: lojas `snippets`/`snippetIndex` e as cinco funções.
- `src/App.tsx`: `openTrechos`, `storeClip`, `pasteSnippet`, `renameTrecho`, `removeTrecho`.
- `src/styles.css`: linha de trecho e campo de nome.

## Impacto
Reuso imediato de composições dentro do navegador. Complementa o arquivo: arquivo para compartilhar, banco para trabalhar.

## Como validar
1. Selecionar peças e salvar: aparece `Trecho 1` na janela.
2. Salvar de novo: `Trecho 2`.
3. Colar em outro mapa: as peças entram em área livre, com grupos.
4. Renomear, recarregar: o nome novo está lá.
5. Excluir: some da lista e não volta ao recarregar.
6. `npm test` cobre `snippets.test.ts`.

## Próximos passos
- Exportar um trecho salvo como arquivo direto da lista.

## Commit / PR
PR [#82](https://github.com/ZedroDacunha/Tabletop-RPG/pull/82).

## Notas relacionadas
- [[MEL-011 - Exportar e importar trechos entre mapas]]
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]

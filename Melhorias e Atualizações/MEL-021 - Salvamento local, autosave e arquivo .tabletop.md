---
id: MEL-021
titulo: Salvamento local, autosave e arquivo .tabletop
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: persistência
arquivos-afetados: ['src/features/projects/storage.ts', 'src/features/projects/project.ts', 'src/App.tsx']
tags: [melhoria, persistencia, indexeddb, autosave]
relacionados: [MEL-019, MEL-009, BUG-004]
---
# MEL-021 — Salvamento local, autosave e arquivo .tabletop

## Resumo
O mapa se salva sozinho no navegador (IndexedDB) enquanto você edita, e pode ser exportado/importado como arquivo `.tabletop` com modelos incorporados.

## Motivação
Perder sessão de preparação por fechar a aba é inaceitável. E o mapa precisa sair do navegador para ser compartilhado.

## Como era antes
- Nada: não existia persistência.

## Como ficou agora
- Banco `tabletop-rpg` (IndexedDB) com as lojas `projects` (mapa), `index` (resumo) e `meta` (último aberto em `meta.last`).
- Autosave com atraso de **850 ms** e fila de gravação (`queue.current`): grava sempre o estado mais recente, um por vez, sem atropelo.
- Controle de revisão (`revision.current`): se uma edição chega durante a gravação, o estado não é marcado como "salvo".
- Estado no cabeçalho: `Salvo no navegador`, `Alterações pendentes`, `Salvando…`, `Falha ao salvar`.
- Aviso nativo (`beforeunload`) quando há alteração pendente e a aba é fechada.
- `Ctrl`/`⌘` + `S` força o salvamento e confirma com notificação.
- `exportProject` baixa `<nome>.tabletop` (JSON com `assets` embutidos); importar projeto valida o arquivo e recusa acima de **100 MB** (`MAX_PROJECT_BYTES`).
- `validateProject` é uma alfândega completa: `schemaVersion: 1`, nomes até 120 caracteres, até **1.500 objetos** e **80 modelos**, ids únicos, `kind` conhecido, vetores finitos, cores válidas, `settings` na faixa (mapa de 10 a 100 m), grupos, vistas e câmera.
- Migração silenciosa de `projects/'current'` (formato de uma cópia só) para o formato com `meta.last`.

## O que foi feito
1. `database()` abre o banco na versão atual e cria as lojas que faltarem (`onupgradeneeded`), sem perder dados de versões anteriores.
2. `readKey`/`write` centralizam transações; `store(db, project, makeCurrent)` grava `projects` + `index` (+ `meta` quando é o mapa aberto).
3. `loadProject(id?)` resolve `meta.last` quando não recebe id e migra o registro legado.
4. `persist` em `src/App.tsx`: snapshot do projeto, revisão, fila e tratamento de erro com mensagem que sugere exportar uma cópia.
5. Efeito de autosave (`setTimeout` de 850 ms) reagendado a cada mudança; `flushSave` para gravar na hora (correção do [[BUG-004 - Troca de mapa descartava alterações pendentes]]).
6. `validateProject` com mensagens em português para cada recusa — é o mesmo validador usado ao abrir arquivo, ao carregar do banco e ao validar trechos.

## Decisões e alternativas descartadas
- **`localStorage`**: limite de ~5 MB e sem transação; com modelos embutidos, estouraria no primeiro.
- **Semear o arquivo salvo com o mapa de exemplo**: descartado — o primeiro uso deve abrir vazio, com convite.
- **Autosave imediato a cada mudança**: gravaria o banco a cada pixel de arraste; o atraso de 850 ms junta a rajada em uma gravação.
- **Confiar no arquivo importado**: nunca; `validateProject` recusa o que não bate com o esquema.

## Arquivos alterados
- `src/features/projects/storage.ts`: banco, `listProjects`, `loadProject`, `saveProject`, `deleteProject`, `exportProject`, `downloadFile`.
- `src/features/projects/project.ts`: `validateProject`, `MAX_PROJECT_BYTES`.
- `src/App.tsx`: `persist`, `flushSave`, efeito de autosave, `beforeunload`, `openProject`.

## Impacto
O trabalho nunca se perde e o mapa vira arquivo. Essa base foi reusada por Meus mapas ([[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]) e pelos trechos ([[MEL-011 - Exportar e importar trechos entre mapas]]).

## Como validar
1. Mover uma peça e esperar o selo virar `Salvo no navegador`; recarregar: a peça está lá.
2. Editar e fechar a aba: o navegador pede confirmação.
3. `Ctrl+S`: notificação de mapa salvo.
4. Exportar `.tabletop`, limpar os dados do site, importar: o mapa volta, com modelos.
5. Editar o JSON de um arquivo e trocar um campo: a importação recusa com mensagem específica.

## Próximos passos
- Salvar histórico de versões do mapa (hoje só o estado atual).

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas (persistência incluída).

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[BUG-004 - Troca de mapa descartava alterações pendentes]]

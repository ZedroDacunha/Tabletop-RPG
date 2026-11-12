---
id: MEL-022
titulo: Desfazer e refazer com histórico limitado
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / histórico
arquivos-afetados: ['src/App.tsx']
tags: [melhoria, historico, desfazer]
relacionados: [MEL-019, MEL-021]
---
# MEL-022 — Desfazer e refazer com histórico limitado

## Resumo
`Ctrl`/`⌘` + `Z` desfaz e `Ctrl`/`⌘` + `Shift` + `Z` refaz, com até **40 estados** por mapa; cada ação da interface vira um passo, e o histórico é zera em cada mapa aberto.

## Motivação
Editar mapa é tentativa e erro: mover a árvore, ver que ficou ruim, voltar. Sem desfazer, todo experimento custa reselecionar e reposicionar.

## Como era antes
- Nenhum histórico: o único jeito de voltar era refazer a ação manualmente.

## Como ficou agora
- Duas pilhas em `useRef` (`past.current` e `future.current`), guardando o projeto inteiro — objetos, grupos, vistas, câmera e camadas, tudo junto.
- `commit(change)` empilha o estado anterior com `slice(-39)`, então a memória fica em 40 passos e não cresce sem limite.
- Nova ação depois de desfazer **descarta** a pilha de refazer (comportamento esperado de editor).
- `undo`/`redo` limpam seleção e posicionamento pendente, para o estado restaurado não apontar para peça que não existe mais.
- `Ctrl`/`⌘` + `Z` e `Ctrl`/`⌘` + `Shift` + `Z`, mais os botões do viewport (desabilitados quando a pilha está vazia, com dica `Desfazer (Ctrl+Z)`).
- Ações compostas (cenário, trecho, agrupar, alinhar) entram como **um** passo.

## O que foi feito
1. `commit` em `src/App.tsx`: aplica a mudança, empilha o anterior, limpa o futuro, marca o mapa como alterado e atualiza `updatedAt`.
2. `undo`/`redo` trocam o projeto inteiro, sem tentar diferenciar campos — menos código e nenhuma chance de estado híbrido.
3. `markDirty` marca a revisão, para o autosave de [[MEL-021 - Salvamento local, autosave e arquivo .tabletop]] gravar depois de desfazer também.
4. Botões `Desfazer`/`Refazer` no viewport com `disabled` ligado ao tamanho das pilhas.
5. Histórico em memória, não no arquivo: abrir outro mapa começa um histórico novo.

## Decisões e alternativas descartadas
- **Comandos com `do`/`undo` (padrão command)**: exigiria uma classe por ação e erra fácil em ações compostas; guardar snapshots do projeto é simples e cabe folgado com 40 passos.
- **Histórico junto do `.tabletop`**: inflaria o arquivo e confundiria exportação; o histórico é de sessão.
- **Histórico infinito**: memória cresceria com modelos embutidos; 40 passos cobrem o uso real.

## Arquivos alterados
- `src/App.tsx`: `commit`, `undo`, `redo`, pilhas `past`/`future`, atalhos e botões.

## Impacto
Experimentar ficou barato — e é o que torna seguros os atalhos, o gizmo de grupo e as ações em lote entregues depois.

## Como validar
1. Mover uma peça e `Ctrl+Z`: volta à posição anterior.
2. `Ctrl+Shift+Z`: refaz.
3. Desfazer e fazer outra coisa: o refazer não volta mais.
4. Inserir um cenário e desfazer: sai tudo de uma vez.
5. Abrir outro mapa: os botões de desfazer começam desabilitados.

## Próximos passos
- Histórico de versões por mapa (snapshots nomeados), que hoje não existe.

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas (histórico incluído).

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]
- [[MEL-021 - Salvamento local, autosave e arquivo .tabletop]]

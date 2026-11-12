---
id: MEL-006
titulo: Grupos de peças nomeados
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / organização
arquivos-afetados: ['src/features/projects/project.ts', 'src/App.tsx', 'src/editor/Inspector.tsx', 'src/styles.css']
tags: [melhoria, grupos, organizacao]
relacionados: [MEL-005, MEL-008]
---
# MEL-006 — Grupos de peças nomeados

## Resumo
`Ctrl`/`⌘` + `G` agrupa a seleção num grupo nomeado; o grupo aparece como pasta recolhível na aba `Cena` e pode ser selecionado, renomeado e transformado como um todo.

## Motivação
Uma taverna tem 40 peças. Sem grupos, a lista da cena é uma parede de nomes e mover a taverna exige reselecionar tudo a cada vez.

## Como era antes
- Lista plana de peças na aba `Cena`, ordenada por criação.
- Nenhuma noção de conjunto persistida no arquivo do mapa.

## Como ficou agora
- `makeGroup(name)` cria o grupo com nome limitado a `GROUP_NAME_MAX` (60) e padrão `Grupo`.
- `assignGroup(objects, ids, groupId)` liga/desliga peças de um grupo; `Ctrl+Shift+G` desagrupa a seleção.
- Pastas recolhíveis na aba `Cena`, com contagem de peças; clicar no nome do grupo seleciona todas as peças dele.
- `renameGroup` renomeia pelo próprio cabeçalho da pasta.
- `pruneGroups` remove grupos vazios quando as peças saem, para o arquivo não acumular lixo.
- Grupos entram no projeto (`groups`) e portanto são salvos, exportados e copiados entre mapas.

## O que foi feito
1. `Group` e `groupId` no modelo (`src/features/projects/project.ts`), com `groups` opcional para não quebrar mapas antigos (`validateProject` preenche quando falta).
2. `withGroups(project, groups)` para manter o estado coerente em um passo só.
3. `groupSelection`, `ungroupSelection`, `renameGroup`, `selectGroup` em `src/App.tsx`.
4. `GroupName` em `src/editor/Inspector.tsx`: campo de renomear embutido, que confirma no `Enter`/`blur`.
5. Pasta recolhível na lista da cena, com o estado de recolhido só na interface.

## Decisões e alternativas descartadas
- **Hierarquia aninhada (grupo dentro de grupo)**: descartada para esta entrega; um nível resolve o caso real e evita transformação composta confusa.
- **Grupo como peça única no arquivo**: perderia a edição peça por peça; o `groupId` mantém as peças independentes.
- **Nome automático com contador global**: `makeGroup` cai em `Grupo` e o usuário renomeia; contador global sujaria o arquivo com nomes irrelevantes.

## Arquivos alterados
- `src/features/projects/project.ts`: `Group`, `groupId`, `makeGroup`, `assignGroup`, `pruneGroups`, `withGroups`.
- `src/App.tsx`: `groupSelection`, `ungroupSelection`, `renameGroup`, `selectGroup` e atalhos.
- `src/editor/Inspector.tsx`: `GroupName` e a lista em pastas.
- `src/styles.css`: pastas da lista de cena.

## Impacto
Mapas grandes ficaram navegáveis na lista, e transformar um conjunto virou um clique. Os grupos também viajam nos trechos ([[MEL-011 - Exportar e importar trechos entre mapas]]).

## Como validar
1. Selecionar três peças, `Ctrl+G`: aparece a pasta com o grupo.
2. Clicar no nome do grupo: as três peças ficam selecionadas e o gizmo aparece no centro.
3. Renomear o grupo e recarregar a página: o nome persistiu.
4. Excluir todas as peças do grupo: a pasta vazia desaparece.

## Próximos passos
- Camadas por grupo (hoje a camada é derivada do tipo da peça, ver [[MEL-008 - Camadas com ocultar e travar]]).

## Commit / PR
PR [#74](https://github.com/ZedroDacunha/Tabletop-RPG/pull/74).

## Notas relacionadas
- [[MEL-005 - Seleção múltipla de peças]]
- [[MEL-008 - Camadas com ocultar e travar]]

---
id: MEL-026
titulo: Renomear mapa direto no cartão
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: biblioteca de mapas
arquivos-afetados: ['src/features/projects/library.ts', 'src/features/projects/library.test.ts', 'src/features/projects/storage.ts', 'src/App.tsx', 'src/styles.css', 'src/editor/Modal.tsx', 'README.md']
tags: [melhoria, biblioteca, renomear, ux]
relacionados: [MEL-009, MEL-013, MEL-018, BUG-005]
---
# MEL-026 — Renomear mapa direto no cartão

## Resumo
O nome do mapa virou campo editável no próprio cartão de `Meus mapas`: clique, edite, `Enter` confirma e `Esc` descarta. Sem duplicar, sem abrir o mapa e sem passar pelo título do topo.

## Motivação
Era o último item pendente da biblioteca: para trocar "Bosque" por "Bosque Norte" só existia o caminho longo — abrir o mapa, editar o título no cabeçalho e voltar. Quem tem doze cópias de `(cópia)` na lista precisava desse atalho.

## Como era antes
- O nome só mudava pelo título do topo (`input[aria-label="Nome do mapa"]`), o que exigia **abrir** o mapa.
- Alternativa ruim: duplicar e conviver com o nome errado ([[MEL-013 - Duplicar mapa]]).
- Nenhuma pista visual de que o nome do cartão poderia ser editado.

## Como ficou agora
- Clique no nome do cartão abre a edição; `Enter` ou sair do campo confirma, `Esc` descarta.
- Nome vazio volta ao anterior — nunca fica mapa sem nome.
- Espaços repetidos e das pontas somem, acentos ficam; limite de **120 caracteres** (`MAP_NAME_MAX`), o mesmo do `.tabletop` e do título.
- Renomear **não cria cópia** e **não mexe no horário** do mapa, então a lista não se reordena embaixo do mouse (com "Mais recentes" ativo, um rename não joga o cartão para o topo).
- Renomear o mapa **aberto** troca o título do topo na hora e avisa: `Mapa renomeado para "Bosque do Norte".`
- O nome acessível do campo acompanha (`Renomear <nome>`), então leitor de tela anuncia o alvo certo.

## O que foi feito
1. `cleanMapName(name, fallback='Mapa')` + `MAP_NAME_MAX` em `src/features/projects/library.ts`: normaliza espaços, corta em 120, cai no nome anterior quando vazio.
2. `renameProject(id, name)` em `src/features/projects/storage.ts`: lê o mapa, renomeia, grava `projects` + `index` na mesma transação e devolve o `ProjectSummary` novo (sem tocar em `meta.last`, sem alterar `updatedAt`).
3. `renameMap` em `src/App.tsx`: atualiza o cartão na lista, e se o mapa for o aberto usa `markDirty` + `setProject` para o título e o autosave acompanharem.
4. Cartão com `input.map-name` controlado por `key={m.id + m.name}` — quando o nome canônico muda (por exemplo, espaços normalizados), o campo remonta com o valor certo.
5. `createMap` e o título do topo passam a usar `cleanMapName` e `MAP_NAME_MAX`, para não existir caminho que crie nome fora do padrão.
6. `.map-name` em `styles.css`: realce no hover e borda no foco, para a edição ser descobrível sem virar um formulário.
7. `src/editor/Modal.tsx`: campos com `data-escape-local` ficam com o `Esc` para si — sem isso, cancelar a edição fechava a janela inteira ([[BUG-005 - Esc durante a edição do nome fechava a janela]]).

## Decisões e alternativas descartadas
- **Botão "Renomear" no cartão**: mais um ícone para aprender e um clique a mais; o nome editável é o padrão que o usuário já conhece dos trechos ([[MEL-014 - Meus trechos salvos no navegador]]).
- **Bump de `updatedAt` ao renomear**: reordenaria a lista no meio da tarefa; o conteúdo não mudou, então o horário também não.
- **Exigir nome único**: dois mapas com o mesmo nome não quebram nada (os ids são diferentes) e bloquear gera mensagem sem saída; quem quiser variedade usa a cópia automática.
- **Renomear em janela própria**: exagero para um campo de uma linha.

## Arquivos alterados
- `src/features/projects/library.ts`: `MAP_NAME_MAX`, `cleanMapName`.
- `src/features/projects/library.test.ts`: teste de normalização, fallback e limite.
- `src/features/projects/storage.ts`: `renameProject`.
- `src/App.tsx`: `renameMap`, campo do cartão, `createMap`/título usando `cleanMapName`.
- `src/styles.css`: `.map-name`.
- `src/editor/Modal.tsx`: `data-escape-local`.
- `README.md`: bullet de Meus mapas.

## Impacto
A biblioteca fecha o ciclo: buscar, ordenar, duplicar e agora renomear sem sair da janela. Junto com a busca ([[MEL-018 - Busca e ordenação em Meus mapas]]), organizar uma lista grande de mapas virou coisa de segundos.

## Como validar
1. `Meus mapas` → clicar no nome → digitar `Bosque Norte` → `Enter`: o cartão e o nome acessível mudam.
2. `Esc` no meio da edição: o valor volta e a janela continua aberta.
3. Apagar tudo e confirmar: o nome anterior permanece.
4. Recarregar a página: o nome novo está lá.
5. Abrir o mapa renomeado: o título do topo é o novo nome.
6. Renomear o mapa aberto pelo cartão: o topo muda na hora e aparece o aviso.
7. `npm test`: 41/41.

## Próximos passos
- Filtro por data (últimos 7 dias) em Meus mapas.
- Exportar um trecho salvo como arquivo direto da lista de trechos.

## Commit / PR
PR [#89](https://github.com/ZedroDacunha/Tabletop-RPG/pull/89).

## Notas relacionadas
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[MEL-013 - Duplicar mapa]]
- [[MEL-018 - Busca e ordenação em Meus mapas]]
- [[BUG-005 - Esc durante a edição do nome fechava a janela]]

---
id: MEL-017
titulo: Menu Arquivo no topo
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / cabeçalho
arquivos-afetados: ['src/App.tsx', 'src/styles.css']
tags: [melhoria, interface, cabecalho, menu]
relacionados: [MEL-016, BUG-003]
---
# MEL-017 — Menu Arquivo no topo

## Resumo
`Abrir projeto` e `Exportar projeto` saíram de botões soltos e viraram um menu `Arquivo` no cabeçalho, ao lado de `Meus mapas`, `Novo mapa`, `Modo apresentação` e `Salvar mapa`.

## Motivação
O topo tinha ação demais para uma função secundária: abrir e exportar arquivos `.tabletop` são operações de arquivo, não de edição — e dividiam espaço com o botão principal da tela.

## Como era antes
- Botões separados no cabeçalho para abrir e exportar o projeto, somando-se a `Meus mapas`, `Novo mapa` e `Salvar mapa`.
- Em tela estreita sobravam ícones sem nome compreensível ([[BUG-003 - Ações do topo sem nome acessível]]).

## Como ficou agora
- Botão `Arquivo` com `aria-haspopup="menu"` e `aria-expanded`, abrindo `.menu-panel.header-menu`.
- Itens `Abrir projeto` (`.tabletop de um arquivo`) e `Exportar projeto` (`.tabletop com os modelos`), cada um com uma linha de ajuda.
- Exportar avisa por notificação que a cópia saiu completa, com os modelos 3D.
- Fecha ao escolher, ao clicar fora e com `Esc`; um único `openMenu` controla os menus do cabeçalho e do rodapé da biblioteca, então abrir um fecha o outro.
- Cabeçalho resultante: `Meus mapas · Novo mapa · Arquivo · Modo apresentação (P) · Salvar mapa`.

## O que foi feito
1. `.header-file` como contêiner posicionado (`right: 0`, largura explícita no painel) — o menu não herda a largura do botão estreito.
2. `openMenu: 'import' | 'file' | null` substituindo estados separados de importação.
3. Fechamento por `mousedown` fora de `.library-import`/`.header-file` e por `Esc`.
4. `aria-label` em todas as ações do cabeçalho, incluindo as que perdem o texto em telas estreitas.
5. `Exportar projeto` reaproveita `exportProject(project)` do storage, o mesmo caminho da janela de mapas.

## Decisões e alternativas descartadas
- **Menu "Arquivo" com nova janela**: para duas ações, um menu é imediato.
- **Duplicar `Abrir`/`Exportar` também no rodapé da biblioteca**: dois caminhos para a mesma ação confundem; o rodapé ficou com trechos e modelos ([[MEL-016 - Painel da biblioteca separado por função]]).
- **`title` em vez de `aria-label`**: `title` é dica visual, não nome acessível estável.

## Arquivos alterados
- `src/App.tsx`: `.header-file`, menu `file`, `openMenu` unificado, `aria-label`/`aria-expanded`.
- `src/styles.css`: `.header-menu`, `.menu-panel` e alinhamento do cabeçalho.

## Impacto
Topo com cinco ações claras, uma delas agrupando arquivo. O padrão `.menu-panel` ficou pronto para o próximo menu.

## Como validar
1. Clicar em `Arquivo`: menu com dois itens e descrições.
2. Escolher `Exportar projeto`: baixa `.tabletop` e mostra a notificação.
3. `Esc` ou clique fora: fecha.
4. Abrir o `Importar` do rodapé e depois `Arquivo`: um fecha quando o outro abre.
5. Em 900 px, todo botão do topo tem nome acessível.

## Próximos passos
- Atalho de teclado para `Arquivo` (hoje `Ctrl+S` salva, mas exportar/abrir só por clique).

## Commit / PR
PR [#85](https://github.com/ZedroDacunha/Tabletop-RPG/pull/85).

## Notas relacionadas
- [[MEL-016 - Painel da biblioteca separado por função]]
- [[BUG-003 - Ações do topo sem nome acessível]]

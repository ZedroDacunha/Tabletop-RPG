---
id: MEL-016
titulo: Painel da biblioteca separado por função
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / biblioteca
arquivos-afetados: ['src/App.tsx', 'src/styles.css']
tags: [melhoria, interface, biblioteca, responsivo]
relacionados: [BUG-002, MEL-014, MEL-001]
---
# MEL-016 — Painel da biblioteca separado por função

## Resumo
O rodapé da biblioteca ficou com duas ações (`Trechos` e `Importar`), e os arquivos passaram para um menu: `.trecho` de outro mapa e modelo 3D. A lista de peças ganhou altura e as abas pararam de estourar em tela estreita.

## Motivação
O usuário mandou capturas mostrando o painel esquerdo espremido: abas cortadas e um rodapé com um botão de importação por tipo de arquivo, comendo a altura da lista de peças.

## Como era antes
- Rodapé com uma ação por tipo de arquivo, empilhadas — cada botão novo roubava uma linha da lista de peças.
- Abas com tamanho fixo, cortando o primeiro rótulo em ~900 px ([[BUG-002 - Abas da biblioteca cortadas em tela estreita]]).
- Lista de peças em `.library-scroll` com menos altura útil.

## Como ficou agora
- Rodapé com `Trechos` (com contador de trechos salvos) e `Importar` (menu com `Trecho` e `Modelo 3D`, cada item com uma linha de ajuda).
- Um único estado de menu (`openMenu: 'import' | 'file' | null`), com fechamento por clique fora, `Esc` e ao escolher um item.
- Abas responsivas: ícones somem em ≤950 px e o contador em ≤650 px.
- Lista com mais altura (`.library-scroll`) e estados vazios com texto útil — "Sua coleção começa aqui" em `Importados`, "Um mundo de possibilidades" na cena vazia.

## O que foi feito
1. O rodapé passou a ter `library-actions` com dois botões; os três `<input type="file">` continuam no DOM, acionados pelo menu (`clipRef`, `modelRef`, `fileRef`).
2. `.library-import` e `.header-file` como contêineres posicionados do menu, com `.menu-panel` de largura explícita — o painel não estica junto com o botão.
3. `openMenu` unificado para o menu do rodapé e o do cabeçalho, com `mousedown` fora fechando (`closest('.library-import')`/`closest('.header-file')`).
4. Regras de aba por breakpoint (1200/950/650 px), com `gap` e `padding` menores antes de esconder conteúdo.
5. Estados vazios e notas da lista reescritos para orientar em vez de só informar ausência.

## Decisões e alternativas descartadas
- **Menu "Importar" com três níveis**: o projeto inteiro já vive no `Arquivo` do cabeçalho ([[MEL-017 - Menu Arquivo no topo]]); repetir aqui confundiria.
- **Só ícones no rodapé**: esconde função atrás de adivinhação; rótulo + menu é mais claro e ocupa duas linhas fixas.
- **Esconder a barra de abas em telas pequenas**: tiraria a navegação principal do painel; encolher o que é secundário (ícone, contador) resolve.

## Arquivos alterados
- `src/App.tsx`: rodapé com `library-actions`, menu `import` com `role="menu"`, `openMenu` unificado, estados vazios.
- `src/styles.css`: `.library-actions`, `.menu-panel`, `.import-menu`, `.library-scroll`, breakpoints das abas.

## Impacto
A lista de peças recuperou altura e o rodapé parou de crescer a cada formato novo de arquivo. É o padrão de menu reaproveitado no cabeçalho em [[MEL-017 - Menu Arquivo no topo]].

## Como validar
1. Em 1440 px: rodapé com dois botões; `Importar` abre o menu com os dois itens.
2. Clicar fora ou `Esc`: o menu fecha.
3. Em 900 px: as três abas inteiras, sem estouro (medido por `scrollWidth` ≤ `clientWidth` + 1).
4. Aba `Importados` vazia: aparece "Sua coleção começa aqui".

## Próximos passos
- Agrupar a barra de ferramentas do viewport por função (ver roadmap do README).
- Chips de categoria em faixa rolável.

## Commit / PR
PR [#84](https://github.com/ZedroDacunha/Tabletop-RPG/pull/84).

## Notas relacionadas
- [[BUG-002 - Abas da biblioteca cortadas em tela estreita]]
- [[MEL-017 - Menu Arquivo no topo]]
- [[MEL-014 - Meus trechos salvos no navegador]]

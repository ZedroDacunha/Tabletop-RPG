---
id: MEL-029
titulo: Barra compacta com menu Mais ações em telas estreitas
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / viewport
arquivos-afetados: ['src/App.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, interface, responsivo, acessibilidade]
relacionados: [MEL-027, MEL-024]
---
# MEL-029 — Barra compacta com menu "Mais ações" em telas estreitas

## Resumo
Abaixo de 650 px a barra do viewport deixa de encolher até virar um risco de ícones: fica só o grupo `Ferramentas` e um botão `Mais ações`, que abre num menu o histórico, a câmera, a visualização e a saída — com o estado das alternâncias anunciado por `aria-checked`.

## Motivação
No compacto a barra só diminuía ícones (27 → 24 → 23 px) até ficar ilegal para o dedo e para o olho. Com cinco grupos desde [[MEL-027 - Barra do viewport agrupada por função]], a solução certa é escolher o que fica à mão e esconder o resto atrás de um menu — não encolher tudo.

## Como era antes
- Em 600 px: cinco pílulas espremidas no topo, com ícones de 23 px e alvos minúsculos.
- Câmera e visualização continuavam visíveis, competindo com a cena.
- Nenhuma forma de reduzir a barra sem perder função.

## Como ficou agora
- `≤650 px`: `Ferramentas` + `Mais ações`. O menu tem nove itens divididos por função:
  - Desfazer / Refazer (com `Ctrl+Z` e `Ctrl+Shift+Z`, desabilitados quando não há o que fazer);
  - Perspectiva × Vista superior / Centralizar câmera;
  - Grade / Encaixe na grade / Régua — `role="menuitemcheckbox"` com `aria-checked` e marcação visual;
  - Exportar imagem / Ajuda e atalhos (`?`).
- Comandos fecham o menu ao agir; alternâncias deixam aberto para ligar/desligar várias seguidas.
- `Esc` e clique fora fecham, como nos outros menus do editor.
- `>650 px`: nada muda — os cinco grupos voltam e o botão desaparece.

## O que foi feito
1. `useCompactToolbar()` em `src/App.tsx`: `matchMedia('(max-width:650px)')` com listener de `change`, para a decisão vir do JS em vez de CSS escondendo elementos.
2. Render condicional: `Histórico` só entra na barra em tela larga; `.view-controls` (câmera) e `.viewport-bottom-right` (visualização/saída) **não são montados** no compacto — nada de botão invisível no `Tab`.
3. Botão de gatilho com `aria-haspopup="menu"`, `aria-expanded` e `aria-label="Mais ações"`, reaproveitando o estilo `.icon-button`.
4. `openMenu` ganhou o valor `'tools'` e o listener de clique fora passou a considerar `.toolbar-more`.
5. CSS: `.toolbar-more`, `.tools-menu` (painel ancorado abaixo do botão, 216 px), `.menu-separator` e `[aria-checked="true"]` com fundo e marca.
6. `kbd` dentro dos itens mostra o atalho correspondente, para o menu também ensinar teclado.

## Decisões e alternativas descartadas
- **Esconder por CSS (`display:none`)**: deixaria os botões no DOM — foco de teclado em elemento invisível e duas fontes de verdade sobre o que está na tela.
- **Menu com três níveis (submenu por grupo)**: muitos cliques em tela pequena; separadores por função resolvem com um nível só.
- **Manter a câmera fora do menu**: em 600 px ela ocuparia o topo todo; está a um clique dentro do menu.
- **Detectar por largura do viewport em px do CSS e usar `clamp()`**: não há como mover elementos entre grupos só com CSS, então a estrutura continua a mesma.

## Arquivos alterados
- `src/App.tsx`: `useCompactToolbar`, barra condicional, menu `'tools'`, fechamento por clique fora.
- `src/styles.css`: `.toolbar-more`, `.tools-menu`, `.menu-separator` e estado dos checkboxes.
- `README.md`: bullet da barra do viewport.

## Impacto
O editor continua utilizável em tela pequena sem esconder função: o que é frequente (ferramentas) fica à mão, o resto fica a um toque, com estado legível. Mesma linguagem dos outros menus do editor.

## Como validar
1. Abrir em 600 px: barra com `Ferramentas` e `Mais ações`.
2. Clicar em `Mais ações`: nove itens, com atalhos e separadores.
3. Desligar a grade: `aria-checked` vira `false`, o desfazer habilita e o menu continua aberto.
4. Clicar em `Desfazer`: a grade volta, o menu fecha e o refazer habilita.
5. `Esc` e clique fora: fecham.
6. Aumentar a janela para 1440 px: cinco grupos e nenhum `Mais ações`.

## Próximos passos
- Legenda por vista no modo apresentação (item 2 do roadmap).
- Exportar um trecho salvo como arquivo direto da lista.

## Commit / PR
PR [#92](https://github.com/ZedroDacunha/Tabletop-RPG/pull/92).

## Notas relacionadas
- [[MEL-027 - Barra do viewport agrupada por função]]
- [[MEL-016 - Painel da biblioteca separado por função]]
- [[MEL-024 - Modo de compatibilidade sem WebGL]]

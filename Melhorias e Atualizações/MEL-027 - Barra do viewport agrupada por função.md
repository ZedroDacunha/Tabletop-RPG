---
id: MEL-027
titulo: Barra do viewport agrupada por função
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / viewport
arquivos-afetados: ['src/App.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, interface, viewport, acessibilidade]
relacionados: [MEL-002, MEL-007, MEL-023, MEL-016]
---
# MEL-027 — Barra do viewport agrupada por função

## Resumo
As ações do viewport passaram a ficar em cinco grupos nomeados — `Ferramentas`, `Histórico`, `Câmera`, `Visualização` e `Saída` — em vez de nove ícones espalhados em três cantos, com divisórias inconsistentes e um botão de câmera que parecia abrir menu.

## Motivação
Com o editor crescendo (gizmo, régua, grade, encaixe, exportar imagem, ajuda), a barra virou uma fila de ícones sem hierarquia: nada dizia o que era ferramenta, o que era histórico e o que era ajuste de cena. Era o item 2 do roadmap desde a primeira versão.

## Como era antes
- Topo central: um único `.toolstrip` com as quatro ferramentas, **uma** divisória e desfazer/refazer.
- Canto superior direito: `Perspectiva` + `Centralizar` fora do padrão dos outros controles.
- Canto inferior direito: outro `.toolstrip` com grade, encaixe, régua, **uma** divisória, exportar imagem e ajuda.
- O botão de câmera tinha uma seta (`ChevronDown`) de menu, mas alternava direto — afordância errada.

## Como ficou agora
- Cinco grupos, cada um com `role="group"` e `aria-label`: leitor de tela anuncia a função antes dos botões.
- `Ferramentas` (selecionar, mover, girar, escalar) e `Histórico` (desfazer, refazer) no topo central, como pílulas separadas.
- `Câmera` com o modo atual (ícone + texto), alternância direta e `aria-pressed` anunciando o estado — sem seta de menu.
- `Visualização` (grade, encaixe, régua) e `Saída` (exportar imagem, ajuda) no canto inferior direito, agora em duas pílulas.
- Grupos com vão entre si e sombra única; somem as divisórias soltas.
- Em 1024 px os grupos continuam inteiros e sem sobreposição.

## O que foi feito
1. Componente `ToolGroup` em `src/App.tsx`: `div.toolstrip.tool-group` com `role="group"` e `aria-label`, reaproveitando o estilo de pílula existente.
2. Barra do topo reescrita em dois `ToolGroup` (ferramentas e histórico), sem o `tool-divider` no meio.
3. `.view-controls` passou a conter um `ToolGroup` "Câmera"; o botão virou `.view-toggle` com `aria-pressed` e sem `ChevronDown`.
4. Canto inferior direito com `ToolGroup` "Visualização" e `ToolGroup` "Saída"; `.viewport-bottom-right` ganhou `display:flex` e `gap`.
5. CSS: `.view-controls>button:first-child` → `.view-toggle` (com `:hover` e `[aria-pressed="true"]`), `.view-controls>.icon-button` → `.view-controls .icon-button`, e a regra `svg:last-child{display:none}` (que existia só para esconder a seta falsa) foi removida.
6. README com a descrição dos grupos; roadmap item 2 fechado e substituído por "filtro por período em Meus mapas".

## Decisões e alternativas descartadas
- **Rótulos visíveis em cada grupo**: encheria o viewport de texto; o nome fica no `aria-label` e nas dicas (`title`) de cada botão.
- **Um único grupo com divisórias**: era o estado anterior; divisória é ambígua quando um lado cresce.
- **Menu suspenso na câmera**: parecia ser (tinha seta), mas são dois estados; virou alternância com `aria-pressed`.
- **Menu "mais opções" escondendo ajuda e exportar**: tiraria descoberta de funções usadas com frequência e não é o problema atual.

## Arquivos alterados
- `src/App.tsx`: `ToolGroup`, barra do topo, grupo de câmera, grupos de visualização e saída.
- `src/styles.css`: `.view-toggle`, `.view-controls .icon-button`, `.viewport-bottom-right` em flex e `.tool-group`.
- `README.md`: seção "O que funciona" e roadmap.

## Impacto
A barra passa a ensinar a hierarquia: escolher ferramenta, corrigir com histórico, mudar o ponto de vista, ajustar a visualização, tirar o resultado. Nada mudou de comportamento nem de atalho — o ganho é de leitura e de acessibilidade.

## Como validar
1. Abrir o editor: dois grupos no topo, um à direita, dois no canto inferior direito.
2. Inspecionar um grupo: `role="group"` e `aria-label` com o nome da função.
3. Clicar em `Mover (2)`: só ele fica ativo no grupo `Ferramentas`.
4. Clicar na câmera: alterna `Perspectiva` ↔ `Vista superior` e muda `aria-pressed`.
5. Desfazer começa desabilitado; desligar a grade habilita, desfazer religa e habilita o refazer.
6. Estreitar a janela para 1024 px: grupos inteiros, sem sobreposição e sem barra de rolagem horizontal.

## Próximos passos
- Filtro por período em Meus mapas (novo item 2 do roadmap).
- Legenda por vista no modo apresentação.

## Commit / PR
PR [#90](https://github.com/ZedroDacunha/Tabletop-RPG/pull/90).

## Notas relacionadas
- [[MEL-002 - Gizmo preso ao objeto selecionado]]
- [[MEL-007 - Régua e encaixe entre vizinhas]]
- [[MEL-023 - Câmera orbital, vistas de topo e exportar imagem]]
- [[MEL-016 - Painel da biblioteca separado por função]]

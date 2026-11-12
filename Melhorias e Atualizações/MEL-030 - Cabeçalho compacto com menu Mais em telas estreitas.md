---
id: MEL-030
titulo: Cabeçalho compacto com menu Mais em telas estreitas
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / cabeçalho
arquivos-afetados: ['src/App.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, interface, responsivo, acessibilidade]
relacionados: [MEL-029, MEL-017, BUG-003]
---
# MEL-030 — Cabeçalho compacto com menu "Mais" em telas estreitas

## Resumo
Abaixo de 650 px as ações do topo deixam de ser ícones sem rótulo: elas se juntam num menu `Mais` com as cinco ações escritas por extenso e uma linha de ajuda cada. `Salvar mapa` continua na barra.

## Motivação
Em [[BUG-003 - Ações do topo sem nome acessível]] o problema foi remediado com `aria-label`: o botão continuou sendo um ícone, agora com nome apenas para leitor de tela. Quem enxerga continuava adivinhando o que era cada desenho. Em 600 px, a solução certa é a mesma da barra do viewport ([[MEL-029 - Barra compacta com menu Mais ações em telas estreitas]]): reduzir a quantidade e nomear o que resta.

## Como era antes
- `≤650 px`: `Meus mapas`, `Novo mapa`, `Arquivo` e apresentação viravam quatro ícones de 29 px no topo, só com `aria-label`/`title`.
- Nenhuma pista visual de onde ficava "Abrir projeto" ou "Modo apresentação".
- O menu `Arquivo` continuava existindo, mas escondido atrás do ícone de pasta.

## Como ficou agora
- `≤650 px`: marca, nome do mapa, botão **`Mais`** e **`Salvar mapa`** (ação principal, sempre visível).
- O menu traz cinco itens, cada um com nome e uma linha de ajuda:
  - `Meus mapas` — mapas salvos neste navegador;
  - `Novo mapa` — começar um mapa vazio;
  - `Abrir projeto` — `.tabletop de um arquivo`;
  - `Exportar projeto` — `.tabletop com os modelos`;
  - `Modo apresentação` — tela cheia, sem painéis (P).
- Fecha ao escolher, no `Esc` e no clique fora; `aria-haspopup="menu"` e `aria-expanded` no gatilho.
- `>650 px`: `Meus mapas`, `Novo mapa`, `Arquivo` e o botão de apresentação voltam ao lugar e o `Mais` desaparece.

## O que foi feito
1. `useCompactToolbar` foi renomeado para **`useNarrowScreen`** (mesmo `matchMedia('(max-width:650px)')`), porque o mesmo breakpoint passou a valer para a barra do viewport e para o cabeçalho; a variável local é `narrow`.
2. Cabeçalho: as três ações e o botão de apresentação só são montados em tela larga (`{!narrow&&<>…</>}`); no compacto entra `.header-more` com o painel `.header-more-menu`.
3. `Salvar mapa` ficou **fora** do bloco condicional, garantindo que a ação principal nunca saia da barra.
4. `openMenu` ganhou o valor `'header'` e o listener de clique fora passou a considerar `.header-more`.
5. CSS: `.header-more` (posicionado) e `.header-more-menu` (236 px, ancorado à direita, `z-index` 30 — acima do `topbar` de 20 e abaixo dos modais de 70).
6. `README`: o bullet do menu Arquivo passou a descrever o `Mais` no compacto.

## Decisões e alternativas descartadas
- **Manter os ícones e apenas melhorar o `title`**: dica de mouse não resolve no toque e não responde "onde está exportar".
- **Colocar `Salvar mapa` dentro do menu**: salvar é a ação que precisa de um toque, não de dois.
- **Menu com submenu "Arquivo"**: um nível só (Abrir/Exportar direto) evita três toques em tela pequena.
- **Reaproveitar o `Arquivo` do cabeçalho e só mover `Meus mapas`/`Novo mapa` para o menu**: sobrariam dois menus abertos por gatilhos diferentes no mesmo canto; um único `Mais` é mais simples.

## Arquivos alterados
- `src/App.tsx`: `useNarrowScreen`, cabeçalho compacto, menu `'header'`, fechamento por clique fora.
- `src/styles.css`: `.header-more` e `.header-more-menu`.
- `README.md`: bullet do menu Arquivo.

## Impacto
Em tela pequena, cada ação do topo tem nome legível e uma explicação; nenhuma função desaparece. O cabeçalho fica com duas coisas: salvar e "mais".

## Como validar
1. Abrir em 600 px: topo com marca, nome, `Mais` e `Salvar mapa`.
2. Clicar em `Mais`: cinco itens nomeados, com linha de ajuda.
3. `Meus mapas`: abre a biblioteca e fecha o menu.
4. `Novo mapa`: abre "Um novo mundo".
5. `Modo apresentação`: entra em tela cheia; `Esc` volta ao editor.
6. `Esc` e clique fora fecham o menu do topo.
7. Em 1440 px: os três botões rotulados voltam e o `Mais` desaparece.

## Próximos passos
- Legenda por vista no modo apresentação (item 2 do roadmap).
- Exportar um trecho salvo como arquivo direto da lista de trechos.

## Commit / PR
PR [#94](https://github.com/ZedroDacunha/Tabletop-RPG/pull/94).

## Notas relacionadas
- [[MEL-029 - Barra compacta com menu Mais ações em telas estreitas]]
- [[MEL-017 - Menu Arquivo no topo]]
- [[BUG-003 - Ações do topo sem nome acessível]]

---
id: MEL-031
titulo: Tela de edição organizada com barra docada
tipo: interface/UX
status: concluída
data: 2026-11-11
area: interface / editor
arquivos-afetados: ['src/App.tsx', 'src/editor/Inspector.tsx', 'src/styles.css', 'README.md']
tags: [melhoria, interface, layout, acessibilidade]
relacionados: [MEL-027, MEL-029, MEL-030]
---
# MEL-031 — Tela de edição organizada com barra docada

## Resumo
A tela de edição passou de quatro blocos flutuando sobre o mapa para uma barra única docada acima da cena, com o painel de propriedades em seções recolhíveis e um rodapé só com dados. O mapa deixou de ser coberto por controles.

## Motivação
O editor acumulou funções ao longo das entregas e cada uma ganhou seu bloco flutuante: badge do mapa, ferramentas, histórico, câmera, visualização/saída. Somando o painel de propriedades com seis blocos sempre abertos e um rodapé com frase de efeito, a tela não dizia o que era principal. A cena — que é o motivo de existir da tela — ficava em terceiro plano.

## Como era antes
- Quatro grupos flutuantes sobre a cena (`viewport-title`, `viewport-top-controls`, `view-controls`, `viewport-bottom-right`) com 15 botões cobrindo cerca de 6% do mapa.
- Atalhos de mouse fixos no canto inferior esquerdo da cena, repetindo o `Atalhos ?` do rodapé.
- Rodapé com a frase "Seu mundo está pronto para criar", contagem, grade, coordenadas e `PROTÓTIPO 0.1`.
- Cabeçalho com a linha de slogan `SEU MUNDO, SUAS HISTÓRIAS` acima do nome do mapa.
- Propriedades com Roteiro, Camadas, Ambiente e Configurações sempre abertos: uma rolagem longa até o que importa.
- Em ≤950 px o painel vira gaveta e entrava por cima do topo da cena.

## Como ficou agora
- **Barra docada** de 46 px sobre a cena, dentro da coluna do editor: abrir/fechar biblioteca · `Ferramentas` · `Histórico` · (espaço) · `Câmera` · `Visualização` · `Saída` · abrir/fechar propriedades.
- A cena começa abaixo da barra (`inset:var(--barra) 0 0 0!important`), então nenhum controle cobre o mapa. Sobrou só a régua da peça mais próxima, que é informação contextual.
- **Propriedades recolhíveis**: `Roteiro de apresentação`, `Camadas`, `Ambiente` e `Configurações do mapa` fechadas por padrão, com resumo e chevron; o bloco do objeto selecionado continua aberto.
- **Rodapé** com `objetos · grade · coordenadas` e `tamanho do mapa · protótipo`.
- **Cabeçalho** só com marca, nome, estado de salvamento e ações.
- **Gaveta** de propriedades (≤950 px) começa abaixo da barra e, em carga nova, fechada.

## O que foi feito
1. `src/App.tsx`: `.canvas-bar` substitui `viewport-title` + `viewport-top-controls` + `view-controls` + `viewport-bottom-right`; os grupos são os mesmos `ToolGroup` de [[MEL-027 - Barra do viewport agrupada por função]], sem mudar rótulos.
2. Os atalhos de mouse saíram da cena; `Ajuda e atalhos` (que já existia na barra) passou a ser o único ponto de entrada.
3. `src/styles.css`: `--barra:46px` em `.app-shell` e `.viewport-wrap`; a cena e a vinheta passam a começar em `var(--barra)`; `.inspector` (gaveta ≤950 px) usa `calc(76px + var(--barra))` e `calc(64px + var(--barra))` na versão ≤650 px.
4. `src/editor/Inspector.tsx`: componente `Section` com `aria-expanded`, resumo no cabeçalho e conteúdo montado só quando aberto.
5. Rodapé e cabeçalho enxutos; o tamanho do mapa foi para o rodapé, no lugar do badge da cena.

## Decisões e alternativas descartadas
- **Continuar flutuante e só reduzir os grupos**: o problema não era a quantidade, era o mapa ser o fundo dos controles.
- **Barra flutuando no topo da cena**: trocaria quatro caixas por uma faixa de vidro por cima do desenho; docada devolve a área toda ao mapa.
- **Menu único com tudo**: esconderia ferramentas de uso constante atrás de um clique. A hierarquia ficou: ferramentas na barra, o que é ocasional em menus.
- **Acordeão deixando um item aberto por vez**: obrigaria a fechar uma seção para abrir outra; recolhíveis independentes são mais previsíveis.
- **Seções abertas por padrão com rolagem**: era o estado anterior, e é justamente o que escondia o conteúdo abaixo da dobra.
- **Gaveta sobre a barra**: a primeira versão deixava o `Mais ações` e o botão de propriedades inacessíveis em 600 px; a verificação no navegador pegou isso.

## Arquivos alterados
- `src/App.tsx`: `.canvas-bar`, rodapé e cabeçalho enxutos.
- `src/editor/Inspector.tsx`: `Section` recolhível nas quatro seções.
- `src/styles.css`: `--barra`, barra docada, cena deslocada, gaveta abaixo da barra, cabeçalhos clicáveis.
- `README.md`: bullets da barra, das seções e do rodapé.

## Impacto
O mapa voltou a ocupar a tela inteira e a interface tem uma ordem clara: barra (ações do mapa), biblioteca (conteúdo), propriedades (detalhe do que está selecionado), rodapé (estado). Em 1440 px a área de controles sobre a cena caiu de ~6% para 0%.

## Como validar
1. Abrir o editor com o mapa de exemplo: barra acima da cena, sem caixas flutuando sobre o mapa.
2. Alternar `Perspectiva`, centralizar, grade, encaixe e régua pela barra.
3. Em Propriedades, abrir e fechar `CAMADAS` — o conteúdo só existe quando aberto.
4. Conferir o rodapé: objetos, grade, coordenadas e tamanho do mapa.
5. Estreitar a janela para 1180 px e 600 px: barra inteira, gaveta abaixo da barra e `Mais ações` clicável.
6. Recarregar em 600 px: cena inteira, gaveta fechada.

## Próximos passos
- Legenda por vista no modo apresentação (item 2 do roadmap).
- Exportar um trecho salvo como arquivo direto da lista de trechos.

## Commit / PR
PR [#95](https://github.com/ZedroDacunha/Tabletop-RPG/pull/95).

## Notas relacionadas
- [[MEL-027 - Barra do viewport agrupada por função]]
- [[MEL-029 - Barra compacta com menu Mais ações em telas estreitas]]
- [[MEL-030 - Cabeçalho compacto com menu Mais em telas estreitas]]

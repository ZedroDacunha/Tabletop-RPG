---
id: MEL-001
titulo: Ambiência e acervo de 32 peças
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: cena 3D / catálogo
arquivos-afetados: ['src/scene/Viewport.tsx', 'src/scene/Models.tsx', 'src/features/assets/catalog.ts', 'src/styles.css']
tags: [melhoria, cena3d, ambiencia, catalogo]
relacionados: [MEL-008, MEL-003]
---
# MEL-001 — Ambiência e acervo de 32 peças

## Resumo
A cena deixou de ser um plano cinza: ganhou céu em gradiente, sol ou lua, estrelas, colinas no horizonte, névoa e chão com textura — e o catálogo foi para 32 peças 3D divididas em cinco categorias.

## Motivação
Um mapa de RPG precisa de atmosfera. Sem horizonte, luz direcional e névoa, as peças flutuavam num vazio claro e o resultado não convencia como "lugar".

## Como era antes
- Fundo chapado (`settings.background`, `#202a28`) atrás de tudo, sem céu.
- Chão liso, uma `boxGeometry` e um plano sem textura.
- Uma luz ambiente e uma direcional, iguais em qualquer hora do dia.
- Acervo menor: pela descrição da PR ("dobra o acervo"), eram 16 peças; o código hoje traz **32**.

## Como ficou agora
- Presets de atmosfera `dawn`, `day`, `dusk` e `night` no mapa `AMBIENCE`, cada um com cores de céu, sol, névoa, luz e densidade de estrelas.
- `SkyDome` (gradiente de quatro cores), `CelestialBody` (sol/lua), `Stars`, `HorizonRing` (silhueta de colinas) e `fog` casada com a cor de fundo.
- Chão com textura procedural (`useGroundTexture`) e grid que pinta as seções a cada 5 células.
- Catálogo com **32 peças** em `Todos`, `Natureza`, `Construções`, `Objetos`, `Básicos` e `Importados`.

## O que foi feito
1. `AMBIENCE` em `src/scene/Viewport.tsx`, com `mixColors` para derivar céu, névoa e horizonte de `settings.background` — a atmosfera acompanha o fundo escolhido em vez de brigar com ele.
2. Componentes de céu (`SkyDome`, `CelestialBody`, `Stars`, `HorizonRing`) desenhados com material básico, sem luz, para custar pouco.
3. `useGroundTexture` gera a textura do piso em canvas e define `repeat` a partir de `settings.size`.
4. As 32 peças em `src/features/assets/catalog.ts` (tipo, nome, categoria, detalhe e cor) modeladas em `src/scene/Models.tsx`.
5. Vinheta e sombreado suave no CSS, para a cena não terminar em aresta dura na borda do canvas.

## Decisões e alternativas descartadas
- **HDRI/imagem de céu**: descartado por peso de download e por amarrar a paleta a uma foto fixa; gradiente + luz derivada cabe em poucos KB e aceita as quatro atmosferas.
- **Sombras em tempo real com mapa maior**: ficou em 2048 px, suficiente para a escala dos mapas.
- **Peças via modelos externos**: mantidos modelos procedurais, para o editor abrir instantâneo e funcionar offline.

## Arquivos alterados
- `src/scene/Viewport.tsx`: `AMBIENCE`, `mixColors`, `SkyDome`, `CelestialBody`, `Stars`, `useGroundTexture`, `HorizonRing`, luzes e névoa.
- `src/scene/Models.tsx`: geometria/material de cada tipo de peça.
- `src/features/assets/catalog.ts`: catálogo de 32 peças e categorias.
- `src/styles.css`: vinheta e acabamento do canvas.

## Impacto
A cena passa a ter leitura de profundidade e hora do dia; os mapas ficam apresentáveis sem nenhum pós-processamento. O acervo cobre natureza, construção e objetos, o que viabiliza os cenários prontos de [[MEL-003 - Cenários prontos para começar um mapa]].

## Como validar
1. Abrir o editor e trocar a atmosfera em `Cenário`/ajustes do mapa: céu, sol, névoa e estrelas mudam juntos.
2. Criar um mapa com 30 m e conferir a textura do chão sem repetição visível.
3. Abrir a aba de peças: a contagem chega a 32 itens e as cinco categorias filtram.

## Próximos passos
- Legenda por vista no modo apresentação.
- Chips de categoria em faixa rolável (ver roadmap do README).

## Commit / PR
PR [#51](https://github.com/ZedroDacunha/Tabletop-RPG/pull/51).

## Notas relacionadas
- [[MEL-003 - Cenários prontos para começar um mapa]]
- [[MEL-008 - Camadas com ocultar e travar]]

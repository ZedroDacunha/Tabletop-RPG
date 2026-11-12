---
id: MEL-019
titulo: Editor 3D base do projeto
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / fundação
arquivos-afetados: ['src/App.tsx', 'src/scene/Viewport.tsx', 'src/scene/Models.tsx', 'src/editor/Inspector.tsx', 'src/editor/AssetArt.tsx', 'src/editor/Modal.tsx', 'src/features/assets/catalog.ts', 'src/features/projects/project.ts']
tags: [melhoria, base, cena3d, editor]
relacionados: [MEL-020, MEL-021, MEL-022, MEL-023, MEL-024]
---
# MEL-019 — Editor 3D base do projeto

## Resumo
O protótipo que deu origem a tudo: editor de mapas 3D no navegador em React + Three.js, com biblioteca de 15 peças, câmera orbital, grade com snap, ferramentas de transformação, painel de propriedades, cenário de exemplo e salvamento local.

## Motivação
O plano pedia um editor de mapas de RPG que rodasse no navegador, offline, sem instalar nada — cenas 3D montadas peça por peça e reaproveitadas entre sessões.

## Como era antes
Não existia aplicação: o projeto estava no papel (plano, escopo e limites de arquivo). Nada de código rodando.

## Como ficou agora
- `App` em `src/App.tsx` com o layout de três colunas: biblioteca à esquerda, viewport 3D no centro, propriedades à direita, e cabeçalho com nome do mapa, estado do salvamento e ações.
- Cena em `src/scene/Viewport.tsx` com `@react-three/fiber` (`Canvas` com `shadows`, `frameloop="demand"`, `dpr={[1,1.5]}`, tone mapping `ACESFilmicToneMapping` com exposição por atmosfera).
- Biblioteca inicial de **15 peças** procedurais (`src/scene/Models.tsx` + `src/features/assets/catalog.ts`), com busca e categorias.
- Ferramentas `selecionar`, `mover`, `girar` e `escalar` (`1`–`4` no teclado), grade configurável e snap na célula.
- Painel de propriedades (`src/editor/Inspector.tsx`) com nome, posição, rotação, escala, cor, visibilidade e trava.
- Cenário de exemplo com **67 objetos** (`exampleProject`), para o editor não abrir numa tela morta.
- Tela vazia com convite ("Imagine. Construa. Explore.") e botão para o exemplo.
- Compatibilidade sem WebGL ([[MEL-024 - Modo de compatibilidade sem WebGL]]), histórico ([[MEL-022 - Desfazer e refazer com histórico limitado]]) e persistência ([[MEL-021 - Salvamento local, autosave e arquivo .tabletop]]) desde a primeira entrega.

## O que foi feito
1. Modelo de dados em `src/features/projects/project.ts`: `Project` com `schemaVersion: 1`, `objects`, `assets`, `settings` e `camera`; `Entity` com nome, posição, rotação, escala, cor, `visible` e `locked`.
2. `KINDS` com as formas básicas e `makeEntity` como fábrica única de peças.
3. `Viewport` com `World` (chão, grade, luzes), `Placed` (peça + objeto Three.js) e `CameraRig`.
4. `Models.tsx` com a geometria de cada tipo, reaproveitada também pelo modo compatível e pelas miniaturas.
5. `catalog.ts` como fonte da verdade da biblioteca (nome, categoria, detalhe e cor), usada pela lista e pela busca.
6. `styles.css` com o tema escuro do editor, responsivo em três faixas (≤1200, ≤950, ≤650 px).
7. README com controles, limites de arquivo e arquitetura.

## Decisões e alternativas descartadas
- **Babylon.js ou Three.js puro**: `@react-three/fiber` + `@react-three/drei` casaram com o estado declarativo do React e trouxeram `OrbitControls`, `Grid` e `TransformControls` prontos.
- **Salvar em `localStorage`**: já nasceu em IndexedDB, porque um mapa com modelos importados passa fácil dos 5 MB do `localStorage`.
- **Personagens e multiplayer**: explicitamente fora da primeira entrega (e continuam fora).
- **Peças via arquivos externos**: modelos procedurais deixam o editor abrir instantâneo e funcionar offline.

## Arquivos alterados
- `src/App.tsx`, `src/scene/Viewport.tsx`, `src/scene/Models.tsx`, `src/scene/CompatibleMap.tsx`.
- `src/editor/Inspector.tsx`, `src/editor/AssetArt.tsx`, `src/editor/Modal.tsx`.
- `src/features/assets/catalog.ts`, `src/features/projects/project.ts`.
- `src/styles.css`, `README.md`, `index.html`.

## Impacto
Toda a evolução seguinte (gizmo, cenários, grupos, vistas, trechos) partiu deste esqueleto: modelo de dados versionado, cena declarativa e painéis. O `schemaVersion: 1` continua sendo o mesmo, com campos opcionais acrescentados depois.

## Como validar
1. `npm ci && npm run dev`, abrir o endereço mostrado.
2. Escolher uma peça na biblioteca, clicar no chão: a peça entra na grade.
3. Selecionar, mover, girar, escalar e conferir os campos do inspetor.
4. Abrir o mapa de exemplo: 67 objetos.
5. Recarregar: o mapa volta como estava.

## Próximos passos
- Tudo que veio depois: ambiência e acervo maior ([[MEL-001 - Ambiência e acervo de 32 peças]]), gizmo ([[MEL-002 - Gizmo preso ao objeto selecionado]]).

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas.

## Notas relacionadas
- [[MEL-020 - Importação de modelos 3D GLB e glTF]]
- [[MEL-021 - Salvamento local, autosave e arquivo .tabletop]]
- [[MEL-022 - Desfazer e refazer com histórico limitado]]
- [[MEL-023 - Câmera orbital, vistas de topo e exportar imagem]]
- [[MEL-024 - Modo de compatibilidade sem WebGL]]

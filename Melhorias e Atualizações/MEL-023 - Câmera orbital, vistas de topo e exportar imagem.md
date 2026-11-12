---
id: MEL-023
titulo: Câmera orbital, vistas de topo e exportar imagem
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: cena 3D / câmera
arquivos-afetados: ['src/scene/Viewport.tsx', 'src/App.tsx', 'src/scene/CompatibleMap.tsx']
tags: [melhoria, camera, exportar, cena3d]
relacionados: [MEL-019, MEL-024, MEL-012]
---
# MEL-023 — Câmera orbital, vistas de topo e exportar imagem

## Resumo
Câmera orbital com painel e rotação no botão direito, alternância perspectiva/topo, "centralizar", foco na peça selecionada (`F`) e exportação do mapa como imagem (`PNG` no 3D, `SVG` no modo compatível).

## Motivação
Mapa 3D precisa de ângulo: olhar de cima para desenhar planta, orbitar para conferir silhueta. E o mestre quer a imagem do mapa para compartilhar.

## Como era antes
- Nada (a câmera nasceu junto com o protótipo), mas o recorte importa: sem comandos, cada ajuste era arrastar até achar o ângulo.

## Como ficou agora
- `OrbitControls` com `enableDamping` (0,12), `minDistance 2`, `maxDistance 150` e `maxPolarAngle = π/2 − 0,025` — a câmera não desce abaixo do chão.
- Mapeamento de botões: **direito orbita**, **meio desloca**, **esquerdo livre** — o esquerdo é do editor (selecionar, posicionar, alças do gizmo).
- Comandos de câmera (`CameraCommand`): `home` (perspectiva padrão), `top` (vista de cima, câmera a 1,3 × tamanho do mapa), `focus` (aproxima a seleção), `view` (vista do roteiro, com duração), `image` (exporta).
- Botão `Perspectiva`/`Vista superior` alterna os dois modos; o botão de mira centraliza o mapa.
- `F` foca a seleção atual (ou o centro, sem seleção).
- A posição final da câmera é gravada no projeto no fim de cada órbita (`onEnd` → `remember`), e o mapa reabre no mesmo ângulo.
- `Exportar imagem do mapa` baixa `<nome>.png`; no modo compatível baixa `<nome>.svg`.

## O que foi feito
1. `CameraRig` em `src/scene/Viewport.tsx` com `OrbitControls makeDefault` e um `useEffect` que reage a `command.id`.
2. `command.id === 0` (comando inicial) é ignorado, para o mapa abrir na câmera salva em vez de pular para o padrão.
3. `preserveDrawingBuffer: true` no `Canvas` — é o que permite `gl.render` + `toBlob` para o PNG.
4. `view(type)` em `src/App.tsx` monta o comando com o ponto da seleção (`selectionCenter`) quando faz sentido.
5. `CompatibleMap` trata o mesmo comando `image` exportando o SVG serializado, e avisa que navegação 3D exige WebGL.
6. `invalidate()` depois de cada comando mantém o `frameloop="demand"` renderizando só quando precisa.

## Decisões e alternativas descartadas
- **Órbita no botão esquerdo**: conflitava com selecionar peça e arrastar alça; o direito é o gesto de câmera no editor.
- **Sempre renderizar contínuo (`frameloop="always"`)**: gastava bateria sem necessidade; `demand` + `invalidate` renderiza só quando algo muda.
- **Exportar PNG em resolução fixa**: usa o tamanho atual do canvas, que acompanha a janela; capturas grandes virão de tela cheia.
- **Câmera livre sem gravação**: o ângulo se perdia ao recarregar; hoje vai no projeto.

## Arquivos alterados
- `src/scene/Viewport.tsx`: `CameraRig`, `OrbitControls`, comandos `home`/`top`/`focus`/`view`/`image`, `preserveDrawingBuffer`.
- `src/App.tsx`: `view`, `camera`, alternância perspectiva/topo, `Exportar imagem do mapa`, atalho `F`.
- `src/scene/CompatibleMap.tsx`: exportação em SVG no modo compatível.

## Impacto
Navegar e apresentar dependem de ângulo, e ele agora é salvo, comandado e exportável. O comando `view` deu base ao roteiro de vistas ([[MEL-012 - Roteiro de apresentação com vistas navegáveis]]).

## Como validar
1. Arrastar com o botão direito: a câmera orbita; com o esquerdo, não.
2. Alternar `Vista superior` e `Perspectiva`.
3. Selecionar uma peça e apertar `F`: a câmera aproxima dela.
4. Recarregar: o mapa reabre no último ângulo.
5. Clicar em `Exportar imagem do mapa`: baixa PNG com o mapa.
6. Sem WebGL, o mesmo botão baixa um `.svg`.

## Próximos passos
- Exportar em resolução customizada (2x/4x) para impressão.

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas (câmera e exportação incluídas).

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]
- [[MEL-024 - Modo de compatibilidade sem WebGL]]
- [[MEL-012 - Roteiro de apresentação com vistas navegáveis]]

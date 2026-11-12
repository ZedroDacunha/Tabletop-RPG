---
id: MEL-024
titulo: Modo de compatibilidade sem WebGL
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: cena 3D / acessibilidade
arquivos-afetados: ['src/scene/Viewport.tsx', 'src/scene/CompatibleMap.tsx', 'src/editor/AssetArt.tsx']
tags: [melhoria, compatibilidade, webgl, acessibilidade]
relacionados: [MEL-023, MEL-019]
---
# MEL-024 — Modo de compatibilidade sem WebGL

## Resumo
Sem WebGL (máquina virtual, navegador restrito, driver bloqueado), o editor abre um mapa esquemático em SVG isométrico: dá para selecionar, posicionar, editar propriedades e exportar a imagem — sem prometer 3D.

## Motivação
O primeiro teste automatizado rodou num Chrome sem GPU. Em vez de tela de erro, o mapa virou editável — e isso também vale para qualquer máquina sem aceleração.

## Como era antes
- Só existia o renderizador 3D: sem WebGL, a área central ficava preta ou com erro.

## Como ficou agora
- `hasWebGL()` testa `webgl2` e libera o contexto (`WEBGL_lose_context`) antes de decidir; se falhar, renderiza `CompatibleMap`.
- `CompatibleMap` desenha um SVG isométrico: chão, grade, peças via `AssetArt` (as mesmas artes da biblioteca), destaque da seleção com elipse, e clique/`Enter`/`Espaço` para selecionar.
- Posicionar peça funciona no modo compatível: o clique é convertido de tela para coordenadas do mapa (projeção invertida) e respeita o snap.
- `Exportar imagem do mapa` baixa `.svg` em vez de `.png`.
- Comandos de câmera 3D respondem com uma mensagem clara ("A navegação da câmera 3D requer WebGL. No modo compatível, edite as peças pelo painel de propriedades.").
- Erros de WebGL em tempo de execução caem no `SceneErrorBoundary`, com botão de tentar de novo e aviso de que o mapa salvo continua no navegador.

## O que foi feito
1. `hasWebGL` em `src/scene/Viewport.tsx`, executado uma vez (`useState`).
2. `CompatibleMap` em `src/scene/CompatibleMap.tsx`: projeção `point(x,z)`, `unit` derivado de `settings.size`, peças ordenadas por profundidade e artes reusando `AssetArt`.
3. Conversão inversa do clique (`getScreenCTM().inverse()`) com clamp na área do mapa e snap.
4. `SceneErrorBoundary` (classe) para falha em tempo de execução, separada do teste inicial.
5. Mensagens de erro da câmera tratadas via `onError`, que vira notificação no editor.

## Decisões e alternativas descartadas
- **Bloquear o editor sem WebGL**: perderia o trabalho de quem só quer ajustar posições; o esquemático cobre isso.
- **Chamar o esquemático de "3D"**: o código diz o contrário (`Never presented as the 3D renderer`); a interface e a exportação deixam claro o modo.
- **Canvas 2D**: o SVG é vetorial, acessível por teclado e exporta direto, sem dependência extra.

## Arquivos alterados
- `src/scene/Viewport.tsx`: `hasWebGL`, `SceneErrorBoundary`, escolha do renderizador.
- `src/scene/CompatibleMap.tsx`: mapa esquemático, seleção, posicionamento e exportação SVG.
- `src/editor/AssetArt.tsx`: artes reaproveitadas no esquemático.

## Impacto
O editor nunca abre numa tela morta, e o teste automatizado pôde validar a aplicação inteira num ambiente sem GPU — o que viabilizou as verificações de navegador de todas as entregas seguintes.

## Como validar
1. No Chrome com `--disable-gpu` e sem SwiftShader, abrir o editor: aparece o esquemático.
2. Clicar numa peça: ela é selecionada e os campos do inspetor respondem.
3. Escolher peça na biblioteca e clicar no esquemático: a peça entra.
4. `Exportar imagem do mapa`: baixa `.svg`.
5. Forçar erro de WebGL com GPU ativa: aparece o `SceneErrorBoundary` com "Tentar novamente".

## Próximos passos
- Rotação e escala por arraste no esquemático (hoje só pelo inspetor).

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas (modo compatível incluído).

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]
- [[MEL-023 - Câmera orbital, vistas de topo e exportar imagem]]

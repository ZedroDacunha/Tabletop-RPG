---
id: MEL-012
titulo: Roteiro de apresentação com vistas navegáveis
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: apresentação / câmera
arquivos-afetados: ['src/features/scenes/views.ts', 'src/features/scenes/views.test.ts', 'src/App.tsx', 'src/editor/Inspector.tsx', 'src/scene/Viewport.tsx']
tags: [melhoria, apresentacao, camera, roteiro]
relacionados: [MEL-010, MEL-015, BUG-001]
---
# MEL-012 — Roteiro de apresentação com vistas navegáveis

## Resumo
Vistas salvas por mapa ("Portão", "Pátio", "Salão") viram um roteiro: no modo apresentação, `←`/`→` percorrem as vistas salvas, com nome e posição (`2 / 5`) visíveis.

## Motivação
Mestre de mesa não quer arrastar câmera diante dos jogadores. Um roteiro de enquadramentos prontos resolve a apresentação e padroniza a "foto de capa" de cada cena.

## Como era antes
- A câmera era livre, com um `Posicionar câmera`/`Focar` que ajeitava o enquadramento, mas nada era guardado.
- Nenhuma garantia de voltar ao mesmo ângulo depois de fechar o mapa.

## Como ficou agora
- `Vista` guarda `name`, `position` e `target`; o conjunto fica em `project.views`, salvo, exportado e copiado.
- Botão salva a vista atual; nome padrão é `Vista N` (`defaultViewName`), renomeável.
- Lista de vistas na aba `Cena`, com ir para, renomear e remover.
- Limite de `MAX_VIEWS` (24) e nome de até `VIEW_NAME_MAX` (60); o botão desabilita ao chegar no limite.
- No modo apresentação (`P`), se houver mais de uma vista, `←`/`→` avançam com volta ao início (`nextViewIndex`) e uma pílula mostra `Nome · 2 / 5`.
- Cada vista tem sua duração de viagem ([[MEL-015 - Viagem entre vistas com duração ajustável]]).

## O que foi feito
1. `src/features/scenes/views.ts`: `Viewpoint`, `MAX_VIEWS`, `VIEW_NAME_MAX`, `makeViewpoint`, `nextViewIndex`, `defaultViewName`.
2. `validateProject` aceita `views` opcional, então mapas antigos continuam abrindo e recebem o campo ao salvar.
3. Comando de câmera `{type: 'view', position, target}` em `Viewport.tsx`: a câmera vai para o enquadramento por `CameraRig`, sem passar pelo estado do editor.
4. `saveView`, `goView`, `renameView`, `removeView`, `stepView` em `src/App.tsx`.
5. Pílula de apresentação com nome e contador, respeitando contraste sobre qualquer atmosfera.

## Decisões e alternativas descartadas
- **Vistas globais (fora do mapa)**: não fazem sentido — cada mapa tem seus enquadramentos; ficam dentro do projeto.
- **Guardar só a posição da câmera**: sem `target`, o enquadramento muda conforme o FOV/aspecto; guardar os dois pontos é estável.
- **Avanço automático por tempo**: descartado; quem apresenta decide o ritmo.

## Arquivos alterados
- `src/features/scenes/views.ts`: `Viewpoint`, `MAX_VIEWS`, `VIEW_NAME_MAX`, `makeViewpoint`, `nextViewIndex`, `defaultViewName`.
- `src/features/scenes/views.test.ts`: nomes padrão, ciclo do índice e limites.
- `src/App.tsx`: `saveView`, `goView`, `renameView`, `removeView`, `stepView`.
- `src/editor/Inspector.tsx`: lista de vistas.
- `src/scene/Viewport.tsx`: comando de câmera `view`.

## Impacto
Apresentar um mapa virou apertar seta. As vistas também servem de ponto de partida para capturas e para o onboarding de quem recebe o mapa.

## Como validar
1. Salvar duas vistas, sair da vista (`Focar`) e clicar em ir para a primeira: a câmera volta ao enquadramento.
2. Exportar o mapa e reimportar: as vistas vêm junto.
3. No modo apresentação com duas vistas, `→` vai para a segunda e `→` de novo volta à primeira.
4. Chegar em 24 vistas: o botão de salvar desabilita.

## Próximos passos
- Legenda por vista no modo apresentação (notas do mestre).

## Commit / PR
PR [#80](https://github.com/ZedroDacunha/Tabletop-RPG/pull/80).

## Notas relacionadas
- [[MEL-010 - Alinhamento em lote e modo apresentação]]
- [[MEL-015 - Viagem entre vistas com duração ajustável]]
- [[BUG-001 - Viagem entre vistas terminava no primeiro quadro]]

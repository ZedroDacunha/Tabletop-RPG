---
id: MEL-033
titulo: Tenda modelada em cinco partes, com prévia local por ângulos
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: modelagem 3D / acervo
arquivos-afetados: ['src/scene/tentModel.ts', 'src/scene/tentModel.test.ts', 'src/scene/detailedModels.ts', 'src/features/assets/detailedKinds.ts', 'src/features/projects/project.ts', 'scripts/preview-raster.ts', 'scripts/preview-model.ts', 'scripts/generate-asset-previews.ts', 'src/features/assets/modelPreviews.json', 'package.json', 'README.md']
tags: [melhoria, modelagem, 3d, ferramentas, testes]
relacionados: [MEL-001, MEL-016, MEL-032]
---
# MEL-033 — Tenda modelada em cinco partes, com prévia local por ângulos

## Resumo
A tenda deixou de ser um prisma extrudado e passou a ser montada em cinco partes independentes — `lona`, `estrutura`, `cordas`, `estacas` e `interior` — com panos costurados, beiral, portinhola e objetos dentro. Para julgar o resultado sem passar pelo navegador, o projeto ganhou um rasterizador em CPU reaproveitado das miniaturas e o comando `npm run modelo:previa`.

## Motivação
A tenda era a peça mais usada da categoria `Acampamento` e a mais pobre do acervo: um `extrudeGeometry` de um perfil, um painel escuro na frente, um mastro e duas vigas. De perto lia como caixa de papelão. A tarefa é começar a modelagem dos objetos pelas tendas, separando em partes para ganhar qualidade — e sem gastar 4 a 6 minutos de CI por tentativa, já que nesta etapa o que precisa de olho é a geometria, não o layout.

## Como era antes
- `case 'tent'` em `src/scene/Models.tsx` e em `AssetArt.tsx`: um `extrudeGeometry` de `tentShape` (profundidade 2,4) mais um `shapeGeometry` escuro na frente, um `Cylinder` de mastro e duas `Box` de base — seis peças soltas, todas do mesmo material.
- Nenhum beiral, nenhum pano separado, nenhuma corda, nenhuma estaca, nada dentro.
- A miniatura da biblioteca era gerada por um rasterizador dentro de `scripts/generate-asset-previews.ts`, sem como renderizar um modelo isolado em outro ângulo.
- Iterar no modelo exigia subir um site de captura no GitHub Actions e ler uma imagem baixada do artefato — duas rodadas de captura falharam nesse caminho.

## Como ficou agora
- `src/scene/tentModel.ts` monta a tenda em cinco partes: `lona` (encostas com quatro panos por lado, costuras, cumeeira, oitões, portinhola com rolo de lona e aba caída, saia no chão e remendos), `estrutura` (cumeeira, quatro pernas, prumos, sapatas e ponteiras), `cordas` (quatro esticadores com barriga e anéis), `estacas` (quatro estacas inclinadas) e `interior` (pano de fundo, pano de chão, saco de dormir e mochila).
- As peças são fundidas por `(parte, acabamento)` no fim: **14 malhas** e **3.336 triângulos** para o modelo inteiro, com limites `-1,69..1,69` em x, `-0,05..2,25` em y e `±2,41` em z (as estacas são o que passa da lona).
- A lona é superfície aberta: cada pano recebe `paraFora` e a ordem dos triângulos é invertida quando a malha nasce virada, então as duas encostas são iluminadas por fora em qualquer ângulo.
- Encontros com sobreposição em vez de topo com topo: beiral 8 cm por fora da parede e 12 cm abaixo do topo dela, oitão 8 cm abaixo do beiral, 3 cm de sobra nas pontas da lona e das paredes, paredes laterais encostando no chão.
- `scripts/preview-raster.ts` concentra o rasterizador ortográfico que já gerava as miniaturas; `scripts/generate-asset-previews.ts` passou a importá-lo e reproduziu as **37 miniaturas anteriores byte a byte**.
- `npm run modelo:previa -- tent 4 560` grava `capturas/modelo-tent-1..4.png` (azimutes distribuídos, elevação alternando 14°/26°) e imprime triângulos, número de malhas, quebra por parte e limites.
- `src/scene/tentModel.test.ts` com seis testes: orçamento de peças, peças internas contidas na lona, cobertura vista de fora, normais para fora, construção determinística e miniatura sem vazamento do interior. A bateria total passou a **57 testes**.

## O que foi feito
1. `src/scene/tentModel.ts`: modelo novo por partes, com helpers `superficie` (grade paramétrica com correção de winding por `paraFora`), `caixa`, `cilindro`, `anel`, `viga` e `estaca`, constantes `HALF_W 1,24`, `HALF_D 1,6`, `RIDGE 2,18`, `EAVE 0,62` e `DOOR_W 0,52`.
2. `src/scene/detailedModels.ts`: `if (kind === 'tent') return buildTentModel();`; `tent` entrou em `DETAILED_KINDS` e saiu da lista explícita de `KINDS` em `src/features/projects/project.ts` (estava duplicado, o que quebrou o teste de catálogo).
3. `case 'tent'` removido de `src/scene/Models.tsx` e de `AssetArt.tsx`: a peça agora vem do caminho detalhado, com sombra e materiais por parte.
4. `scripts/preview-raster.ts` extraído de `generate-asset-previews.ts` (`codificarPng`, `direcaoDeAngulos`, `renderModelPreview`) sem mudar um pixel da saída; `scripts/preview-model.ts` e o script `modelo:previa` no `package.json` são novos.
5. Correções encontradas com as prévias: pano de fundo do interior era mais alto que a cumeeira e furava a lona (virava um triângulo escuro visto de trás); panos de lona culled de metade dos ângulos; ondulação das encostas dependia da faixa e desalinhava as emendas; beiral, oitão e pontas encostavam de topo e abriam frestas de 1 px.
6. `capturas/` entrou no `.gitignore`: é saída de ferramenta, não arquivo do projeto.

## Decisões e alternativas descartadas
- **Captura no navegador via GitHub Actions**: duas tentativas falharam por artefato e custam 4 a 6 minutos por rodada; a opção escolhida foi validar modelagem com testes e miniaturas locais, reservando o navegador para UI/layout.
- **Modelar a tenda como um único `BufferGeometry`**: perderia a separação por partes, que é justamente o pedido, e impediria trocar acabamento por parte.
- **`DoubleSide` em toda a lona**: resolveria o avesso escuro ao custo de metade da iluminação ficar errada; a correção por `paraFora` mantém uma face por pano e o avesso culled.
- **Encostar beiral no topo da parede**: é o encontro natural, mas em amostragem de centro de pixel abre fresta; sobrepor custa 8 cm de lona e fecha.
- **Pano de chão removido para acabar com vazamentos**: ele é o que dá leitura ao interior visto pela portinhola, então ficou e os vazamentos foram fechados na lona.
- **Respiro do oitão (abertura de ventilação)**: chegou a ser modelado e foi removido por virar um recorte sem leitura na miniatura.

## Arquivos alterados
- `src/scene/tentModel.ts` (novo) e `src/scene/tentModel.test.ts` (novo).
- `src/scene/detailedModels.ts`, `src/features/assets/detailedKinds.ts`, `src/features/projects/project.ts`.
- `src/scene/Models.tsx`, `src/scene/AssetArt.tsx` (caso `tent` removido).
- `scripts/preview-raster.ts` (novo), `scripts/preview-model.ts` (novo), `scripts/generate-asset-previews.ts` (reescrito sobre o rasterizador comum).
- `src/features/assets/modelPreviews.json` (miniatura da tenda regerada), `package.json`, `.gitignore`, `README.md`.

## Impacto
A tenda passou de prisma de seis peças para modelo de cinco partes com beiral, costuras, cordas, estacas e interior, sem sair do orçamento de desenho das outras peças detalhadas (limite de 18 malhas no teste de catálogo). A ferramenta de prévia serve para as próximas peças: qualquer `kind` detalhado pode ser renderizado em ângulos arbitrários e medido em triângulos sem depender de navegador.

## Como validar
1. `npm run modelo:previa -- tent 4 560` e abrir os quatro PNGs em `capturas/`: nenhum ângulo pode mostrar o interior nem o avesso escuro da lona.
2. `npm test`: 57 testes passando, incluindo os seis de `tentModel.test.ts`.
3. `npm run assets:previews` e conferir `Tenda` na paleta: miniatura com beiral, cordas e estacas, sem triângulo escuro.
4. Arrastar uma tenda para o mapa e orbitar em volta: sombra no chão, portinhola com rolo de lona e pano de fundo escuro aparecendo pela abertura.
5. Trocar a miniatura antiga mentalmente pelo bloco de barro: a leitura de acampamento tem que ser imediata na escala de mapa.

## Próximos passos
- Levar as mesmas partes para a fogueira e o mastro de bandeira, que ainda são blocos.
- Aproveitar `scripts/preview-raster.ts` para um comparativo antes/depois automático no repositório.

## Commit / PR
Commits `2ee4725` e `0c63e97` na branch `arena/54e6d9a7-tabletop-rpg`.

## Notas relacionadas
- [[MEL-001 - Ambiência e acervo de 32 peças]]
- [[MEL-016 - Painel da biblioteca separado por função]]
- [[MEL-032 - Biblioteca com cabecalho unico e busca fixa]]

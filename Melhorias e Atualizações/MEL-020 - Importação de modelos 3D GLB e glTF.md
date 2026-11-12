---
id: MEL-020
titulo: Importação de modelos 3D GLB e glTF
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: assets 3D / arquivos
arquivos-afetados: ['src/features/assets/importer.ts', 'src/features/assets/catalog.ts', 'src/App.tsx', 'src/features/projects/project.ts']
tags: [melhoria, importacao, gltf, assets]
relacionados: [MEL-019, MEL-021]
---
# MEL-020 — Importação de modelos 3D GLB e glTF

## Resumo
Dá para trazer modelos próprios para o mapa: GLB autocontido ou glTF com seus `.bin` e texturas selecionados juntos. O modelo é **incorporado** ao projeto (texturas incluídas), então o mapa continua abrindo sozinho depois de exportado.

## Motivação
Peça procedural cobre o genérico; a mesa sempre tem aquele dragão, aquele barco, aquele móvel específico. Sem importar modelo, o mapa fica limitado ao acervo embutido.

## Como era antes
- Só o acervo embutido; nenhuma forma de usar um modelo externo.

## Como ficou agora
- `importModels(files)` aceita um lote de arquivos (GLB, glTF e dependências) e devolve `Asset[]` com `data` em data URL base64 — é isso que viaja no `.tabletop`.
- Limites: **25 MB por modelo** (`MAX_MODEL_BYTES`), **64 arquivos / 60 MB por lote**, **80 modelos por projeto** e 1.500 objetos.
- O glTF é carregado com `GLTFLoader` e um `LoadingManager` cujo `setURLModifier` **recusa** qualquer recurso externo que não venha no lote, com mensagem explícita.
- Depois de carregar, o modelo é reexportado como GLB binário (`GLTFExporter` com `binary: true`) — é assim que as texturas entram no arquivo único; se passar de 25 MB, a importação é recusada.
- `normalize` centraliza o modelo na origem e ajusta a escala para caber na grade, então ele nunca entra gigante nem fora do mapa.
- `loadAsset(asset)` mantém cache por data URL, para duplicar a mesma peça não recarregar o arquivo.
- Modelos importados aparecem na categoria **Importados** da biblioteca, com estado vazio orientando ("Sua coleção começa aqui").

## O que foi feito
1. `src/features/assets/importer.ts` com `MAX_MODEL_BYTES`, `importModels` e `loadAsset`.
2. `Asset` (`id`, `name`, `data`, `bytes`) no modelo do projeto; `validateProject` confere o prefixo `data:model/gltf-binary;base64,` e o tamanho de cada asset.
3. `addModels` em `src/App.tsx` lê o `<input type="file">`, chama `importModels` e insere a peça já selecionada no centro do mapa.
4. Erros de importação viram notificações com o motivo (arquivo grande, recurso externo faltando, geometria vazia).
5. Peças importadas são `kind: 'model'` com `assetId`, e o viewport resolve o objeto 3D por `loadAsset`.

## Decisões e alternativas descartadas
- **Guardar só o caminho do arquivo**: o navegador não tem acesso persistente ao disco do usuário; o arquivo precisa ser incorporado.
- **Aceitar `.obj`/`.fbx`**: exigiria outro carregador e materiais diferentes; glTF é o formato aberto com melhor suporte.
- **Suportar Draco/Meshopt/KTX2**: fora de escopo — exigiria decodificadores extras e mais memória; está documentado no README como limitação.
- **Deixar o glTF buscar texturas por URL**: quebraria offline e permitiria o arquivo apontar para a rede; o `setURLModifier` bloqueia.

## Arquivos alterados
- `src/features/assets/importer.ts`: `MAX_MODEL_BYTES`, `importModels`, `loadAsset`, `normalize`.
- `src/features/assets/catalog.ts`: categoria `Importados`.
- `src/features/projects/project.ts`: `Asset` no `Project` e validação dos data URLs.
- `src/App.tsx`: `addModels` e o fluxo de importação.

## Impacto
O mapa pode misturar acervo embutido e modelos próprios, tudo num arquivo só. É o que permite um trecho exportado levar junto os modelos que usa ([[MEL-011 - Exportar e importar trechos entre mapas]]).

## Como validar
1. Exportar um GLB de teste e importar: a peça entra no centro, selecionada, na categoria `Importados`.
2. Importar um glTF sem o `.bin`: mensagem de erro explicando o recurso faltante.
3. Exportar o `.tabletop`, recarregar o navegador, importar o arquivo: o modelo continua aparecendo.
4. Importar um arquivo acima de 25 MB: recusado com mensagem.

## Próximos passos
- Biblioteca de modelos compartilhada (fora deste escopo).
- Suporte a animação de personagens (documentado como fora desta versão).

## Commit / PR
PR [#1](https://github.com/ZedroDacunha/Tabletop-RPG/pull/1) — protótipo do editor de mapas (importação incluída).

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]
- [[MEL-021 - Salvamento local, autosave e arquivo .tabletop]]

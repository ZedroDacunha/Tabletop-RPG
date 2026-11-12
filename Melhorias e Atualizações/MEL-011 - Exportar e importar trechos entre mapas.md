---
id: MEL-011
titulo: Exportar e importar trechos entre mapas
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: arquivos / persistência
arquivos-afetados: ['src/features/projects/clip.ts', 'src/features/projects/clip.test.ts', 'src/App.tsx']
tags: [melhoria, arquivos, trechos, portabilidade]
relacionados: [MEL-005, MEL-014, MEL-003]
---
# MEL-011 — Exportar e importar trechos entre mapas

## Resumo
Selecionar peças e exportar como arquivo `.trecho` (JSON), para colar em outro mapa — inclusive em outro navegador ou noutra máquina. O trecho leva as peças, os grupos e os modelos importados usados.

## Motivação
A taverna montada num mapa serve de novo em outro. Exportar o mapa inteiro e recortar à mão não é caminho.

## Como era antes
- Só o mapa inteiro podia ser exportado/importado (`.tabletop`).
- Reaproveitar uma composição exigia reabrir o mapa antigo e recriar peça por peça.

## Como ficou agora
- `exportClip` gera `{format: 'trecho', version: 1, name, source, objects, groups, assets}` com as peças selecionadas, sem travar nada (`locked: false`).
- O arquivo se chama `<nome>.trecho` e é baixado pelo mesmo `downloadFile` do projeto.
- `insertClip` cola no mapa atual em `findFreeOrigin(...)`, com ids novos e grupos remapeados — colar duas vezes não cria conflito de grupo.
- Colar é **um** passo de histórico.
- `validateClip` recusa arquivo estranho com mensagem clara: formato/versão errados, nome vazio ou maior que 60, menos de 1 ou mais de 1.500 peças, arquivo acima de `MAX_CLIP_BYTES` (100 MB).

## O que foi feito
1. `src/features/projects/clip.ts` com `CLIP_FORMAT`, `buildClip`, `pasteClip`, `clipCenter`, `MAX_CLIP_BYTES` e `validateClip`.
2. `buildClip` filtra também os grupos e os assets referenciados pelas peças, para o trecho ser autossuficiente.
3. `pasteClip(clip, origin, id)` desloca todas as posições pela origem e troca os ids (peças e grupos) por ids novos.
4. `exportClip`/`insertClip`/`openClip` em `src/App.tsx`, reaproveitando a validação de projeto (`validateProject`) por dentro do `validateClip`.
5. Testes em `clip.test.ts`: montagem, colagem com deslocamento, remapeamento de grupo e recusa de arquivo inválido.

## Decisões e alternativas descartadas
- **Área de transferência do sistema**: não sobrevive entre navegadores e não guarda assets; o arquivo é explícito e reimportável.
- **Guardar só as peças (sem grupos/assets)**: colaria peças cinzas quando o trecho usasse modelo importado; assets entram no pacote.
- **Prestar ids originais**: colidiria com ids já existentes no mapa de destino; remapear é obrigatório.

## Arquivos alterados
- `src/features/projects/clip.ts`: `CLIP_FORMAT`, `Clip`, `buildClip`, `pasteClip`, `clipCenter`, `MAX_CLIP_BYTES`, `validateClip`.
- `src/features/projects/clip.test.ts`: testes das funções puras.
- `src/App.tsx`: `exportClip`, `insertClip`, `openClip`.

## Impacto
Reaproveitamento entre mapas e entre pessoas. A mesma estrutura de dados virou a base dos trechos salvos no navegador ([[MEL-014 - Meus trechos salvos no navegador]]).

## Como validar
1. Selecionar um conjunto, exportar: baixa `Nome.trecho`.
2. Criar um mapa novo e importar o arquivo: as peças entram numa área livre, com os grupos recriados.
3. Importar duas vezes: as cópias não se sobrepõem nem compartilham grupo.
4. Editar o arquivo e trocar `format`: a importação recusa com mensagem.

## Próximos passos
- Trechos como biblioteca compartilhável por link.

## Commit / PR
PR [#79](https://github.com/ZedroDacunha/Tabletop-RPG/pull/79).

## Notas relacionadas
- [[MEL-014 - Meus trechos salvos no navegador]]
- [[MEL-005 - Seleção múltipla de peças]]

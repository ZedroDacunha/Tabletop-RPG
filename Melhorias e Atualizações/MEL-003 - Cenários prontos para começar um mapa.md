---
id: MEL-003
titulo: Cenários prontos para começar um mapa
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: cena 3D / conteúdo
arquivos-afetados: ['src/features/scenes/presets.ts', 'src/features/scenes/presets.test.ts', 'src/App.tsx', 'src/styles.css']
tags: [melhoria, presets, conteudo, cena3d]
relacionados: [MEL-001, MEL-004]
---
# MEL-003 — Cenários prontos para começar um mapa

## Resumo
Cinco cenários prontos (`Clareira na floresta`, `Acampamento de expedição`, `Ruína esquecida`, `Santuário antigo`, `Lagoa tranquila`) colocam dezenas de peças já posicionadas numa área livre do mapa, com um passo de desfazer.

## Motivação
Começar um mapa do zero é a parte mais lenta. Um mapa em branco com 32 peças disponíveis não diz por onde começar; um cenário montado diz "ajuste daqui".

## Como era antes
- Só era possível inserir peças uma a uma (`place`), sem noção de composição.
- Quem quisesse uma clareira montava a clareira peça por peça, toda vez.

## Como ficou agora
- Aba **Cenários** na biblioteca com cinco cartões (nome, descrição e ícone).
- `insertPreset` monta o cenário em `findFreeOrigin(...)`, que acha um canto livre em vez de empilhar tudo na origem.
- O cenário inteiro entra como um único passo de histórico: `Ctrl+Z` remove tudo de uma vez.
- `buildPreset` recebe a origem e devolve `Entity[]` completas (id, nome, cor, escala e rotação), então o resultado é editável peça por peça.

## O que foi feito
1. `presets`: lista tipada `ScenePreset` (id, nome, descrição, ícone e `items` com `kind`, `x`, `z`, escala e rotação opcionais).
2. `buildPreset(preset, origin)`: converte `items` em `Entity[]` deslocadas para a origem.
3. `findFreeOrigin(objects, radius, size)`: procura em anéis a partir do centro até achar espaço com folga.
4. `insertPreset` em `src/App.tsx`: escolhe origem, concatena e registra um passo de histórico.
5. Cartões da aba `Cenários` com `styles.css` próprio.

## Decisões e alternativas descartadas
- **Colar sempre no centro**: descartado; cenário em cima do que já existe gera sobreposição impossível de desfazer peça por peça.
- **Cenário como arquivo `.tabletop` separado**: exigiria importar antes de usar; manter `items` no código deixa os presets disponíveis offline e no teste de unidade.
- **Cenário travado**: o cenário entra destravado, para servir de ponto de partida.

## Arquivos alterados
- `src/features/scenes/presets.ts`: `presets`, `buildPreset`, `findFreeOrigin`.
- `src/features/scenes/presets.test.ts`: contagem de peças, deslocamento pela origem e escolha de área livre.
- `src/App.tsx`: `insertPreset` e o painel de cenários.
- `src/styles.css`: cartões de cenário.

## Impacto
Um mapa apresentável em um clique. Os cenários também padronizam composições entre mapas, o que ajuda quem joga na mesma campanha.

## Como validar
1. Abrir a aba `Cenários` e inserir `Clareira na floresta` num mapa vazio: as peças aparecem em volta do centro.
2. Inserir o mesmo cenário de novo: as peças da segunda cópia ficam ao lado, sem sobrepor.
3. `Ctrl+Z`: a segunda cópia sai inteira, num passo.
4. `npm test` cobre `presets.test.ts`.

## Próximos passos
- Cenário derivado da seleção atual ("salvar como cenário").

## Commit / PR
PR [#71](https://github.com/ZedroDacunha/Tabletop-RPG/pull/71).

## Notas relacionadas
- [[MEL-001 - Ambiência e acervo de 32 peças]]
- [[MEL-011 - Exportar e importar trechos entre mapas]]

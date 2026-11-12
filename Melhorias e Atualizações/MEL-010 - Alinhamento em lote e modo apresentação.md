---
id: MEL-010
titulo: Alinhamento em lote e modo apresentação
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: editor / apresentação
arquivos-afetados: ['src/features/projects/project.ts', 'src/App.tsx', 'src/editor/Inspector.tsx']
tags: [melhoria, alinhamento, apresentacao, tela-cheia]
relacionados: [MEL-005, MEL-007, MEL-012]
---
# MEL-010 — Alinhamento em lote e modo apresentação

## Resumo
Duas entregas juntas: alinhar/distribuir a seleção num eixo com um clique e um **modo apresentação** (`P`) que esconde toda a interface e deixa só o mapa, em tela cheia.

## Motivação
- Fileira de árvores e fileira de mesas precisam de precisão que o olho não dá; alinhar à mão peça por peça era o gargalo da composição.
- Na mesa, o editor com painéis não serve para mostrar o mapa aos jogadores: precisa de tela limpa.

## Como era antes
- Alinhamento só movendo peça por peça com a régua ([[MEL-007 - Régua e encaixe entre vizinhas]]).
- Nenhuma forma de ver o mapa sem os painéis, a não ser diminuir o zoom do navegador.

## Como ficou agora
- `alignSelection('x' | 'y' | 'z')` encosta as peças selecionadas no valor da primeira peça destravada da seleção, que serve de referência.
- `distributeSelection('x' | 'z')` espalha as peças com espaçamento igual entre a primeira e a última, arredondando para 3 casas.
- As duas ações aparecem no inspetor em modo lote, com `Esc` limpando a seleção.
- `P` entra no modo apresentação: painéis somem, a cena ocupa a tela e pede tela cheia; `P` ou `Esc` sai.
- Peças travadas são ignoradas nas duas operações, então uma trava funciona como âncora.

## O que foi feito
1. `alignEntities(objects, ids, axis)` e `distributeEntities(objects, ids, axis)` em `src/features/projects/project.ts`, puros e sem mutação do array original.
2. Regras de mínimo: alinhar exige 2 peças destravadas, distribuir exige 3 — abaixo disso a função devolve o estado intacto, em vez de inventar posição.
3. `alignSelection`/`distributeSelection` em `src/App.tsx`, cada uma registrando um passo de histórico.
4. `enterShowcase`/`exitShowcase` com `requestFullscreen` (falha silenciosa quando o navegador recusa) e classe no `body` para esconder a interface.
5. O handler de teclado trata o modo apresentação antes de qualquer outro atalho, para não misturar os dois contextos.

## Decisões e alternativas descartadas
- **Alinhar pela média**: desloca tudo e nunca fica onde o usuário espera; a primeira peça destravada é previsível e visível.
- **Distribuir por distância fixa**: pediria um campo a mais; distribuir no intervalo existente é o caso real (esquadrar uma fileira).
- **Modo apresentação em janela nova**: perderia o estado da câmera e o WebGL do contexto atual; esconder a interface é mais barato e instantâneo.

## Arquivos alterados
- `src/features/projects/project.ts`: `alignEntities`, `distributeEntities`.
- `src/App.tsx`: `alignSelection`, `distributeSelection`, `enterShowcase`, `exitShowcase`, atalho `P`.
- `src/editor/Inspector.tsx`: botões de alinhar/distribuir no modo lote.

## Impacto
Composições retas em segundos e um jeito de mostrar o mapa na mesa. O modo apresentação abriu caminho para o roteiro de vistas ([[MEL-012 - Roteiro de apresentação com vistas navegáveis]]).

## Como validar
1. Selecionar quatro peças em zigue-zague e clicar em alinhar no eixo Z: todas ficam na mesma linha.
2. Selecionar cinco peças e distribuir em X: os vãos ficam iguais.
3. Travar uma peça da seleção e alinhar: a travada não se mexe.
4. `P`: painéis somem e a cena ocupa a tela; `Esc` volta ao editor com a seleção intacta.

## Próximos passos
- Alinhar também em relação ao centro do mapa (hoje a referência é a primeira peça).

## Commit / PR
PR [#78](https://github.com/ZedroDacunha/Tabletop-RPG/pull/78).

## Notas relacionadas
- [[MEL-005 - Seleção múltipla de peças]]
- [[MEL-012 - Roteiro de apresentação com vistas navegáveis]]

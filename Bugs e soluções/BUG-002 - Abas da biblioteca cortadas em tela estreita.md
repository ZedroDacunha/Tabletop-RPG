---
id: BUG-002
titulo: Abas da biblioteca cortadas em tela estreita
status: resolvido
severidade: média
data-encontrado: 2026-11-11
data-resolvido: 2026-11-11
area: interface
arquivos-afetados: ['src/styles.css']
tags: [bug, interface, responsivo]
relacionados: [MEL-016]
---
# BUG-002 — Abas da biblioteca cortadas em tela estreita

## Resumo
Com a janela em ~900 px, a primeira aba da biblioteca aparecia cortada ("Bibliot|eca") e as três abas não cabiam no painel de 220 px.

## Contexto
O usuário mandou uma captura do painel esquerdo mostrando as abas cortadas e o rodapé com três caixas de importação empilhadas, pedindo para separar as funções.

## Comportamento esperado
As três abas (`Biblioteca`, `Cena`, `Cenários`) inteiras em qualquer largura suportada.

## Comportamento atual (o bug)
`.library-tabs` tinha `gap: 21px` e `padding: 0 18px` fixos, com ícone em cada aba. Somando os três rótulos e os ícones, a barra pedia ~307 px num painel de 220 px e estourava.

## Passos para reproduzir
1. Abrir o editor numa janela de ~900 px de largura.
2. Olhar a barra de abas da biblioteca.

## Causa raiz
Nenhuma regra responsiva para a barra de abas: os tamanhos eram fixos e iguais em qualquer largura, enquanto a coluna da biblioteca encolhe (270 → 234 → 220 → 180 px).

## Solução aplicada
As abas perdem peso conforme o painel encolhe:

```css
/* DEPOIS — src/styles.css */
@media (max-width:1200px) { .library-tabs { gap:12px; padding:0 12px } .library-tabs>button { font-size:10px } }
@media (max-width:950px)  { .library-tabs { gap:10px; padding:0 10px } .library-tabs>button svg { display:none } }
@media (max-width:650px)  { .library-tabs { gap:8px;  padding:0 8px  } .library-tabs>button span { display:none } }
```

## Arquivos alterados
- `src/styles.css`: regras de aba por largura (ícones somem em ≤950 px, contador em ≤650 px).

## Como validar
No navegador, em 1440 × 900 e 900 × 760, medir `scrollWidth` da barra (≤ 1 px de estouro) e a borda direita de cada botão contra a da barra: nenhum pode passar. O teste de verificação cobre as duas larguras.

## Prevenção / lições aprendidas
- Ícone + rótulo + contador é caro; em painel estreito o rótulo é o que importa.
- Medir estouro (`scrollWidth` vs `clientWidth`) é mais confiável que olhar a captura.

## Commit / PR
PR [#84](https://github.com/ZedroDacunha/Tabletop-RPG/pull/84) — painel da biblioteca separado por função.

## Notas relacionadas
- [[MEL-016 - Painel da biblioteca separado por função]]

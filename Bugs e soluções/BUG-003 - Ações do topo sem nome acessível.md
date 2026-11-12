---
id: BUG-003
titulo: Ações do topo sem nome acessível em tela estreita
status: resolvido
severidade: média
data-encontrado: 2026-11-11
data-resolvido: 2026-11-11
area: interface / acessibilidade
arquivos-afetados: ['src/App.tsx']
tags: [bug, interface, acessibilidade]
relacionados: [MEL-017]
---
# BUG-003 — Ações do topo sem nome acessível em tela estreita

## Resumo
Abaixo de 950 px os botões do cabeçalho ficam só com ícone e passavam a não ter nome para leitores de tela (nem `title` para o mouse).

## Contexto
Ao agrupar `Abrir` e `Exportar` no menu `Arquivo` ([[MEL-017 - Menu Arquivo no topo]]), a revisão do CSS do cabeçalho mostrou que o rótulo é escondido com `display:none`.

## Comportamento esperado
Todo botão com rótulo escondido por CSS continua anunciando o que faz.

## Comportamento atual (o bug)
`display:none` remove o texto da árvore de acessibilidade: em telas estreitas os botões `Meus mapas`, `Novo mapa` e `Abrir` ficavam sem nome acessível e sem dica visual.

## Passos para reproduzir
1. Abrir o editor com a janela abaixo de 950 px.
2. Inspecionar os botões de ação do topo.
3. Observar que só existe o `<svg>`; o `<span>` do rótulo está com `display:none`.

## Causa raiz
O rótulo era o único nome do botão, e a regra responsiva o desliga visualmente sem substituto.

## Solução aplicada
`aria-label` explícito em cada ação do topo:

```tsx
// DEPOIS — src/App.tsx
<button className="quiet-button" aria-label="Meus mapas" onClick={() => void openMaps()}>
<button className="quiet-button" aria-label="Novo mapa" onClick={() => { setNewName('Meu novo mundo'); setModal('new') }}>
<button className="quiet-button" aria-haspopup="menu" aria-expanded={openMenu === 'file'} aria-label="Arquivo" …>
```

## Arquivos alterados
- `src/App.tsx`: `aria-label` nas ações do cabeçalho (e `aria-haspopup`/`aria-expanded` no menu).

## Como validar
Em 900 px, garantir que todo `button` dentro de `.header-actions` tenha `aria-label` ou texto visível. O teste de navegador falha se algum ficar sem nome.

## Prevenção / lições aprendidas
- Se o CSS pode esconder um rótulo, o nome acessível precisa estar no atributo, não no texto.
- Vale a mesma regra para qualquer botão "só ícone".

## Commit / PR
PR [#85](https://github.com/ZedroDacunha/Tabletop-RPG/pull/85) — menu Arquivo no topo.

## Notas relacionadas
- [[MEL-017 - Menu Arquivo no topo]]
- [[BUG-002 - Abas da biblioteca cortadas em tela estreita]]

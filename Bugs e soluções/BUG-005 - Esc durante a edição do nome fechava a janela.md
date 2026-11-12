---
id: BUG-005
titulo: Esc durante a edição do nome fechava a janela
status: resolvido
severidade: baixa
data-encontrado: 2026-11-11
data-resolvido: 2026-11-11
area: interface / modais
arquivos-afetados: ['src/editor/Modal.tsx', 'src/App.tsx']
tags: [bug, interface, modais, teclado]
relacionados: [MEL-026]
---
# BUG-005 — Esc durante a edição do nome fechava a janela

## Resumo
Ao renomear um mapa, apertar `Esc` para cancelar a edição fechava a janela `Meus mapas` inteira, em vez de só desfazer o que estava sendo digitado.

## Contexto
Encontrado na verificação de navegador de [[MEL-026 - Renomear mapa direto no cartão]]: o teste que digitava um nome errado e apertava `Esc` não achava mais o campo — a janela tinha desaparecido.

## Comportamento esperado
`Esc` em um campo em edição desfaz a edição e mantém a janela aberta. `Esc` fora de um campo em edição fecha a janela, como sempre.

## Comportamento atual (o bug)
`Esc` fechava a janela em qualquer ponto, inclusive com o cursor dentro do campo de renomear.

## Passos para reproduzir
1. Abrir `Meus mapas`.
2. Clicar no nome de um mapa e digitar qualquer coisa.
3. Apertar `Esc`.

## Causa raiz
`Modal` registra um listener de `keydown` em `document` **na fase de captura** (`addEventListener('keydown', handler, true)`) para fechar no `Esc`. Captura no `document` acontece antes de qualquer `onKeyDown` do React, então o `stopPropagation()` do campo chegava tarde: a janela já estava fechando.

## Solução aplicada
O modal passou a respeitar campos que pedem o `Esc` para si:

```tsx
// ANTES — src/editor/Modal.tsx
const handler=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose()}

// DEPOIS
const handler=(e:KeyboardEvent)=>{
 const alvo=e.target as HTMLElement|null;
 if(e.key==='Escape'){
  if(alvo?.closest('[data-escape-local]'))return;   // o campo cuida do Esc
  e.stopPropagation();onClose();
 }
```

```tsx
// src/App.tsx — o campo de renomear do cartão
<input className="map-name" data-escape-local="true"
 onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();
   else if(e.key==='Escape'){e.currentTarget.value=m.name;e.currentTarget.blur()}}} … />
```

## Arquivos alterados
- `src/editor/Modal.tsx`: verificação de `data-escape-local` no handler de `Esc`.
- `src/App.tsx`: atributo no campo de renomear do cartão.

## Como validar
1. `Meus mapas` → clicar no nome → digitar → `Esc`: o valor volta e a janela continua.
2. `Esc` com o foco fora do campo: a janela fecha.
3. `Tab` continua ciclando o foco dentro da janela (o comportamento de armadilha de foco não mudou).

## Prevenção / lições aprendidas
- Listener de captura no `document` vence componente: quem escuta cedo precisa filtrar o alvo, não esperar `stopPropagation`.
- Teste de navegador "digitou, apertou Esc, o campo tinha de continuar ali" pegou isso na primeira execução — teste de unidade não pegaria.

## Commit / PR
PR [#89](https://github.com/ZedroDacunha/Tabletop-RPG/pull/89).

## Notas relacionadas
- [[MEL-026 - Renomear mapa direto no cartão]]
- [[BUG-003 - Ações do topo sem nome acessível]]

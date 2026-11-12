---
id: BUG-004
titulo: Troca de mapa descartava alterações pendentes do mapa que saía
status: resolvido
severidade: alta
data-encontrado: 2026-11-11
data-resolvido: 2026-11-11
area: persistência / biblioteca de mapas
arquivos-afetados: ['src/App.tsx']
tags: [bug, persistencia, autosave]
relacionados: [MEL-009]
---
# BUG-004 — Troca de mapa descartava alterações pendentes do mapa que saía

## Resumo
Trocar de mapa logo depois de editar podia perder as últimas alterações: o salvamento automático é adiado em 850 ms e a troca acontecia antes dele.

## Contexto
Encontrado durante a entrega de [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]], quando passou a ser possível abrir outro mapa sem recarregar a página.

## Comportamento esperado
Ao abrir outro mapa (ou criar, ou abrir o exemplo), o mapa atual é gravado antes, com todas as edições feitas até ali.

## Comportamento atual (o bug)
O autosave vive num efeito com `setTimeout` de 850 ms. Ao substituir o mapa antes do disparo, o timer escrevia o **mapa novo** no lugar do antigo e as alterações pendentes do mapa que saía nunca chegavam ao IndexedDB.

## Passos para reproduzir
1. Abrir um mapa, mover uma peça e, em menos de 850 ms, abrir outro mapa pela biblioteca.
2. Voltar ao primeiro mapa.
3. A alteração sumiu.

## Causa raiz
A troca de mapa chamava `replaceProject` direto, sem esperar o salvamento pendente. O estado "sujo" (`dirty`) era do mapa anterior; depois da troca, o efeito reagendava com o mapa novo.

## Solução aplicada
Um `flushSave` que força o salvamento quando há alteração pendente, chamado antes de qualquer troca:

```ts
// src/App.tsx
const flushSave = useCallback(async () => { if (dirty.current) await persist(); }, [persist]);

// ANTES
async function openMap(id: string) { …; const parsed = await loadProject(id); replaceProject(parsed); … }

// DEPOIS
async function openMap(id: string) { …; await flushSave(); const parsed = await loadProject(id); replaceProject(parsed); … }
```

O mesmo `await flushSave()` foi aplicado em `createMap`, `openExample` e `openProject`.

## Arquivos alterados
- `src/App.tsx`: `flushSave` e as quatro chamadas antes de `replaceProject`.

## Como validar
- Editar, trocar de mapa em menos de 850 ms, voltar e conferir a alteração.
- O teste de navegador de [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]] cobre a troca com alterações pendentes.

## Prevenção / lições aprendidas
- Salvamento adiado + navegação = sempre `flush` antes de trocar de contexto.
- O mesmo cuidado vale para fechar a aba (`beforeunload` avisa, mas não salva).

## Commit / PR
PR [#77](https://github.com/ZedroDacunha/Tabletop-RPG/pull/77) — Meus mapas.

## Notas relacionadas
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]]
- [[BUG-001 - Viagem entre vistas terminava no primeiro quadro]]

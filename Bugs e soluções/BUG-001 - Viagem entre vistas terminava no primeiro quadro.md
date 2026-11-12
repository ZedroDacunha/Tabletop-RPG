---
id: BUG-001
titulo: Viagem entre vistas terminava no primeiro quadro
status: resolvido
severidade: alta
data-encontrado: 2026-11-11
data-resolvido: 2026-11-11
area: apresentação / câmera
arquivos-afetados: ['src/scene/Viewport.tsx', 'src/features/scenes/views.ts']
tags: [bug, camera, apresentacao]
relacionados: [MEL-015]
---
# BUG-001 — Viagem entre vistas terminava no primeiro quadro

## Resumo
A transição entre vistas do roteiro parecia um corte seco: a câmera chegava ao destino no primeiro quadro, mesmo com tempo de viagem configurado.

## Contexto
Depois de entregar o seletor de tempo por vista ([[MEL-015 - Viagem entre vistas com duração ajustável]]), a verificação em navegador mediu o quadro renderizado 0,7 s depois de iniciar uma viagem de 3 s e encontrou a câmera já no enquadramento final.

## Comportamento esperado
Com 3 s de viagem, a câmera deveria percorrer o caminho por ~3 s, com quadros intermediários.

## Comportamento atual (o bug)
O primeiro quadro já usava `progresso = 1`, então a interpolação pulava direto para o fim — visualmente igual a `0 s`.

## Passos para reproduzir
1. Salvar duas vistas com enquadramentos bem diferentes.
2. Dar 3 s de viagem para a segunda.
3. Entrar no modo apresentação e avançar de vista.
4. Observar que a câmera corta, não viaja.

## Causa raiz
A duração era guardada em **segundos**, mas o tempo decorrido vinha de `performance.now()` em **milissegundos**. A conta `(agora - início) / duração` dava valores ≥ 1000 vezes maiores, então o `Math.min(1, …)` saturava em 1 imediatamente.

## Solução aplicada
A conta saiu do componente e virou função testável, com a conversão explícita:

```ts
// ANTES — dentro do useFrame
const progress = anim.duration > 0
  ? Math.min(1, (performance.now() - anim.start) / anim.duration)
  : 1;
```

```ts
// DEPOIS — src/features/scenes/views.ts
export function travelProgress(startedAt: number, now: number, seconds: number): number {
  if (!(seconds > 0)) return 1;
  const elapsed = Number.isFinite(now - startedAt) ? now - startedAt : seconds * 1000;
  return Math.min(1, Math.max(0, elapsed / (seconds * 1000)));
}
```

```ts
// src/scene/Viewport.tsx
const progress = travelProgress(anim.start, performance.now(), anim.duration);
camera.position.lerpVectors(anim.fromPosition, anim.toPosition, easeInOut(progress));
```

## Arquivos alterados
- `src/scene/Viewport.tsx`: a conta do progresso passa a usar `travelProgress` e `easeInOut`.
- `src/features/scenes/views.ts`: novas funções `travelProgress` e `easeInOut`.
- `src/features/scenes/views.test.ts`: casos para 0 s, metade, fim e valores fora da faixa.

## Como validar
- Teste de unidade: `travelProgress(0, 1500, 3) === 0.5`, `travelProgress(0, 3000, 3) === 1`, `travelProgress(0, 500, 0) === 1`.
- Navegador: com 3 s de viagem, o teste conta **5 quadros distintos** entre o início e o fim, e o meio não coincide com nenhum dos dois.

## Prevenção / lições aprendidas
- Unidade de tempo é contrato: quem recebe segundos converte uma vez, num lugar só, com nome que diga isso (`seconds`).
- Teste de navegador com amostragem no meio do movimento pega esse tipo de erro em segundos; teste de unidade impede que volte.

## Commit / PR
PR [#83](https://github.com/ZedroDacunha/Tabletop-RPG/pull/83) — viagem suave entre as vistas.

## Notas relacionadas
- [[MEL-015 - Viagem entre vistas com duração ajustável]]
- [[MEL-012 - Roteiro de apresentação com vistas navegáveis]]

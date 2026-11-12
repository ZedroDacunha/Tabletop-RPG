---
id: MEL-025
titulo: Publicação automática e recarga no dev
tipo: funcionalidade
status: concluída
data: 2026-11-11
area: infraestrutura / publicação
arquivos-afetados: ['.github/workflows/publicar.yml', 'vite.config.ts', 'README.md']
tags: [melhoria, publicacao, ci, vite]
relacionados: [MEL-019]
---
# MEL-025 — Publicação automática e recarga no dev

## Resumo
Todo `push` na `main` compila, testa e publica o site no GitHub Pages; e o `npm run dev` recarrega a página a cada mudança, inclusive pela prévia remota.

## Motivação
Duas fricções do dia a dia: subir o site exigia build manual, e o servidor de desenvolvimento não recarregava quando rodava fora do disco local (a prévia remota via o arquivo parado).

## Como era antes
- Site publicado só por build manual.
- Recarga automática dependia de eventos do sistema de arquivos, que não chegam em volumes virtuais; editar não atualizava a página.
- Nenhum teste rodava no caminho de publicação: dava para publicar quebrado.

## Como ficou agora
- Workflow `.github/workflows/publicar.yml` disparado por `push` em `main` (e `workflow_dispatch`): `npm ci` → `npm test` → `npm run build` → `dist/index.html` copiado para `dist/404.html` → `configure-pages` → `upload-pages-artifact` → `deploy-pages`.
- Permissões mínimas (`contents: read`, `pages: write`, `id-token: write`) e `concurrency: pages` com `cancel-in-progress`, para dois pushes seguidos não brigarem.
- `base` calculado em `vite.config.ts`: no GitHub Actions vira `/<nome-do-repositório>/`, fora dele fica `/`; `VITE_BASE` permite forçar.
- Dev e preview escutam em `0.0.0.0`, com `allowedHosts: true`, então a prévia remota (e o iframe dela) funcionam.
- `watch: { usePolling: true, interval: 300 }` — recarga por polling, que funciona mesmo sem eventos do sistema de arquivos.
- `404.html` garante que o Pages não devolva 404 em rota interna.

## O que foi feito
1. Workflow com `setup-node` 22 e cache npm, e os testes como etapa obrigatória antes do build.
2. `base` dinâmico no `vite.config.ts`, comentado, para o mesmo código servir local e no Pages.
3. Configuração de `server`/`preview` com host `0.0.0.0`, `allowedHosts` e polling de 300 ms.
4. `npm run dev` e `npm run preview` já saem com `--host 0.0.0.0` (scripts do `package.json`).
5. README com a seção "Atualização automática" explicando o ciclo `npm run dev` → `git push`.

## Decisões e alternativas descartadas
- **Publicar por `gh-pages` com branch de build**: o Pages por Actions dispensa branch de artefato e roda os testes antes de publicar.
- **Publicar em `docs/`**: commitaria build no repositório.
- **Confiar na recarga nativa do Vite**: não funciona em volume montado; o polling resolve com uma linha.

## Arquivos alterados
- `.github/workflows/publicar.yml`: pipeline de build e deploy.
- `vite.config.ts`: `base` dinâmico, `server`/`preview` com host e polling.
- `package.json`: `--host 0.0.0.0` nos scripts `dev` e `preview`.
- `README.md`: seção "Atualização automática".

## Impacto
O site publicado acompanha a `main` sozinho — todas as entregas seguintes foram ao ar sem passo manual. A recarga por polling é o que torna o trabalho pela prévia remota viável.

## Como validar
1. `npm run dev` e abrir o endereço: editar um texto em `src/` atualiza a página sozinho.
2. `git push` na `main`: a aba **Actions** mostra "Publicar site" e o site atualiza em 1–2 min.
3. Quebrar um teste de propósito e dar push: o workflow para antes do deploy.
4. Abrir o site publicado e navegar numa rota interna: cai no `index.html` (por causa do `404.html`).

## Próximos passos
- Verificações de navegador (Puppeteer) no próprio workflow, hoje executadas fora dele.

## Commit / PR
PR [#2](https://github.com/ZedroDacunha/Tabletop-RPG/pull/2) — publicação automática e recarga no dev.

## Notas relacionadas
- [[MEL-019 - Editor 3D base do projeto]]

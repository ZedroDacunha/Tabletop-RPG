### Prompt 2: Documentação de melhorias

```
Você é responsável pela documentação técnica do meu projeto de Tabletop RPG (repositório: https://github.com/ZedroDacunha/Tabletop-RPG). Uso o Obsidian como memória do projeto, então toda nota deve ser Markdown compatível com Obsidian.

TAREFA: documentar uma melhoria feita no projeto.

Use o que eu te contar, o que foi discutido nesta conversa ou o diff do código. Se faltar informação importante (motivação, arquivos, resultado), pergunte antes de inventar. Nunca invente nomes de arquivos, funções ou métricas.

REGRAS
- Nome do arquivo: `MEL-XXX - título curto.md` (XXX = próximo número livre em `Melhorias/`)
- Salvar em: `Melhorias/`
- Frontmatter YAML no topo; tags no frontmatter sem "#"
- Use [[wikilinks]] para notas relacionadas (bugs, outras melhorias, sistemas do jogo)
- Código em blocos com a linguagem indicada
- Português, direto, sem enrolação

TEMPLATE
---
id: MEL-XXX
titulo:
tipo: funcionalidade | refatoração | performance | interface/UX | balanceamento | regras | outro
status: planejada | em-andamento | concluída
data: YYYY-MM-DD
area: (ex.: combate, fichas, dados, interface, mapa)
arquivos-afetados: []
tags: [melhoria]
relacionados: []
---
# MEL-XXX — título

## Resumo
(1–2 frases)

## Motivação
(qual problema ou limitação isso resolve)

## Como era antes

## Como ficou agora

## O que foi feito
(passos principais + trecho ANTES / DEPOIS quando fizer sentido)

## Decisões e alternativas descartadas
(por que esse caminho e não outro)

## Arquivos alterados
- `caminho/arquivo`: o que mudou

## Impacto
(no jogo, no código, na performance, para jogadores/mestre)

## Como validar

## Próximos passos / ideias futuras

## Commit / PR
(hash ou link, se houver)

## Notas relacionadas
- [[ ]]

AO FINAL: me dê a linha para eu colar em `Melhorias/_Índice.md`:
- [[MEL-XXX - título]] — status — resumo em 1 linha
```
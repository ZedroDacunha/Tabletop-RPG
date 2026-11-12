# Melhorias — índice

Notas de `Melhorias e Atualizações/`, escritas a partir do modelo em [[Melhorias e Atualizações]].

Total: **27** notas.

---

## Base do projeto (PRs #1–#2)

O repositório salta de #2 para #51: as PRs #3–#50 não existem, então a base está documentada por funcionalidade, com a PR de origem em cada nota.

- [[MEL-019 - Editor 3D base do projeto]] — concluída — O protótipo que deu origem a tudo: editor de mapas 3D no navegador em React + Three.js, com biblioteca de 15 peças, câmera orbital, grade com snap, ferramentas de transformação, painel de propriedades, cenário de exemplo e salvamento local.
- [[MEL-020 - Importação de modelos 3D GLB e glTF]] — concluída — Dá para trazer modelos próprios para o mapa: GLB autocontido ou glTF com seus `.bin` e texturas selecionados juntos. O modelo é **incorporado** ao projeto (texturas incluídas), então o mapa continua abrindo sozinho depois de exportado.
- [[MEL-021 - Salvamento local, autosave e arquivo .tabletop]] — concluída — O mapa se salva sozinho no navegador (IndexedDB) enquanto você edita, e pode ser exportado/importado como arquivo `.tabletop` com modelos incorporados.
- [[MEL-022 - Desfazer e refazer com histórico limitado]] — concluída — `Ctrl`/`⌘` + `Z` desfaz e `Ctrl`/`⌘` + `Shift` + `Z` refaz, com até **40 estados** por mapa; cada ação da interface vira um passo, e o histórico é zera em cada mapa aberto.
- [[MEL-023 - Câmera orbital, vistas de topo e exportar imagem]] — concluída — Câmera orbital com painel e rotação no botão direito, alternância perspectiva/topo, "centralizar", foco na peça selecionada (`F`) e exportação do mapa como imagem (`PNG` no 3D, `SVG` no modo compatível).
- [[MEL-024 - Modo de compatibilidade sem WebGL]] — concluída — Sem WebGL (máquina virtual, navegador restrito, driver bloqueado), o editor abre um mapa esquemático em SVG isométrico: dá para selecionar, posicionar, editar propriedades e exportar a imagem — sem prometer 3D.
- [[MEL-025 - Publicação automática e recarga no dev]] — concluída — Todo `push` na `main` compila, testa e publica o site no GitHub Pages; e o `npm run dev` recarrega a página a cada mudança, inclusive pela prévia remota.

## Editor de mapas (PRs #51–#90)

- [[MEL-001 - Ambiência e acervo de 32 peças]] — concluída — A cena deixou de ser um plano cinza: ganhou céu em gradiente, sol ou lua, estrelas, colinas no horizonte, névoa e chão com textura — e o catálogo foi para 32 peças 3D divididas em cinco categorias.
- [[MEL-002 - Gizmo preso ao objeto selecionado]] — concluída — Mover, girar e escalar passaram a ter alças 3D (`TransformControls`) ancoradas na peça selecionada, discretas e com encaixe na grade.
- [[MEL-003 - Cenários prontos para começar um mapa]] — concluída — Cinco cenários prontos (`Clareira na floresta`, `Acampamento de expedição`, `Ruína esquecida`, `Santuário antigo`, `Lagoa tranquila`) colocam dezenas de peças já posicionadas numa área livre do mapa, com um passo de desfazer.
- [[MEL-004 - Atalhos de teclado para mover e girar]] — concluída — Setas movem a peça selecionada na grade, `Shift` + setas giram em passos de 15°, `Page Up`/`Page Down` sobem e descem e `Alt` faz ajuste fino.
- [[MEL-005 - Seleção múltipla de peças]] — concluída — Dá para selecionar várias peças (`Shift` + clique, `Ctrl`/`⌘` + `A`) e manipulá-las juntas com um gizmo no centro do conjunto.
- [[MEL-006 - Grupos de peças nomeados]] — concluída — `Ctrl`/`⌘` + `G` agrupa a seleção num grupo nomeado; o grupo aparece como pasta recolhível na aba `Cena` e pode ser selecionado, renomeado e transformado como um todo.
- [[MEL-007 - Régua e encaixe entre vizinhas]] — concluída — Com `M`, a peça selecionada mostra uma linha pontilhada até a vizinha mais próxima, com a distância em metros, e o arraste encaixa automaticamente quando a diferença é pequena.
- [[MEL-008 - Camadas com ocultar e travar]] — concluída — Toda peça pertence a uma camada — `Natureza`, `Construções`, `Objetos`, `Básicos` ou `Importados` — e cada camada pode ser ocultada ou travada de uma vez.
- [[MEL-009 - Meus mapas, biblioteca com miniaturas e troca rápida]] — concluída — "Meus mapas" lista todos os mapas guardados no navegador com miniatura, tamanho e "atualizado há X", e permite abrir outro sem recarregar a página.
- [[MEL-010 - Alinhamento em lote e modo apresentação]] — concluída — Duas entregas juntas: alinhar/distribuir a seleção num eixo com um clique e um **modo apresentação** (`P`) que esconde toda a interface e deixa só o mapa, em tela cheia.
- [[MEL-011 - Exportar e importar trechos entre mapas]] — concluída — Selecionar peças e exportar como arquivo `.trecho` (JSON), para colar em outro mapa — inclusive em outro navegador ou noutra máquina. O trecho leva as peças, os grupos e os modelos importados usados.
- [[MEL-012 - Roteiro de apresentação com vistas navegáveis]] — concluída — Vistas salvas por mapa ("Portão", "Pátio", "Salão") viram um roteiro: no modo apresentação, `←`/`→` percorrem as vistas salvas, com nome e posição (`2 / 5`) visíveis.
- [[MEL-013 - Duplicar mapa]] — concluída — Um botão em cada cartão de `Meus mapas` cria uma cópia do mapa com nome livre — `Vila (cópia)`, `Vila (cópia 2)` — sem abrir o original nem mexer no "último mapa aberto".
- [[MEL-014 - Meus trechos salvos no navegador]] — concluída — Trechos podem ficar guardados no navegador, sem passar por arquivo: salvar a seleção como `Trecho 1`, colar em outro mapa, renomear e excluir — tudo por uma janela `Meus trechos`.
- [[MEL-015 - Viagem entre vistas com duração ajustável]] — concluída — Cada vista guarda o tempo de viagem da câmera até ela (de `0` a `6 s`, padrão `1,2 s`): `0` corta seco, `1,5 s` desliza com suavidade.
- [[MEL-016 - Painel da biblioteca separado por função]] — concluída — O rodapé da biblioteca ficou com duas ações (`Trechos` e `Importar`), e os arquivos passaram para um menu: `.trecho` de outro mapa e modelo 3D. A lista de peças ganhou altura e as abas pararam de estourar em tela estreita.
- [[MEL-017 - Menu Arquivo no topo]] — concluída — `Abrir projeto` e `Exportar projeto` saíram de botões soltos e viraram um menu `Arquivo` no cabeçalho, ao lado de `Meus mapas`, `Novo mapa`, `Modo apresentação` e `Salvar mapa`.
- [[MEL-018 - Busca e ordenação em Meus mapas]] — concluída — A janela `Meus mapas` ganhou campo de busca (sem diferenciar acento nem maiúsculas), seletor de ordem (`Mais recentes`, `Nome (A–Z)`, `Tamanho do mapa`) e contador `N de M mapas`.
- [[MEL-026 - Renomear mapa direto no cartão]] — concluída — O nome do mapa virou campo editável no próprio cartão de `Meus mapas`: clique, edite, `Enter` confirma e `Esc` descarta. Sem duplicar, sem abrir o mapa e sem passar pelo título do topo.
- [[MEL-027 - Barra do viewport agrupada por função]] — concluída — As ações do viewport passaram a ficar em cinco grupos nomeados — `Ferramentas`, `Histórico`, `Câmera`, `Visualização` e `Saída` — em vez de nove ícones espalhados em três cantos, com divisórias inconsistentes e um botão de câmera que parecia abrir menu.

## Como adicionar uma nota

1. Copie o modelo de `Melhorias e Atualizações/Melhorias e Atualizações.md`.
2. Salve como `MEL-XXX - título curto.md` com o próximo número livre.
3. Preencha o frontmatter, sem `#` nas tags.
4. Acrescente a linha da nota no bloco correspondente: `- [[MEL-XXX - título]] — status — resumo em 1 linha`.

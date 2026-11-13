# Tabletop RPG — Map Studio

Protótipo de um editor de mapas de RPG em 3D para navegador, baseado no plano do projeto. Interface em português, visual low-poly e peças procedurais criadas para este projeto.

## Documentação

O histórico do projeto está registrado como notas de [Obsidian](https://obsidian.md) dentro do repositório — a pasta já vem com o `.obsidian/`, então basta abrir a raiz do repositório como cofre.

- `Bugs e soluções/` — um arquivo por bug (`BUG-XXX - título curto.md`), com causa raiz, correção antes/depois e como validar. Comece pelo índice: `Bugs e soluções/_Índice.md`.
- `Melhorias e Atualizações/` — um arquivo por entrega (`MEL-XXX - título curto.md`), com motivação, como era antes, decisões descartadas e impacto. Comece pelo índice: `Melhorias e Atualizações/_Índice.md`.

Hoje o cofre tem **32 notas de melhoria** e **5 de bug**. Os modelos para novas notas ficam em `Bugs e soluções/Bugs e soluçoes.md` e `Melhorias e Atualizações/Melhorias e Atualizações.md`. As notas usam frontmatter com tags (sem `#`) e `[[wikilinks]]` entre si.

## Executar

Requisitos: Node.js 22 LTS e npm. Navegador desktop com WebGL 2 e aceleração gráfica para o editor 3D.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Atualização automática

**Enquanto você programa:** rode `npm run dev` e abra o endereço mostrado no terminal (por padrão http://localhost:5173). O Vite observa a pasta `src/` e aplica cada mudança na hora, sem precisar parar o servidor nem recarregar a página à mão. O servidor escuta em `0.0.0.0`, então também funciona pela prévia remota.

**Site publicado:** o workflow `.github/workflows/publicar.yml` compila e publica o site automaticamente a cada `push` na branch `main`, em https://zedrodacunha.github.io/Tabletop-RPG/. O caminho base (`/Tabletop-RPG/`) é calculado sozinho no GitHub Actions; localmente o site continua na raiz. Para publicar de novo manualmente, use a aba **Actions → Publicar site → Run workflow**.

```sh
npm run dev     # desenvolvimento com recarga automática
git push        # publica o site atualizado (na main)
```

O build publicado leva de 1 a 2 minutos para aparecer no ar. O GitHub Pages precisa estar configurado com **Source: GitHub Actions** (Settings → Pages).

## O que funciona

- Cena vazia ou cenário de exemplo com 67 objetos.
- Câmera orbital, deslocamento, zoom, vista superior e foco no objeto.
- Biblioteca de **64 peças**, organizada em oito categorias e tipos específicos. Inclui 32 novos modelos detalhados, com ferragens, tábuas, telhas, livros, utensílios, mobiliário, vegetação e peças de masmorra.
- Inserir, selecionar, mover, rotacionar, escalar, duplicar, ocultar, travar e remover objetos.
- **Grupos**: `Ctrl/Cmd + G` agrupa a seleção num grupo nomeado (o nome pode ser trocado no painel de propriedades) e `Ctrl/Cmd + Shift + G` desfaz. Na aba Cena o grupo aparece como uma pasta recolhível com a contagem de peças; clicar no nome seleciona o grupo inteiro e o gizmo age nele como uma peça única. Duplicar um grupo cria um grupo novo com as cópias, e o grupo desaparece sozinho quando a última peça sai.
- **Alinhamento em lote** (painel de seleção múltipla): `Alinhar X/Y/Z` põe todas as peças na mesma linha, usando a primeira peça destravada da seleção como referência; `Distribuir X/Z` espalha três ou mais peças com espaçamento igual entre as extremas. Peças travadas ficam onde estão.
- **Trechos** (`.trecho`): com peças selecionadas, `Exportar trecho` baixa um arquivo só com elas — mais os grupos a que pertencem e os modelos 3D que usam. No outro mapa, `Importar → Trecho` no rodapé da biblioteca cola o conjunto assentado num ponto livre, já selecionado, com grupos e nomes preservados e tudo em um passo de desfazer.
- **Meus trechos** (botão `Trechos` no rodapé da biblioteca): a seleção vira um bloco salvo no navegador — `Salvar trecho` no painel de seleção múltipla — e volta com `Colar` em qualquer mapa, sem passar por arquivo. Cada trecho guarda peças, grupos e modelos 3D, mostra a miniatura, quantas peças tem e de qual mapa veio, e pode ser renomeado (Enter confirma) ou excluído. O navegador guarda até 20 trechos.
- **Roteiro de apresentação**: o painel de propriedades tem uma seção Roteiro onde você salva a vista atual da câmera, renomeia ("Vista do portão") e navega com um clique. No modo apresentação o roteiro aparece como uma pílula no rodapé: `←`/`→` ou as setas da pílula passam de uma vista para outra, com o nome da cena e a posição no roteiro. As vistas viajam no `.tabletop` e no salvamento automático.
- **Tempo de viagem por vista**: cada vista do roteiro tem seu próprio tempo de transição (0 s, 0,5 s, 1 s, 1,5 s, 2 s ou 3 s; padrão 1,2 s). A câmera viaja com aceleração no começo e freio no fim; `0 s` corta seco, como antes. O tempo fica salvo com o mapa e vale tanto para o `Ir` no editor quanto para as setas do modo apresentação.
- **Modo apresentação** (`P`): tela cheia só com a cena — sem cabeçalho, biblioteca, painel de propriedades, barras de ferramentas ou rodapé. Botão direito orbita, scroll aproxima; `Esc` ou `P` volta ao editor. O botão de apresentação fica no topo, ao lado de exportar.
- **Seleção múltipla**: Shift + clique (ou Ctrl/Cmd + clique) soma e retira peças no mapa e na lista da Cena; Ctrl/Cmd + A seleciona todas. As peças selecionadas ganham anel, e o gizmo aparece no centro do grupo para arrastar, girar ou escalar tudo junto. Setas, `Ctrl+D` e `Delete` valem para a seleção inteira, e o painel mostra as ações do conjunto (focar, duplicar, travar, remover).
- **Meus mapas**: o botão no topo abre a biblioteca de mapas salvos neste navegador, com miniatura gerada a partir das peças, contagem e quando foi salvo. Dá para abrir outro mapa, excluir os que não usa mais e criar um novo sem perder o atual; o último aberto volta ao recarregar a página. A lista tem busca por nome (sem diferenciar maiúsculas ou acentos) e ordem por mais recentes, nome (A–Z) ou tamanho do mapa; cada cartão mostra o tamanho em metros. O filtro de período alterna entre `Qualquer data`, `Últimos 7 dias` e `Últimos 30 dias` e se combina com a busca e a ordenação. O nome do mapa é editável no próprio cartão: clique, edite e confirme com Enter (Esc cancela; nome vazio volta ao anterior), sem criar nova cópia — e renomear o mapa aberto troca também o título do topo.
- **Duplicar mapa** (ícone de cópia em cada cartão da biblioteca): cria uma cópia completa do mapa — peças, grupos, camadas, modelos importados, câmera e roteiro — com nome livre (`Bosque (cópia)`, `Bosque (cópia 2)`…) e o horário novo. O original não é tocado e o mapa aberto continua sendo o mesmo; duplicar o mapa atual duplica o que está salvo no navegador.
- **Barra do editor docada**: as ações da cena ficam numa faixa fixa acima do mapa, não flutuando sobre ele — `Ferramentas` (selecionar, mover, girar, escalar), `Histórico` (desfazer, refazer), `Câmera` (perspectiva × vista superior e centralizar), `Visualização` (grade, encaixe, régua) e `Saída` (exportar imagem, ajuda), mais os botões que abrem/fecham biblioteca e propriedades. Cada grupo tem nome acessível (`role="group"`) e o botão de câmera anuncia o estado com `aria-pressed`. Abaixo de 650 px a barra fica com `Ferramentas` e um botão `Mais ações` (`aria-haspopup="menu"`), que abre desfazer/refazer, câmera, grade/encaixe/régua e exportar imagem/ajuda — os itens de alternância mostram o estado com `aria-checked`.
- **Propriedades em seções recolhíveis**: `Roteiro de apresentação`, `Camadas`, `Ambiente` e `Configurações do mapa` começam fechadas, cada uma com um resumo no cabeçalho (vistas, camadas em uso, iluminação, tamanho) e `aria-expanded`; o bloco do objeto selecionado continua sempre aberto.
- **Biblioteca com cabeçalho único**: `Biblioteca`, `Cena` e `Cenários` são abas com contador (`64`, `67`, `5`) e a busca fica presa logo abaixo delas — rolar o acervo não leva a busca embora. A chamada de marketing que ficava entre as abas e a busca saiu, e os filtros de `Categoria`/`Tipo` só aparecem na aba de peças. Cada aba tem sua própria busca (peças, cena, cenários) e o contador da aba continua mostrando o total do mapa, não o resultado filtrado.
- **Rodapé sem ruído**: `objetos`, `grade`, coordenadas da seleção e tamanho do mapa. Frase de efeito, `PROTÓTIPO` duplicado e atalhos repetidos saíram da cena.
- **Menu Arquivo no topo**: abrir um `.tabletop` e exportar o projeto ficam num único menu, cada um com uma linha explicando o formato; `Meus mapas`, `Novo mapa`, apresentação e `Salvar mapa` continuam soltos ao lado. Abaixo de 650 px eles dão lugar a um menu `Mais` (Meus mapas, Novo mapa, Abrir projeto, Exportar projeto e Modo apresentação) com nome visível em cada item, e `Salvar mapa` continua na barra como ação principal.
- **Camadas** (painel Propriedades → Camadas): Natureza, Construções, Objetos, Básicos e Importados aparecem com a contagem de peças e podem ser ocultadas ou travadas de uma vez. Ocultar só tira o desenho da cena — nada é apagado, e o estado fica salvo com o mapa.
- **Régua e alinhamento** (`M`): com uma peça selecionada, uma linha pontilhada liga a peça à vizinha mais próxima e um selo mostra a distância em metros; ao soltar o arrasto, a peça encaixa na linha X ou Z de uma vizinha quando o desvio é menor que 0,75 m. Desligado, o arrasto fica livre.
- **Cenários prontos** (aba Cenários): clareira, acampamento, ruína, santuário e lagoa entram no mapa com um clique, num ponto livre perto do centro, e podem ser desfeitos com Ctrl+Z.
- Grade, encaixe, tamanho do mapa, cor de fundo e quatro atmosferas (amanhecer, dia, entardecer e noite).
- Ambientação com céu em gradiente, sol/lua, estrelas à noite, colinas no horizonte, névoa por distância, chão com textura procedural e vinheta sobre o viewport.
- Desfazer/refazer até 40 operações.
- Importar GLB autocontido ou glTF com seus arquivos `.bin` e texturas selecionados juntos.
- Salvamento automático em IndexedDB com vários mapas por navegador, exportação/importação `.tabletop` com modelos incorporados e exportação de imagem PNG.
- Modo esquemático 2D quando WebGL não está disponível: permite posicionar, selecionar e editar propriedades; exporta SVG. Os símbolos não reproduzem a geometria ou rotação de modelos importados. Não oferece câmera 3D.

## Controles

| Ação | Controle |
| --- | --- |
| Orbitar | Botão direito + arrastar |
| Mover câmera | Botão do meio + arrastar |
| Zoom | Scroll |
| Selecionar / mover / girar / escalar | 1 / 2 / 3 / 4 |
| Focar objeto | F |
| Mover com o teclado | ← ↑ → ↓ (Alt = passo fino) |
| Girar 15° / subir e descer | Shift + ← → / Page Up · Page Down |
| Somar ou retirar da seleção | Shift + clique (mapa ou lista da Cena) |
| Selecionar todas as peças visíveis | Ctrl/Cmd + A |
| Mover o grupo selecionado | ← ↑ → ↓ (Alt = passo fino) |
| Agrupar / desagrupar a seleção | Ctrl/Cmd + G · Ctrl/Cmd + Shift + G |
| Duplicar | Ctrl/Cmd + D |
| Desfazer / refazer | Ctrl/Cmd + Z / Shift + Z |
| Salvar | Ctrl/Cmd + S |
| Remover | Delete |
| Grade | G |
| Régua e alinhamento | M |
| Modo apresentação | P |
| Vista anterior / próxima (apresentação) | ← → |
| Cancelar | Esc |

Clique em uma peça da biblioteca e depois no chão do mapa. As ferramentas 3D operam pelos eixos; o painel permite informar valores precisos. O eixo Y representa altura e cada unidade representa um metro. Modelos importados são centralizados no chão e normalizados para 3 m na maior dimensão, podendo ser escalados depois.

## Persistência e limites

O protótipo mantém **um mapa atual por navegador/origem**. Não há conta, banco em nuvem ou sincronização entre dispositivos. Exporte o projeto antes de substituir o mapa atual ou limpar os dados do navegador. O arquivo `.tabletop` inclui os modelos; a exportação de imagem não permite reeditar o mapa. Prévia local e site publicado possuem armazenamento separado.

Limites de validação: 1.500 objetos, 80 modelos por mapa, 25 MB por modelo incorporado, 60 MB/64 arquivos por lote de importação e 100 MB por projeto aberto. A biblioteca de trechos aceita até 20 trechos salvos, com 1.500 peças cada. O rodapé da biblioteca tem só duas ações (`Trechos` e `Importar`); os arquivos `.trecho` e os modelos 3D ficam no menu `Importar`, para não empilhar botões. Estes são limites de arquivo, não uma garantia de desempenho. Modelos complexos podem exigir menos objetos e mais memória. Texturas externas devem acompanhar o glTF. Draco, Meshopt, KTX2 e animação de personagens não fazem parte desta versão.

O mapa é renderizado sob demanda, com resolução limitada a 1,5× e sombras de 2048 px. As colinas do horizonte e o céu são gerados no navegador, sem assets externos, e não fazem parte do mapa editável (não podem ser selecionadas nem exportadas). Os modelos não são enviados a um servidor pelo aplicativo. Fontes de interface usam Google Fonts, com fontes locais alternativas.

## Estrutura

```text
src/App.tsx                   Estado do editor, histórico e comandos
src/scene/Viewport.tsx        Cena WebGL, câmera e ferramentas
src/scene/Models.tsx          Geometrias das peças e modelos importados
src/scene/CompatibleMap.tsx   Representação para dispositivos sem WebGL
src/editor/                  Biblioteca visual, propriedades e diálogos
src/features/assets/         Catálogo e pipeline de importação
src/features/projects/       Formato versionado, validação e persistência
```

React 19, TypeScript, Vite, Three.js, React Three Fiber e Drei. Assets nativos e ícones de catálogo são implementados no código; Lucide fornece ícones de interface. Não há dependência de código ou assets do Tabletop Simulator.

## Próximas etapas

1. Validar câmera, gizmos e desempenho em notebooks com GPU integrada e dedicada.
2. Legenda por vista no modo apresentação (notas do mestre).
3. Introduzir entidade de personagem com nome, miniatura e atributos, separada dos objetos de cenário.
4. Depois, animações, movimentação, ficha, fog of war e sessões compartilhadas com permissões.

Os testes automatizados cobrem integridade do projeto, portabilidade de referências, validação de dados e limites. A verificação por navegador nesta implementação cobriu o modo de compatibilidade; o navegador de testes não disponibilizou WebGL. A validação visual da renderização 3D e dos gizmos em hardware real permanece necessária.



## Biblioteca ampliada: categorias e tipos

| Categoria | Peças | Exemplos de tipos |
| --- | ---: | --- |
| Natureza | 16 | Árvores, plantas, rochas e troncos, água, cristais |
| Construções | 16 | Edificações, paredes e portões, pisos e escadas, cercas, pontes e cais |
| Mobiliário | 6 | Mesas e balcões, assentos, camas, estantes |
| Acampamento | 6 | Abrigo, cozinha, suprimentos |
| Iluminação | 4 | Lanternas, tochas e braseiros, velas |
| Masmorra | 5 | Tesouros, grades, criptas, armadilhas |
| Decoração | 8 | Sinalização, esculturas, recipientes, comércio, equipamentos |
| Básicos | 3 | Primitivas |

`Categoria`, `Tipo` e busca funcionam juntos. A busca ignora acentos e maiúsculas e considera o nome, a categoria, o tipo e palavras-chave; por exemplo, `prisao` encontra a jaula e `madeira mesa` encontra a mesa de taverna. Ao trocar a categoria, o tipo volta a `Todos os tipos`. `Limpar filtros` restaura a biblioteca completa. Os modelos enviados pelo usuário continuam separados em `Importados`.

Os identificadores das 32 peças anteriores foram preservados. As camadas da cena continuam com os cinco agrupamentos existentes; mobiliário, acampamento, iluminação, masmorra e decoração pertencem à camada `Objetos`.

Os novos modelos são geometrias procedurais reais em `src/scene/detailedModels.ts`, com materiais agrupados para reduzir chamadas de desenho. Instâncias da mesma peça compartilham geometrias e materiais. As miniaturas PNG, incorporadas ao código e às imagens SVG exportadas pelo modo compatível, são renderizadas offline a partir dessas mesmas geometrias, com projeção ortográfica e teste de profundidade. Não são imagens de modelos externos.

Para regenerar as miniaturas após editar a geometria:

```sh
npm run assets:previews
npm test
npm run build
```

A bateria contém 51 testes, incluindo catálogo, busca combinada, categorias, compatibilidade dos mapas e limites geométricos dos 32 novos modelos. A geometria é verificada sem GPU; a conferência visual no navegador disponível usa o modo compatível porque ele não disponibiliza WebGL. O desempenho e o acabamento da renderização WebGL em hardware real ainda precisam dessa verificação.



## Árvores com estrutura e texturas refinadas

Pinheiro, carvalho, bétula, árvore seca e salgueiro usam troncos curvos e afilados, raízes, ramificação secundária e materiais de casca com cor e relevo. As copas têm folhas recortadas com nervuras, variação de tom e lâminas dobradas; o pinheiro usa ramos de agulhas e o salgueiro tem ramos pendentes. Os cinco identificadores e o filtro Natureza → Árvores foram preservados, inclusive em mapas já salvos.

Os modelos compartilham geometria e materiais entre cópias, com uma ou duas malhas por árvore. As miniaturas são geradas das mesmas geometrias e texturas por `npm run assets:previews`. Referências, limites e roteiro de validação: [docs/tree-models.md](docs/tree-models.md).

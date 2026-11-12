# Tabletop RPG — Map Studio

Protótipo de um editor de mapas de RPG em 3D para navegador, baseado no plano do projeto. Interface em português, visual low-poly e peças procedurais criadas para este projeto.

## Documentação

O histórico do projeto está registrado como notas de [Obsidian](https://obsidian.md) dentro do repositório — a pasta já vem com o `.obsidian/`, então basta abrir a raiz do repositório como cofre.

- `Bugs e soluções/` — um arquivo por bug (`BUG-XXX - título curto.md`), com causa raiz, correção antes/depois e como validar. Comece pelo índice: `Bugs e soluções/_Índice.md`.
- `Melhorias e Atualizações/` — um arquivo por entrega (`MEL-XXX - título curto.md`), com motivação, como era antes, decisões descartadas e impacto. Comece pelo índice: `Melhorias e Atualizações/_Índice.md`.

Hoje o cofre tem **25 notas de melhoria** e **4 de bug**. Os modelos para novas notas ficam em `Bugs e soluções/Bugs e soluçoes.md` e `Melhorias e Atualizações/Melhorias e Atualizações.md`. As notas usam frontmatter com tags (sem `#`) e `[[wikilinks]]` entre si.

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
- Biblioteca de 32 peças: árvores (pinheiro, carvalho, bétula, árvore seca), vegetação rasteira, rochas, lagoa, cristais, ruínas (muralha, arco, torre, coluna, escadaria, santuário), estruturas (poço, cerca, ponte), acampamento (tenda, fogueira, lanterna, estandarte, caixote, barril, carrinho, baú), decoração (estátua, piso de pedra) e formas básicas.
- Inserir, selecionar, mover, rotacionar, escalar, duplicar, ocultar, travar e remover objetos.
- **Grupos**: `Ctrl/Cmd + G` agrupa a seleção num grupo nomeado (o nome pode ser trocado no painel de propriedades) e `Ctrl/Cmd + Shift + G` desfaz. Na aba Cena o grupo aparece como uma pasta recolhível com a contagem de peças; clicar no nome seleciona o grupo inteiro e o gizmo age nele como uma peça única. Duplicar um grupo cria um grupo novo com as cópias, e o grupo desaparece sozinho quando a última peça sai.
- **Alinhamento em lote** (painel de seleção múltipla): `Alinhar X/Y/Z` põe todas as peças na mesma linha, usando a primeira peça destravada da seleção como referência; `Distribuir X/Z` espalha três ou mais peças com espaçamento igual entre as extremas. Peças travadas ficam onde estão.
- **Trechos** (`.trecho`): com peças selecionadas, `Exportar trecho` baixa um arquivo só com elas — mais os grupos a que pertencem e os modelos 3D que usam. No outro mapa, `Importar → Trecho` no rodapé da biblioteca cola o conjunto assentado num ponto livre, já selecionado, com grupos e nomes preservados e tudo em um passo de desfazer.
- **Meus trechos** (botão `Trechos` no rodapé da biblioteca): a seleção vira um bloco salvo no navegador — `Salvar trecho` no painel de seleção múltipla — e volta com `Colar` em qualquer mapa, sem passar por arquivo. Cada trecho guarda peças, grupos e modelos 3D, mostra a miniatura, quantas peças tem e de qual mapa veio, e pode ser renomeado (Enter confirma) ou excluído. O navegador guarda até 20 trechos.
- **Roteiro de apresentação**: o painel de propriedades tem uma seção Roteiro onde você salva a vista atual da câmera, renomeia ("Vista do portão") e navega com um clique. No modo apresentação o roteiro aparece como uma pílula no rodapé: `←`/`→` ou as setas da pílula passam de uma vista para outra, com o nome da cena e a posição no roteiro. As vistas viajam no `.tabletop` e no salvamento automático.
- **Tempo de viagem por vista**: cada vista do roteiro tem seu próprio tempo de transição (0 s, 0,5 s, 1 s, 1,5 s, 2 s ou 3 s; padrão 1,2 s). A câmera viaja com aceleração no começo e freio no fim; `0 s` corta seco, como antes. O tempo fica salvo com o mapa e vale tanto para o `Ir` no editor quanto para as setas do modo apresentação.
- **Modo apresentação** (`P`): tela cheia só com a cena — sem cabeçalho, biblioteca, painel de propriedades, barras de ferramentas ou rodapé. Botão direito orbita, scroll aproxima; `Esc` ou `P` volta ao editor. O botão de apresentação fica no topo, ao lado de exportar.
- **Seleção múltipla**: Shift + clique (ou Ctrl/Cmd + clique) soma e retira peças no mapa e na lista da Cena; Ctrl/Cmd + A seleciona todas. As peças selecionadas ganham anel, e o gizmo aparece no centro do grupo para arrastar, girar ou escalar tudo junto. Setas, `Ctrl+D` e `Delete` valem para a seleção inteira, e o painel mostra as ações do conjunto (focar, duplicar, travar, remover).
- **Meus mapas**: o botão no topo abre a biblioteca de mapas salvos neste navegador, com miniatura gerada a partir das peças, contagem e quando foi salvo. Dá para abrir outro mapa, excluir os que não usa mais e criar um novo sem perder o atual; o último aberto volta ao recarregar a página. A lista tem busca por nome (sem diferenciar maiúsculas ou acentos) e ordem por mais recentes, nome (A–Z) ou tamanho do mapa; cada cartão mostra o tamanho em metros. O nome do mapa é editável no próprio cartão: clique, edite e confirme com Enter (Esc cancela; nome vazio volta ao anterior), sem criar nova cópia — e renomear o mapa aberto troca também o título do topo.
- **Duplicar mapa** (ícone de cópia em cada cartão da biblioteca): cria uma cópia completa do mapa — peças, grupos, camadas, modelos importados, câmera e roteiro — com nome livre (`Bosque (cópia)`, `Bosque (cópia 2)`…) e o horário novo. O original não é tocado e o mapa aberto continua sendo o mesmo; duplicar o mapa atual duplica o que está salvo no navegador.
- **Menu Arquivo no topo**: abrir um `.tabletop` e exportar o projeto ficam num único menu, cada um com uma linha explicando o formato; `Meus mapas`, `Novo mapa`, apresentação e `Salvar mapa` continuam soltos ao lado. Em telas estreitas os rótulos somem, mas todos os botões mantêm nome acessível.
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
2. Agrupar a barra de ferramentas do viewport por função.
3. Introduzir entidade de personagem com nome, miniatura e atributos, separada dos objetos de cenário.
4. Depois, animações, movimentação, ficha, fog of war e sessões compartilhadas com permissões.

Os testes automatizados cobrem integridade do projeto, portabilidade de referências, validação de dados e limites. A verificação por navegador nesta implementação cobriu o modo de compatibilidade; o navegador de testes não disponibilizou WebGL. A validação visual da renderização 3D e dos gizmos em hardware real permanece necessária.

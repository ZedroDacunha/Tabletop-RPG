# Tabletop RPG — Map Studio

Protótipo de um editor de mapas de RPG em 3D para navegador, baseado no plano do projeto. Interface em português, visual low-poly e peças procedurais criadas para este projeto.

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

- Cena vazia ou cenário de exemplo com 40 objetos.
- Câmera orbital, deslocamento, zoom, vista superior e foco no objeto.
- Biblioteca de 15 peças: árvores, pedras, ruínas, acampamento, decoração e formas básicas.
- Inserir, selecionar, mover, rotacionar, escalar, duplicar, ocultar, travar e remover objetos.
- Grade, encaixe, tamanho do mapa, iluminação e cor de fundo.
- Desfazer/refazer até 40 operações.
- Importar GLB autocontido ou glTF com seus arquivos `.bin` e texturas selecionados juntos.
- Salvamento automático em IndexedDB, exportação/importação `.tabletop` com modelos incorporados e exportação de imagem PNG.
- Modo esquemático 2D quando WebGL não está disponível: permite posicionar, selecionar e editar propriedades; exporta SVG. Os símbolos não reproduzem a geometria ou rotação de modelos importados. Não oferece câmera 3D.

## Controles

| Ação | Controle |
| --- | --- |
| Orbitar | Botão direito + arrastar |
| Mover câmera | Botão do meio + arrastar |
| Zoom | Scroll |
| Selecionar / mover / girar / escalar | 1 / 2 / 3 / 4 |
| Focar objeto | F |
| Duplicar | Ctrl/Cmd + D |
| Desfazer / refazer | Ctrl/Cmd + Z / Shift + Z |
| Salvar | Ctrl/Cmd + S |
| Remover | Delete |
| Grade | G |
| Cancelar | Esc |

Clique em uma peça da biblioteca e depois no chão do mapa. As ferramentas 3D operam pelos eixos; o painel permite informar valores precisos. O eixo Y representa altura e cada unidade representa um metro. Modelos importados são centralizados no chão e normalizados para 3 m na maior dimensão, podendo ser escalados depois.

## Persistência e limites

O protótipo mantém **um mapa atual por navegador/origem**. Não há conta, banco em nuvem ou sincronização entre dispositivos. Exporte o projeto antes de substituir o mapa atual ou limpar os dados do navegador. O arquivo `.tabletop` inclui os modelos; a exportação de imagem não permite reeditar o mapa. Prévia local e site publicado possuem armazenamento separado.

Limites de validação: 1.500 objetos, 80 modelos por mapa, 25 MB por modelo incorporado, 60 MB/64 arquivos por lote de importação e 100 MB por projeto aberto. Estes são limites de arquivo, não uma garantia de desempenho. Modelos complexos podem exigir menos objetos e mais memória. Texturas externas devem acompanhar o glTF. Draco, Meshopt, KTX2 e animação de personagens não fazem parte desta versão.

O mapa é renderizado sob demanda, com resolução limitada a 1,5× e sombras de 1024 px. Os modelos não são enviados a um servidor pelo aplicativo. Fontes de interface usam Google Fonts, com fontes locais alternativas.

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
2. Adicionar galeria de vários mapas e miniaturas.
3. Introduzir entidade de personagem com nome, miniatura e atributos, separada dos objetos de cenário.
4. Depois, animações, movimentação, ficha, fog of war e sessões compartilhadas com permissões.

Os testes automatizados cobrem integridade do projeto, portabilidade de referências, validação de dados e limites. A verificação por navegador nesta implementação cobriu o modo de compatibilidade; o navegador de testes não disponibilizou WebGL. A validação visual da renderização 3D e dos gizmos em hardware real permanece necessária.

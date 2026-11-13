# Árvores: estrutura, materiais e referências

Esta atualização substitui a aparência de cinco peças existentes. Não adiciona tipos nem modifica o formato dos projetos salvos. A biblioteca continua com 64 itens, e Natureza → Árvores contém as mesmas cinco espécies.

| Peça | Estrutura e acabamento | Triângulos | Malhas por instância |
| --- | --- | ---: | ---: |
| Pinheiro | Tronco afilado, galhos em andares irregulares e ramos de agulhas recortadas | 6.594 | 2 |
| Carvalho | Tronco curvo, bifurcações visíveis, copa ampla e folhas lobadas | 11.124 | 2 |
| Bétula | Tronco esguio, casca clara com marcas horizontais e copa mais aberta | 7.450 | 2 |
| Árvore seca | Madeira envelhecida, galhos retorcidos, pontas fechadas e raízes expostas | 2.132 | 1 |
| Salgueiro | Ramos curvos pendentes, folhas estreitas e copa em cortina | 13.924 | 2 |

## Decisões de implementação

- `src/scene/treeModels.ts` gera as árvores de forma determinística. Curvas com raios variáveis formam troncos, galhos e raízes. As partes são unidas por material, preservando UVs, normais e cores por vértice.
- As texturas são originais e procedurais: casca em 128 × 256 pixels, relevo na mesma resolução e folhagem RGBA em 64 × 128 pixels. Nenhum modelo ou arquivo artístico externo é redistribuído.
- As folhas têm uma dobra central, recorte por `alphaTest` e nervuras. A cobertura das agulhas foi ajustada para não desaparecer quando a textura é reduzida pelos mipmaps. Cor usa sRGB; relevo usa dados lineares.
- O renderer mantém um modelo por espécie em cache. As cópias têm transformações independentes e compartilham geometrias, materiais e texturas. Uma ou duas malhas correspondem a uma ou duas chamadas na passagem de cor, sem contar passagens adicionais de sombras.
- Three.js 0.180 propaga `map` e `alphaTest` aos materiais de sombra; não são necessários shaders especiais para o recorte.
- `scripts/render-tree-preview.ts` gera miniaturas em CPU, com os mesmos UVs, cores e recortes. A iluminação é aproximada: essa prévia não valida o relevo, sombras ou desempenho WebGL.
- Mantidos os nomes, categorias, filtros, escala geral e origem no chão. As copas têm contornos novos; mapas muito densos podem precisar de pequenos ajustes de espaçamento.

## Referências pesquisadas

1. **Bradley Mayo — Hand Textured Stylized Tree**. Referência de separação entre forma, textura de casca e textura de folhas, mantendo um acabamento estilizado.
   https://bradleymayo.artstation.com/projects/a62ez
2. **Sean Janosek — Scots Pine Tree**. Referência de hierarquia de ramos, grupos de agulhas e legibilidade das agulhas à distância. O fluxo de alta densidade para UE5/Nanite não foi adotado no navegador.
   https://sean_janosek.artstation.com/projects/L4boEP
3. **Ksea97 — Willow Tree**. Referência visual de ramos pendentes e silhueta de salgueiro, localizada na pesquisa de imagens. A página de detalhes não pôde ser aberta pela ferramenta de pesquisa; não foi usada para especificações técnicas.
   https://sketchfab.com/3d-models/willow-tree-fbaf549f98d64b41b36eb3f04338d345
4. **Three.js — MeshStandardMaterial**. Referência técnica para texturas de cor, relevo e materiais.
   https://threejs.org/docs/pages/MeshStandardMaterial.html

## Validação

- `npm test`: 51 testes, incluindo limites de geometria/memória, atributos finitos, origem no chão, determinismo, compartilhamento entre cópias, textura/recorte e filtros.
- `npm run assets:previews`: atualiza as 36 miniaturas geradas, incluindo as cinco árvores.
- `npm run build`: TypeScript e bundle de produção.
- Conferência visual em CPU das cinco espécies, além de filtros e inserção no navegador em modo compatível 2D.
- O navegador de QA não oferece WebGL. Não foi medido FPS e não foi validada a iluminação 3D em hardware real. O build já apresentava um aviso de bundle grande; dividir o carregamento não faz parte desta alteração.

Para validar em hardware com aceleração gráfica: filtrar Natureza → Árvores; inserir cada espécie; aproximar a câmera para conferir a casca e as folhas; observar de cima e de baixo; alternar Dia/Noite; duplicar árvores; recarregar um mapa salvo; comparar uma cena com dezenas de árvores em dispositivos alvo. Reduzir detalhes por distância (LOD) permanece uma possível evolução para florestas extensas.

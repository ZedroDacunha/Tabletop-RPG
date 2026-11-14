# Fogueira reutilizável — primeira versão

## 0. Pesquisa e compatibilidade

Implementação original para **Three.js 0.180.0**, Vite 7.1.7 e TypeScript 5.9.2. O editor usa React Three Fiber 9.3.0, câmera em perspectiva com órbita livre e uma vista superior. O núcleo da fogueira depende apenas de Three.js; o adaptador React reutiliza dependências existentes. O laboratório também inclui câmera ortográfica real.

| Fonte consultada | Aplicação |
| --- | --- |
| [Three.js — ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html) | Uniforms, shaders GLSL e atualização por objeto antes de desenhar com material compartilhado. |
| [Three.js — InstancedBufferGeometry](https://threejs.org/docs/pages/InstancedBufferGeometry.html) | Um quad por partícula, agrupado em uma chamada por tipo de efeito. |
| [Three.js — PointLight](https://threejs.org/docs/pages/PointLight.html) | Intensidade, alcance limitado e decaimento físico 2. |
| [Three.js — Shadows](https://threejs.org/manual/pages/shadows.html) | Evitar seis renderizações adicionais da cena por luz pontual com sombras. |
| [Three.js — Cleanup](https://threejs.org/manual/pages/cleanup.html) | Descarte explícito de geometria, materiais, texturas e luzes. |
| [Flickering Torch — Three.js Demos](https://threejsdemos.com/demos/lighting/torch) | Referência de tocha 3D e oscilação; adotada uma soma contínua de senos com fases diferentes, sem sorteio por frame. Site independente, não é documentação oficial. |
| [cpl121/fire-shader](https://github.com/cpl121/fire-shader) | Referência conceitual de fogueira procedural e camadas de fogo/fumaça em WebGL. Repositório MIT; nenhum código nem asset incorporado. |
| [Three.js Discourse — Fire animation and glow](https://discourse.threejs.org/t/fire-animation-and-glow/55826) | Separar brilho visual da iluminação real dos objetos próximos. |
| [Three.js — WebGPU particles](https://threejs.org/examples/webgpu_particles.html) | Referência visual de fogo e fumaça. A implementação WebGPU/TSL não é compatível como substituição direta do pipeline WebGL usado aqui. |

As páginas atuais podem descrever versões posteriores. Foram usadas APIs presentes no pacote r180 instalado, incluindo `InstancedBufferGeometry`, `ShaderMaterial.uniformsNeedUpdate`, `DataTexture`, `PointLight` e `dispose`. Não foram adotados exemplos antigos com `Geometry`, `PlaneBufferGeometry` ou iluminação legada. Os shaders usam os chunks de cor e névoa da versão instalada, sem copiar código de terceiros.

## 1. Abordagem

Lenha e pedras low-poly ficam em uma malha; brasas em outra. Chamas e faíscas usam quads instanciados com mistura aditiva; fumaça usa transparência normal. O shader move os quads e os orienta para a câmera. Uma oscilação compartilhada controla chama, brasas, intensidade, alcance e cor da luz. Máscaras são geradas por código. O editor compartilha até três luzes entre fogueiras próximas e visíveis, sem sombras pontuais.

## 2. Arquivos completos

| Arquivo | Responsabilidade |
| --- | --- |
| [Campfire.ts](../src/scene/campfire/Campfire.ts) | Classe pública independente de React. |
| [config.ts](../src/scene/campfire/config.ts) | Todos os parâmetros públicos e validação. |
| [resources.ts](../src/scene/campfire/resources.ts) | Geometrias, texturas, materiais e cache com contagem de referências. |
| [shaders.ts](../src/scene/campfire/shaders.ts) | Movimento, billboards, gradiente, brasas e brilho no chão. |
| [CampfireLightPool.ts](../src/scene/campfire/CampfireLightPool.ts) | Orçamento de luzes e transições suaves. |
| [CampfireModel.tsx](../src/scene/campfire/CampfireModel.tsx) | Integração com React, StrictMode e renderização sob demanda. |
| [main.ts](../examples/campfire/main.ts) e [index.html](../examples/campfire/index.html) | Demonstração completa sem React, controles e medidor de FPS. |
| [Campfire.test.ts](../src/scene/campfire/Campfire.test.ts) | Testes de tempo, sincronização, compartilhamento, descarte e orçamento. |

Execute `npm ci` e `npm run dev`. Abra `/examples/campfire/index.html` no servidor informado pelo Vite. Teste 1, 5 e 20 fogueiras em três câmeras, ajuste a intensidade e ligue/desligue a fumaça. O endereço respeita a base configurada quando publicado em subdiretório. Sem WebGL 2, o laboratório mostra a limitação e desativa os controles.

## 3. Uso em uma cena existente

Exemplo completo de adaptador para o loop já existente. Salve como `src/scene/createCampfireDemo.ts` se quiser reutilizá-lo; o laboratório já fornece um programa completo com renderer, câmera e loop.

```ts
import type {Scene, Camera} from 'three';
import {Campfire} from './campfire/Campfire';
import {CampfireLightPool} from './campfire/CampfireLightPool';

export function createCampfireDemo(scene: Scene) {
  const pool = new CampfireLightPool(3);
  const fires = [
    new Campfire({seed: 3}).setPosition(0, 0, 0),
    new Campfire({seed: 20, smoke: false}).setPosition(4, 0, -2),
  ];
  scene.add(pool);
  for (const fire of fires) {
    scene.add(fire);
    pool.register(fire);
  }
  return {
    fires,
    update(deltaTime: number, camera: Camera) {
      for (const fire of fires) fire.update(deltaTime);
      pool.update(camera, deltaTime);
    },
    dispose() {
      pool.dispose();
      for (const fire of fires) fire.dispose();
    },
  };
}
```

No loop existente, chame `demo.update(deltaTimeEmSegundos, camera)` antes de `renderer.render(scene, camera)`. Para uma só fogueira, basta `scene.add(new Campfire())` e atualizar sua instância; ela já contém uma PointLight. O gerenciador substitui as luzes individuais quando registrado. Coloque o gerenciador diretamente na cena, com transformação identidade, e registre cada fogueira em apenas um gerenciador.

`setIntensity(1.4)` aumenta o fogo gradualmente; `setIntensity(0)` o apaga, mantendo a base. `setPosition(x,y,z)` move a instância. Os demais parâmetros são definidos na construção; para alterá-los, desregistre, descarte e recrie a fogueira. `dispose()` é idempotente. Ao remover uma fogueira do gerenciador, use `pool.unregister(fire)` antes de `fire.dispose()`; ao encerrar tudo, descarte primeiro o gerenciador.

## 4. Configuração

As cores são strings CSS interpretadas por `THREE.Color`. Medidas são locais; `size` e transformações do grupo afetam o conjunto. Contagens aceitam inteiros até 128, com mínimos para a base. Valores padrão:

| Parâmetro | Padrão | Efeito |
| --- | --- | --- |
| `size` | `1` | Escala geral; o alcance da luz acompanha a escala mundial. |
| `intensity` | `1` | Intensidade inicial de fogo, brasas e iluminação. |
| `seed` | `1` | Fase temporal; sementes distintas evitam fogueiras sincronizadas entre si. |
| `stoneCount` | `10` | Pedras do anel; mínimo 3. |
| `logCount` | `5` | Troncos cruzados; mínimo 2. |
| `emberCount` | `14` | Brasas sólidas; mínimo 1. |
| `flameCount` | `28` | Quads de chama; mínimo 1. |
| `sparkCount` | `8` | Faíscas; zero remove o lote. |
| `smokeCount` | `6` | Quads de fumaça; zero remove o lote. |
| `smoke` | `true` | Ativa a fumaça. |
| `speed` | `0.8` | Velocidade geral da animação e oscilação. |
| `lifetime` | `1.4` | Vida base de cada partícula, em segundos, antes do multiplicador de velocidade e variação individual. |
| `flameHeight` | `1.55` | Altura do deslocamento das chamas. |
| `flameWidth` | `0.48` | Largura base dos billboards de chama. |
| `spread` | `0.32` | Dispersão horizontal na origem. |
| `sway` | `0.14` | Amplitude da ondulação lateral. |
| `flameOpacity` | `0.38` | Peso aditivo; aumentar demais deixa o núcleo branco. |
| `sparkSize` | `0.035` | Largura das faíscas. |
| `sparkHeight` | `2.5` | Altura atingida pelas faíscas. |
| `smokeOpacity` | `0.055` | Opacidade sutil da fumaça. |
| `smokeSize` | `0.65` | Largura inicial da fumaça; expande ao subir. |
| `smokeHeight` | `2.9` | Altura do deslocamento da fumaça. |
| `windX`, `windZ` | `0.1`, `0.04` | Desvio horizontal acumulado ao subir. |
| `coreColor` | `#fff1b0` | Amarelo claro do núcleo. |
| `middleColor` | `#ff8b20` | Laranja intermediário. |
| `tipColor` | `#8d2108` | Vermelho escuro das pontas antes de desaparecer. |
| `emberColor` | `#ff5b0a` | Cor das brasas. |
| `smokeColor` | `#77746e` | Cor da fumaça. |
| `woodColor` | `#4d3022` | Cor principal da lenha. |
| `stoneColor` | `#797e72` | Cor principal das pedras. |
| `lightIntensity` | `9` | Intensidade base da PointLight em candela, para escala 1. |
| `lightDistance` | `5` | Alcance base; zero significa ilimitado no Three.js, evite em mapas grandes. |
| `lightHeight` | `0.85` | Posição vertical da luz. |
| `lightDecay` | `2` | Decaimento; manter 2 para iluminação fisicamente coerente. |
| `lightWarmColor`, `lightHotColor` | `#ff7824`, `#ffbd60` | Extremos da variação de cor da luz. |
| `flickerAmplitude` | `0.22` | Amplitude relativa da oscilação compartilhada, de 0 a 1. |
| `flickerSpeed` | `1` | Multiplicador de frequência da oscilação. |
| `radiusAmplitude` | `0.08` | Oscilação relativa do alcance da luz. |
| `emberEmission` | `2.1` | Brilho emissivo das brasas. |
| `glowOpacity` | `0.19` | Brilho aditivo suave sobre o chão. |
| `glowRadius` | `1.6` | Raio do plano de brilho. |
| `shadows` | `false` | Sombras da luz individual. O gerenciador sempre as desativa. |
| `shadowMapSize` | `256` | Resolução de cada face quando sombras individuais são habilitadas. |
| `maxIntensity` | `3` | Teto aceito por `setIntensity`. |
| `intensityResponse` | `4` | Rapidez da suavização exponencial da intensidade. |
| `maxDeltaTime` | `0.1` | Limite de avanço por frame para evitar saltos ao retornar à aba. |
| `maxActiveLights` | `3` | Padrão global do gerenciador; alterar pelo construtor `new CampfireLightPool(n)`, não pelas opções individuais. |
| `lightFadeSpeed` | `6` | Rapidez das transições de luz entre fogueiras. |

Para sombras individuais, também habilite `renderer.shadowMap.enabled` e `receiveShadow` nos receptores. O editor mantém suas sombras existentes; a fogueira não adiciona sombras pontuais por padrão. Uma luz sem sombras ilumina através de paredes: é uma troca de custo desta versão.

### Custo e validação

- Padrão: **42 billboards** (28 chamas, 8 faíscas, 6 de fumaça), **1.370 triângulos** e **6 chamadas de desenho** por fogueira na passagem principal. Sombras existentes, seleção e outros efeitos podem acrescentar passagens.
- Sem fumaça: 36 billboards, 1.358 triângulos e 5 chamadas. A animação de partículas é feita na GPU; não há criação de vetores, cores ou arrays nos métodos `update`.
- Geometrias e materiais são compartilhados entre configurações compatíveis. Duas texturas de 64×64 RGBA ocupam cerca de 43 KiB incluindo mipmaps, compartilhados. Alterar contagens ou cores da base cria outro conjunto de recursos.
- O gerenciador mantém no máximo 3 PointLights para as fogueiras, escolhe pelas distâncias à câmera e interseção do alcance com o frustum, respeita ancestrais ocultos e troca luzes com fade. Esse orçamento não inclui luzes de lanternas ou outros assets existentes.
- Para celular, comece com 18 chamas, 4 faíscas, fumaça desligada, 1 ou 2 luzes e DPR no máximo 1.5. Avalie o resultado no aparelho alvo.
- Verificações: 89 testes do projeto passaram, incluindo equivalência temporal a 30/60/144 FPS simulados, continuidade, descarte, configurações e orçamento. Build de produção concluído. Compilação GLSL nativa não equivale à validação final no WebGL do navegador.
- **60 FPS em hardware modesto ainda não foram medidos.** O navegador de QA não oferece WebGL 2. Use os contadores do laboratório com 1/5/20 fogueiras em seu notebook e celular; registre resolução, DPR e hardware. Os critérios de visual final e FPS permanecem pendentes dessa conferência.

## 5. Ajustes finos

| Resultado desejado | Alteração |
| --- | --- |
| Chama 20% mais lenta | `speed: 0.64` (padrão 0.8 × 0.8). |
| Fogo mais calmo | `speed: 0.6`, `sway: 0.08`, `flickerAmplitude: 0.12`. |
| Fogo mais forte | `fire.setIntensity(1.4)`; ajuste `lightIntensity` se desejar apenas mais iluminação. |
| Oscilação mais perceptível | `flickerAmplitude: 0.32`, `radiusAmplitude: 0.12`. |
| Mais estilizado, com línguas largas | `flameCount: 18`, `flameWidth: 0.6`, `flameOpacity: 0.3`. |
| Núcleo branco demais | Reduzir primeiro `flameOpacity` ou `flameCount`, preservando a PointLight. |
| Fumaça pesada | Reduzir `smokeOpacity` ou usar `smoke: false`. |
| Menor custo | Reduzir fumaça/faíscas, DPR e orçamento de luzes antes da geometria da base. |

## 6. Melhorias futuras

1. LOD e pausa de partículas distantes ou fora da tela.
2. Um lote de partículas compartilhado entre todas as fogueiras do mapa.
3. Fumaça com interseção suave por profundidade, avaliando o custo do depth buffer.
4. Bloqueio da luz por paredes usando conhecimento do mapa.
5. Controles de vento, intensidade e cor no inspetor do editor.

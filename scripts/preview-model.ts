/**
 * Pré-visualização local de um modelo, de vários ângulos, sem navegador.
 * Uso: npm run modelo:previa -- tenda [quantidadeDeAngulos] [largura]
 * Gera capturas/modelo-<nome>-<n>.png e imprime malhas, partes e limites.
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import * as T from 'three';
import {buildDetailedModel} from '../src/scene/detailedModels';
import {buildTreeModel} from '../src/scene/treeModels';
import {isTreeKind, TREE_KINDS} from '../src/features/assets/treeKinds';
import {DETAILED_KINDS, isDetailedKind} from '../src/features/assets/detailedKinds';
import {direcaoDeAngulos, renderModelPreview} from './preview-raster';

const [nome = 'tent', quantidade = '4', larguraTexto = '640'] = process.argv.slice(2);
const angulos = Math.max(1, Math.min(8, Number(quantidade) || 4));
const largura = Math.max(240, Number(larguraTexto) || 640);
const altura = Math.round(largura * (200 / 280));

const modelo = isTreeKind(nome) ? buildTreeModel(nome) : isDetailedKind(nome) ? buildDetailedModel(nome) : null;
if (!modelo) {
  console.error(`Modelo desconhecido: ${nome}. Disponíveis: ${[...TREE_KINDS, ...DETAILED_KINDS].join(', ')}`);
  process.exit(1);
}

const contagem: Record<string, {malhas: number; triangulos: number}> = {};
let triangulos = 0;
modelo.traverse((obj) => {
  if (!(obj instanceof T.Mesh)) return;
  const n = ((obj.geometry.index?.count ?? obj.geometry.getAttribute('position').count) as number) / 3;
  triangulos += n;
  const parte = obj.name || '(sem nome)';
  contagem[parte] = contagem[parte] ?? {malhas: 0, triangulos: 0};
  contagem[parte].malhas++;
  contagem[parte].triangulos += n;
});

const limites = new T.Box3().setFromObject(modelo);
mkdirSync('capturas', {recursive: true});
const vistas = Array.from({length: angulos}, (_, i) => ({azimute: (360 / angulos) * i + 30, elevacao: i % 2 ? 26 : 14}));
vistas.forEach((vista, i) => {
  const arquivo = `capturas/modelo-${nome}-${i + 1}.png`;
  writeFileSync(arquivo, renderModelPreview(modelo, {direcao: direcaoDeAngulos(vista), largura, altura}));
  console.log(`${arquivo}  azimute ${Math.round(vista.azimute)}°  elevação ${vista.elevacao}°`);
});

console.log(`\n${nome}: ${triangulos} triângulos, ${modelo.children.length} malhas`);
for (const [parte, dado] of Object.entries(contagem)) console.log(`  ${parte.padEnd(10)} ${dado.malhas} malha(s)  ${Math.round(dado.triangulos)} triângulos`);
console.log(`limites  min ${limites.min.toArray().map((v) => v.toFixed(2)).join(', ')}  max: ${limites.max.toArray().map((v) => v.toFixed(2)).join(', ')}`);

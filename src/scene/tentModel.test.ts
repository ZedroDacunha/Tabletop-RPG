import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import * as T from 'three';
import {buildTentModel} from './tentModel';
import previews from '../features/assets/modelPreviews.json';
import {direcaoDeAngulos, renderModelPreview} from '../../scripts/preview-raster';

const HALF_W = 1.24, HALF_D = 1.6, RIDGE = 2.18, EAVE = .62, DOOR_W = .52;
function malhas(model: T.Group) { return model.children as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>[]; }
function descartar(model: T.Group) { for (const m of malhas(model)) { m.geometry.dispose(); m.material.dispose(); } }
/** Decodifica o PNG do rasterizador (filtro 0, RGBA) e conta pixels diferentes. */
function contarDiferencas(a: Buffer, b: Buffer) {
  const ler = (png: Buffer) => {
    const partes: Buffer[] = [];
    let off = 8, largura = png.readUInt32BE(16), altura = png.readUInt32BE(20);
    while (off < png.length) {
      const tamanho = png.readUInt32BE(off), tipo = png.toString('ascii', off + 4, off + 8);
      if (tipo === 'IDAT') partes.push(png.subarray(off + 8, off + 8 + tamanho));
      off += 12 + tamanho;
    }
    const cru = inflateSync(Buffer.concat(partes)), rgba = Buffer.alloc(largura * altura * 4);
    for (let y = 0; y < altura; y++) cru.copy(rgba, y * largura * 4, y * (largura * 4 + 1) + 1, (y + 1) * (largura * 4 + 1));
    return rgba;
  };
  const pa = ler(a), pb = ler(b);
  let total = 0;
  for (let p = 0; p < pa.length; p += 4) if (pa[p] !== pb[p] || pa[p + 1] !== pb[p + 1] || pa[p + 2] !== pb[p + 2]) total++;
  return total;
}
function triangulos(m: T.Mesh) { const p = m.geometry.getAttribute('position'); return (m.geometry.index?.count ?? p.count) / 3; }
/** meia largura interna da tenda na altura `y` (o perfil do oitão é um triângulo). */
function meiaLarguraEm(y: number) { return y <= EAVE ? HALF_W : HALF_W * (1 - (y - EAVE) / (RIDGE - EAVE)); }

test('tent is assembled from the five declared parts inside the draw-call and triangle budget', () => {
  const model = buildTentModel(), partes = new Map<string, {malhas: number; triangulos: number}>();
  let total = 0;
  for (const m of malhas(model)) {
    const atual = partes.get(m.name) ?? {malhas: 0, triangulos: 0};
    atual.malhas += 1; atual.triangulos += triangulos(m); partes.set(m.name, atual); total += triangulos(m);
    for (const nome of ['position', 'normal']) { const a = m.geometry.getAttribute(nome); for (const n of a.array) assert.ok(Number.isFinite(n), `${m.name} ${nome} não finito`); }
    assert.ok(m.castShadow && m.receiveShadow, `${m.name} sem sombra`);
    assert.ok(m.material.side === T.FrontSide || m.material.side === T.DoubleSide);
  }
  assert.deepEqual([...partes.keys()].sort(), ['cordas', 'estacas', 'estrutura', 'interior', 'lona']);
  for (const parte of ['lona', 'estrutura', 'cordas', 'estacas', 'interior'] as const) assert.ok((partes.get(parte)?.malhas ?? 0) > 0, `${parte} ausente`);
  // lona e estrutura são as partes densas; cordas e interior existem só para leitura de perto.
  assert.ok(partes.get('lona')!.malhas <= 6, 'lona fragmentada demais');
  assert.ok(partes.get('estrutura')!.malhas <= 3, 'estrutura fragmentada demais');
  const bounds = new T.Box3().setFromObject(model);
  assert.ok(bounds.min.y >= -.2 && bounds.min.y < .05, `tenda abaixo do chão: ${bounds.min.y}`);
  assert.ok(bounds.max.y > RIDGE, 'cumeeira abaixo do esperado');
  assert.ok(bounds.max.x - bounds.min.x < 4.2 && bounds.max.z - bounds.min.z < 5.4, 'pegadas das estacas exageradas');
  assert.ok(malhas(model).length <= 18 && total > 1200 && total < 6000, `${malhas(model).length} malhas / ${total} triângulos`);
  descartar(model);
});

test('entrance has a clear passage and canvas above and beside it', () => {
  const model = buildTentModel(), ray = new T.Raycaster();
  const naFrente = (x: number, y: number) => {
    ray.set(new T.Vector3(x, y, HALF_D + .18), new T.Vector3(0, 0, -1));
    // A passagem termina antes da armação; o interior e o fundo não contam como porta.
    return ray.intersectObject(model, true).filter((hit) => hit.distance < .32);
  };
  for (const x of [-.35, -.2, 0, .2, .35]) {
    for (const y of [.2, .6, 1, 1.4]) {
      assert.equal(naFrente(x, y).length, 0, `passagem obstruída em ${x}, ${y}`);
    }
  }
  for (const [x, y] of [[0, 1.52], [0, 1.8], [-.4, 1.52], [.4, 1.52], [-.8, .4], [.8, .4]]) {
    assert.equal(naFrente(x, y)[0]?.object.name, 'lona', `frente aberta fora da porta em ${x}, ${y}`);
  }
  descartar(model);
});

test('interior props stay inside the canvas so nothing pokes through the roof', () => {
  const model = buildTentModel();
  for (const m of malhas(model)) {
    if (m.name !== 'interior') continue;
    const p = m.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      assert.ok(y >= -.05 && y <= RIDGE - .05, `interior acima da cumeeira: ${y.toFixed(2)}`);
      assert.ok(Math.abs(x) <= meiaLarguraEm(y) - .02, `interior furando a lona em x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
      assert.ok(Math.abs(z) <= HALF_D - .02, `interior furando o oitão em z=${z.toFixed(2)}`);
    }
  }
  descartar(model);
});

test('every outside sightline lands on canvas or structure, never on the interior', () => {
  const model = buildTentModel(), raio = new T.Raycaster(), olho = new T.Vector3(), alvo = new T.Vector3();
  const disparar = (origem: T.Vector3, direcao: T.Vector3, x: number, y: number) => {
    raio.set(origem, direcao);
    const toques = raio.intersectObject(model, true);
    assert.ok(toques.length > 0, `vista aberta em (${x.toFixed(2)}, ${y.toFixed(2)})`);
    assert.notEqual((toques[0].object as T.Mesh).name, 'interior', `interior visível em (${x.toFixed(2)}, ${y.toFixed(2)})`);
  };
  for (let y = .1; y <= RIDGE - .1; y += .12) {
    const limite = meiaLarguraEm(y) - .06;
    for (let x = -limite; x <= limite; x += .12) {
      disparar(olho.set(x, y, -6), alvo.set(0, 0, 1), x, y);            // fundo do oitão
      if (Math.abs(x) <= DOOR_W + .06 && y <= 1.58) continue;           // portinhola é passagem
      disparar(olho.set(x, y, 6), alvo.set(0, 0, -1), x, y);            // frente, fora da porta
    }
  }
  for (let y = .1; y <= RIDGE - .1; y += .15) {
    for (let z = -HALF_D + .1; z <= HALF_D - .1; z += .15) {
      if (y > EAVE + .05 && Math.abs(z) > meiaLarguraEm(y) - .1) continue; // fora do perfil da lona
      for (const lado of [-1, 1]) disparar(olho.set(lado * 6, y, z), alvo.set(-lado, 0, 0), z, y); // laterais
    }
  }
  descartar(model);
});

test('canvas faces are wound outwards so both slopes are lit from every angle', () => {
  const model = buildTentModel(), normal = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  for (const m of malhas(model)) {
    // só a lona é superfície aberta: a estrutura de madeira é sólido fechado.
    if (m.name !== 'lona' || m.material.side === T.DoubleSide) continue;
    const p = m.geometry.getAttribute('position'), idx = m.geometry.index;
    const quantidade = idx?.count ?? p.count;
    let virados = 0, total = 0;
    for (let i = 0; i < quantidade; i += 3) {
      const [i0, i1, i2] = [0, 1, 2].map((k) => idx ? idx.getX(i + k) : i + k);
      a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2);
      normal.copy(b).sub(a).cross(c.clone().sub(a));
      const centro = a.clone().add(b).add(c).multiplyScalar(1 / 3);
      // radial a partir do eixo da cumeeira: é para onde a lona deve olhar;
      // a cumeeira e as peças horizontais ficam com componente vertical dominante.
      const radial = new T.Vector3(centro.x, 0, centro.z);
      if (radial.length() < .12) radial.set(0, 1, 0);
      total++;
      if (normal.dot(radial) < -1e-6) virados++;
    }
    assert.ok(virados / total < .02, `${m.name}: ${virados}/${total} triângulos virados para dentro`);
  }
  descartar(model);
});

test('tent builds deterministically and ships a preview thumbnail', () => {
  const a = buildTentModel(), b = buildTentModel();
  assert.equal(malhas(a).length, malhas(b).length);
  for (let i = 0; i < malhas(a).length; i++) assert.deepEqual(Array.from(malhas(a)[i].geometry.getAttribute('position').array), Array.from(malhas(b)[i].geometry.getAttribute('position').array));
  assert.match(String(previews.tent), /^data:image\/png;base64,/);
  assert.ok(String(previews.tent).length > 4000, 'miniatura da tenda vazia');
  assert.equal(previews.tent, 'data:image/png;base64,' + renderModelPreview(a).toString('base64'), 'miniatura desatualizada');
  descartar(a); descartar(b);
});

test('nothing from inside shows through the canvas in a rendered view', () => {
  // A miniatura usa o mesmo rasterizador da biblioteca. A referência mantém só o pano
  // de chão (que encosta na lona por dentro) e remove o resto do interior: se a lona
  // de fundo ou algum objeto aparecer por fora, a imagem muda.
  for (const azimute of [90, 120, 210, 270]) {
    const direcao = direcaoDeAngulos({azimute, elevacao: 20});
    const completo = buildTentModel(), soChao = buildTentModel();
    for (const m of [...soChao.children] as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>[]) {
      if (m.name !== 'interior' || m.material.color.getHexString() === '8b7c5c') continue;
      soChao.remove(m); m.geometry.dispose(); m.material.dispose();
    }
    const caixaA = new T.Box3().setFromObject(completo), caixaB = new T.Box3().setFromObject(soChao);
    assert.ok(caixaA.min.equals(caixaB.min) && caixaA.max.equals(caixaB.max), 'interior altera o enquadramento');
    const comPecas = renderModelPreview(completo, {direcao, largura: 320, altura: 240});
    const semPecas = renderModelPreview(soChao, {direcao, largura: 320, altura: 240});
    // O rasterizador amostra o centro do pixel: nas vistas rasantes sobram até
    // alguns pixels isolados no encontro do beiral. O defeito que este teste
    // protege (pano de fundo atravessando a lona) ocupava centenas de pixels.
    const diferentes = contarDiferencas(comPecas, semPecas);
    assert.ok(diferentes <= 8, `interior visível por fora na vista ${azimute}°: ${diferentes} pixels`);
    descartar(completo); descartar(soChao);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import * as T from 'three';
import {buildTentModel} from './tentModel';
import {criarConstrutor} from './tents/helpers';
import {amostrarAgua, construirLona} from './tents/parts/canvas';
import {construirEntrada} from './tents/parts/entrance';
import {construirEstaca} from './tents/parts/stakes';
import {PASSO_CORDA} from './tents/ropeTexture';
import {TAMANHO_TRAMA} from './tents/canvasTexture';
import {PASSO_PONTO} from './tents/seamTexture';
import previews from '../features/assets/modelPreviews.json';
import {direcaoDeAngulos, renderModelPreview} from '../../scripts/preview-raster';

const HALF_W = 1.24, HALF_D = 1.6, RIDGE = 2.18, EAVE = .62, DOOR_W = .52;
function malhas(model: T.Group) { return model.children as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>[]; }
function descartar(model: T.Group) { for (const m of malhas(model)) { m.geometry.dispose(); m.material.map?.dispose(); m.material.bumpMap?.dispose(); m.material.dispose(); } }
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

test('entrance flaps and their ties stay close to the front canvas on both sides', () => {
  const builder = criarConstrutor();
  construirEntrada(builder);
  const model = builder.montar(), meshes = malhas(model), ray = new T.Raycaster();
  const flap = meshes.find((m) => m.name === 'lona' && m.material.color.getHexString() === 'cdba8c')!;
  const wall = meshes.find((m) => m.name === 'lona' && m.material.color.getHexString() === 'c1ad80')!;
  const ties = meshes.find((m) => m.name === 'cordas')!;
  assert.ok(flap && wall && ties);
  const pos = flap.geometry.getAttribute('position');
  let tested = 0;
  for (let i = 0; i < pos.count; i += 3) {
    const p = new T.Vector3();
    for (let j = 0; j < 3; j++) p.add(new T.Vector3().fromBufferAttribute(pos, i + j));
    p.multiplyScalar(1 / 3);
    // O oitão central tem z=HALF_D; só as abas têm pequena folga positiva.
    if (p.z < HALF_D + .0035) continue;
    ray.set(p.clone().add(new T.Vector3(0, 0, .03)), new T.Vector3(0, 0, -1));
    const suporte = ray.intersectObject(wall)[0];
    assert.ok(suporte, `aba sem parede atrás: ${p.toArray()}`);
    const afastamento = suporte.distance - .03;
    assert.ok(afastamento >= .003 && afastamento <= .013, `aba descolada da parede: ${afastamento}`);
    tested++;
  }
  assert.ok(tested > 100, 'abas não encontradas');
  const tiePositions = ties.geometry.getAttribute('position');
  for (let i = 0; i < tiePositions.count; i++) {
    assert.ok(tiePositions.getZ(i) >= HALF_D - .002 && tiePositions.getZ(i) <= HALF_D + .025, 'amarração solta');
  }
  for (const lado of [-1, 1]) for (const u of [.125, .375, .625, .875]) {
    const x = lado * (DOOR_W + .02 + .10 * u);
    const topo = RIDGE + Math.abs(x) / HALF_W * (EAVE - RIDGE);
    const y = .04 + .5 * (Math.min(1.5, topo - .025) - .04);
    ray.set(new T.Vector3(x, y, HALF_D + .05), new T.Vector3(0, 0, -1));
    const corda = ray.intersectObject(ties)[0], tecido = ray.intersectObject(flap)[0];
    assert.ok(corda && tecido && corda.distance < tecido.distance, `amarração fora da aba: ${lado}, ${u}`);
    assert.ok(tecido.distance - corda.distance < .015, 'amarração afastada da aba');
  }
  descartar(model);
});

test('the entrance looks through the interior without the dark panel', () => {
  const model = buildTentModel(), ray = new T.Raycaster();
  // A linha de visão passa acima dos acessórios, da entrada até a lona dos fundos.
  for (const x of [-.15, 0, .15]) for (const y of [.75, 1.1]) {
    ray.set(new T.Vector3(x, y, HALF_D - .1), new T.Vector3(0, 0, -1));
    const hit = ray.intersectObject(model, true)[0];
    assert.ok(hit, 'lona dos fundos ausente');
    assert.equal(hit.object.name, 'lona', `objeto obstrui o interior em ${x}, ${y}`);
    assert.ok(hit.point.z < -HALF_D + .1, 'obstáculo antes dos fundos');
  }
  // O piso e os dois acessórios continuam presentes.
  const coresInterior = malhas(model).filter((m) => m.name === 'interior').map((m) => m.material.color.getHexString());
  for (const cor of ['8b7c5c', 'b3a075', '6d5a3e']) assert.ok(coresInterior.includes(cor));
  assert.ok(!coresInterior.includes('332f26'));
  descartar(model);
});

test('roof patch and seams stay attached to the triangulated canvas', () => {
  const builder = criarConstrutor();
  construirLona(builder);
  const model = builder.montar();
  const meshes = malhas(model);
  const isColor = (mesh: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>, color: string) => mesh.material.color.getHexString() === color;
  const base = meshes.filter((m) => isColor(m, 'cdba8c') || isColor(m, 'c1ad80'));
  const details = meshes.filter((m) => isColor(m, '9c895f') || isColor(m, 'd8c79b'));
  const ray = new T.Raycaster();
  let testedPatch = 0, testedSeams = 0, testedHem = 0;
  for (const mesh of details) {
    const p = mesh.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) {
      const vertices = [0, 1, 2].map((k) => new T.Vector3().fromBufferAttribute(p, i + k));
      // Amostra o centro e pontos próximos às três bordas dos triângulos.
      for (const weights of [[1 / 3, 1 / 3, 1 / 3], [.8, .1, .1], [.1, .8, .1], [.1, .1, .8]]) {
        const point = new T.Vector3();
        vertices.forEach((vertex, k) => point.addScaledVector(vertex, weights[k]));
        const roof = point.y > .25;
        const direction = roof ? new T.Vector3(Math.sign(point.x) * .786, .618, 0) : new T.Vector3(Math.sign(point.x), 0, 0);
        if (direction.x === 0) continue;
        ray.set(point.clone().addScaledVector(direction, .03), direction.clone().negate());
        const hit = ray.intersectObjects(base, false)[0];
        assert.ok(hit, `detalhe sem lona sob ele: ${point.toArray()}`);
        const gap = hit.distance - .03;
        assert.ok(gap > .001 && gap < .012, `detalhe descolado ou atravessando a lona: ${gap}`);
        if (isColor(mesh, 'd8c79b')) testedPatch++;
        else if (roof) testedSeams++;
        else testedHem++;
      }
    }
  }
  assert.ok(testedPatch > 0 && testedSeams > 0 && testedHem > 0);
  descartar(model);
});

test('canvas edges meet at the eaves and end walls without projecting past the corners', () => {
  const builder = criarConstrutor();
  construirLona(builder);
  const model = builder.montar();
  const canvas = malhas(model).filter((m) => ['cdba8c', 'c1ad80'].includes(m.material.color.getHexString()));
  // O telhado e a lateral devem compartilhar cada vértice do beiral, mesmo onde a lona cede.
  for (const lado of [-1, 1]) for (let i = 0; i <= 24; i++) {
    const point = new T.Vector3(...amostrarAgua(lado, i / 24, 1));
    let noTelhado = false, naParede = false;
    for (const mesh of canvas) {
      const pos = mesh.geometry.getAttribute('position'), normal = mesh.geometry.getAttribute('normal');
      for (let j = 0; j < pos.count; j++) {
        if (point.distanceTo(new T.Vector3().fromBufferAttribute(pos, j)) > 1e-5) continue;
        if (normal.getY(j) > .3) noTelhado = true;
        if (Math.abs(normal.getX(j)) > .95 && Math.abs(normal.getY(j)) < .3) naParede = true;
      }
    }
    assert.ok(noTelhado && naParede, `fresta no beiral ${lado}, ${i}/24`);
  }
  // Nos planos de extremidade, a lona não pode passar do encontro das paredes.
  for (const mesh of canvas) {
    const pos = mesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      assert.ok(Math.abs(z) <= HALF_D + 1e-5, `lona além da extremidade: ${z}`);
      if (Math.abs(Math.abs(z) - HALF_D) < 1e-5) {
        assert.ok(Math.abs(x) <= HALF_W + 1e-5, `ponta da lona além da quina: ${x}`);
      }
    }
  }
  descartar(model);
});

test('entrance borders stay below the roof profile', () => {
  const model = buildTentModel();
  const border = malhas(model).find((m) => m.name === 'lona' && m.material.color.getHexString() === '9c895f' && !m.material.map);
  assert.ok(border);
  const pos = border.geometry.getAttribute('position');
  let checked = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(z - (HALF_D + .003)) > 1e-5) continue;
    const roof = RIDGE + Math.abs(x) / HALF_W * (EAVE - RIDGE);
    assert.ok(y <= roof + 1e-5, `borda da porta passa pelo teto: ${x}, ${y}`);
    checked++;
  }
  assert.ok(checked > 0, 'bordas da entrada não encontradas');
  descartar(model);
});

test('the four canvas corners stay closed when viewed diagonally', () => {
  const model = buildTentModel(), ray = new T.Raycaster();
  const canvas = malhas(model).filter((m) => m.name === 'lona');
  for (const side of [-1, 1]) for (const end of [-1, 1]) for (const y of [.08, .25, .45, .58]) {
    const origin = new T.Vector3(side * (HALF_W + .25), y, end * (HALF_D + .25));
    const target = new T.Vector3(side * (HALF_W - .04), y, end * (HALF_D - .04));
    ray.set(origin, target.sub(origin).normalize());
    const hit = ray.intersectObjects(canvas, false)[0];
    assert.ok(hit && hit.distance < .39, `fresta na quina ${side}, ${end}, ${y}`);
  }
  descartar(model);
});

test('roof covers the rafters near both ends', () => {
  const model = buildTentModel(), ray = new T.Raycaster();
  const canvas = malhas(model).filter((m) => m.name === 'lona' && ['cdba8c', 'c1ad80'].includes(m.material.color.getHexString()));
  const structure = malhas(model).filter((m) => m.name === 'estrutura');
  for (const lado of [-1, 1]) for (const aoLongo of [.02, .03, .97, .98]) for (let v = .08; v < .94; v += .02) {
    const pos = new T.Vector3(...amostrarAgua(lado, aoLongo, v));
    const normal = new T.Vector3(lado * .786, .618, 0);
    ray.set(pos.clone().addScaledVector(normal, .15), normal.clone().negate());
    const pano = ray.intersectObjects(canvas, false)[0], madeira = ray.intersectObjects(structure, false)[0];
    assert.ok(pano, 'lona ausente sobre o caibro');
    if (madeira) assert.ok(madeira.distance >= pano.distance - .001, `caibro acima da lona em ${lado}, ${aoLongo}, ${v}`);
  }
  descartar(model);
});

test('guy ropes wrap around both the ridge pole and the inclined stakes', () => {
  const model = buildTentModel(), ray = new T.Raycaster();
  const cordas = malhas(model).filter((m) => m.name === 'cordas');
  const madeira = malhas(model).filter((m) => m.name === 'estrutura');
  const estacas = malhas(model).filter((m) => m.name === 'estacas');
  const verificarVolta = (centro: T.Vector3, radial: T.Vector3, suporte: typeof madeira) => {
    ray.set(centro.clone().addScaledVector(radial, .15), radial.clone().negate());
    const corda = ray.intersectObjects(cordas)[0], peca = ray.intersectObjects(suporte)[0];
    assert.ok(corda && peca && corda.distance < peca.distance, `amarração fora do suporte: ${centro.toArray()}`);
  };
  for (const lado of [-1, 1]) for (const ponta of [-1, 1]) {
    const zTopo = ponta * (HALF_D + (lado < 0 ? .07 : .115));
    for (const dz of [-.009, .009]) for (const a of [.3, 1.8, 3.4, 4.9]) {
      verificarVolta(new T.Vector3(0, RIDGE, zTopo + dz + .001), new T.Vector3(Math.cos(a), Math.sin(a), 0), madeira);
    }
    const seno = Math.sin(.38), cosseno = Math.cos(.38);
    const eixo = new T.Vector3(lado * seno, cosseno, 0);
    const lateral = new T.Vector3(cosseno, -lado * seno, 0);
    const base = new T.Vector3(lado * 1.62, .1, ponta * (HALF_D + .78));
    for (const altura of [.068, .088]) for (const a of [.3, 1.8, 3.4, 4.9]) {
      const radial = lateral.clone().multiplyScalar(Math.cos(a)).add(new T.Vector3(0, 0, Math.sin(a)));
      verificarVolta(base.clone().addScaledVector(eixo, altura), radial, estacas);
    }
    // Confere a presença do trecho principal próximo de cada amarração.
    const topo = new T.Vector3(lado * .059, RIDGE, zTopo);
    const pe = base.clone().addScaledVector(eixo, .088).add(new T.Vector3(-lado * cosseno * .032, seno * .032, 0));
    for (const t of [.04, .96]) {
      const ponto = topo.clone().lerp(pe, t); ponto.y -= .1 * Math.min(t, 1 - t);
      ray.set(ponto.clone().add(new T.Vector3(0, 0, .08)), new T.Vector3(0, 0, -1));
      const hit = ray.intersectObjects(cordas)[0];
      assert.ok(hit && hit.distance < .095, `tirante interrompido em ${lado}, ${ponta}, ${t}`);
    }
  }
  descartar(model);
});

test('roof canvas weave is seamless and deterministic', () => {
  const construirTelhado = () => {
    const builder = criarConstrutor();
    let faixas = 0;
    construirLona({...builder, superficie: (...args) => {
      if (args[1].textura === 'trama' && args[1].cor !== '#d8c79b' && faixas++ < 8) builder.superficie(...args);
    }});
    assert.equal(faixas, 12, 'o telhado e as quatro superfícies das paredes devem ter trama');
    return builder.montar();
  };
  const a = construirTelhado(), b = construirTelhado();
  const roof = malhas(a).filter((m) => m.name === 'lona' && m.material.map instanceof T.DataTexture);
  const otherRoof = malhas(b).filter((m) => m.name === 'lona' && m.material.map instanceof T.DataTexture);
  assert.equal(roof.length, 2, 'as duas cores do telhado devem ter trama');
  const slopeLength = Math.hypot(HALF_W, RIDGE - EAVE);
  for (let n = 0; n < roof.length; n++) {
    const mesh = roof[n], map = mesh.material.map, bump = mesh.material.bumpMap;
    assert.ok(map instanceof T.DataTexture && bump instanceof T.DataTexture);
    assert.equal(map.colorSpace, T.SRGBColorSpace);
    assert.equal(bump.colorSpace, T.NoColorSpace);
    assert.equal(map.wrapS, T.RepeatWrapping); assert.equal(map.wrapT, T.RepeatWrapping);
    assert.ok(map.generateMipmaps && mesh.material.bumpScale > 0 && mesh.material.roughness > .8);
    assert.deepEqual(map.image.data, (otherRoof[n].material.map as T.DataTexture).image.data);
    const data = map.image.data as Uint8Array;
    assert.ok(new Set(data.filter((_, i) => i % 4 === 0)).size > 10, 'trama sem variação');
    const pos = mesh.geometry.getAttribute('position'), uv = mesh.geometry.getAttribute('uv');
    assert.equal(uv.count, pos.count);
    for (let i = 0; i < uv.count; i++) {
      const along = (pos.getZ(i) + HALF_D) / (2 * HALF_D);
      assert.ok(Math.abs(uv.getX(i) - along * 2 * HALF_D / TAMANHO_TRAMA) < 1e-4, 'trama desalinhada entre faixas');
      const across = uv.getY(i) * TAMANHO_TRAMA / slopeLength;
      const expected = amostrarAgua(Math.sign(pos.getX(i)) || 1, along, across);
      assert.ok(new T.Vector3(...expected).distanceTo(new T.Vector3().fromBufferAttribute(pos, i)) < 1e-4, 'UV deslocado da geometria');
    }
  }
  assert.equal(malhas(a.clone(true)).find((m) => m.material.map === roof[0].material.map)?.material, roof[0].material);
  descartar(a); descartar(b);
});

test('roof seams have continuous paired stitches without changing the other borders', () => {
  const builder = criarConstrutor();
  const metades: {ponto: (u: number, v: number) => [number, number, number]; uv: (u: number, v: number) => [number, number]}[] = [];
  let cumeeiras = 0;
  construirLona({...builder, superficie: (...args) => {
    if (args[1].textura !== 'costura') return;
    const uv = args[6]; assert.ok(uv);
    if (args[2] === 1 && args[3] === 6) {
      metades.push({ponto: args[4], uv});
      for (const v of [0, .25, .5, .75, 1]) {
        assert.ok(Math.abs(uv(0, v)[0] - .5) < 1e-8);
        assert.ok(Math.abs(uv(0, v)[1] - v * Math.hypot(HALF_W, RIDGE - EAVE) / PASSO_PONTO) < 1e-8);
      }
      assert.ok(Math.abs(Math.abs(uv(1, .5)[0] - .5) - .5) < 1e-8);
    } else {
      assert.equal(args[2], 24); assert.equal(args[3], 1); cumeeiras++;
      for (const u of [0, .25, .5, .75, 1]) {
        assert.ok(Math.abs(uv(u, .5)[1] - u * 2 * HALF_D / PASSO_PONTO) < 1e-8);
        assert.equal(uv(u, 0)[0], 0); assert.equal(uv(u, 1)[0], 1);
      }
    }
    builder.superficie(...args);
  }});
  assert.equal(metades.length, 12); assert.equal(cumeeiras, 2);
  for (let i = 0; i < metades.length; i += 2) for (const v of [0, .25, .5, .75, 1]) {
    assert.deepEqual(metades[i].ponto(0, v), metades[i + 1].ponto(0, v));
    assert.deepEqual(metades[i].uv(0, v), metades[i + 1].uv(0, v));
    assert.deepEqual([metades[i].uv(1, v)[0], metades[i + 1].uv(1, v)[0]].sort(), [0, 1]);
  }
  const model = builder.montar(), seam = malhas(model)[0];
  assert.equal(malhas(model).length, 1, 'costuras do telhado devem compartilhar material');
  assert.equal(triangulos(seam), 240, 'geometria das costuras deve ser preservada');
  assert.ok(seam.material.map instanceof T.DataTexture && seam.material.bumpMap instanceof T.DataTexture);
  assert.equal(seam.material.map.colorSpace, T.SRGBColorSpace);
  assert.equal(seam.material.bumpMap.colorSpace, T.NoColorSpace);
  assert.equal(seam.material.map.wrapT, T.RepeatWrapping);
  assert.ok(seam.material.map.generateMipmaps && seam.material.roughness > .8 && seam.material.bumpScale > 0);
  assert.equal(seam.geometry.getAttribute('uv').count, seam.geometry.getAttribute('position').count);
  const data = seam.material.bumpMap.image.data as Uint8Array;
  const amostra = (u: number, v: number) => data[(Math.floor(v * 128) * 128 + Math.floor(u * 128)) * 4];
  assert.ok(amostra(.27, .5) > amostra(.27, .05) + 40, 'ponto sem relevo');
  assert.ok(amostra(.73, .5) > amostra(.5, .5) + 40, 'segunda carreira ausente');
  const copia = criarConstrutor(); construirLona(copia); const outro = copia.montar();
  const outraCostura = malhas(outro).find((m) => m.material.color.getHexString() === '9c895f' && m.material.map)!;
  assert.deepEqual(seam.material.map.image.data, (outraCostura.material.map as T.DataTexture).image.data);
  const barra = malhas(outro).find((m) => m.material.color.getHexString() === '9c895f' && !m.material.map);
  assert.ok(barra && !barra.material.bumpMap, 'barra lateral deve ficar para outra etapa');
  const comTextura = renderModelPreview(model, {largura: 700, altura: 500});
  const mapa = seam.material.map; seam.material.map = null;
  const semTextura = renderModelPreview(model, {largura: 700, altura: 500});
  seam.material.map = mapa;
  assert.ok(contarDiferencas(comTextura, semTextura) > 50, 'costura não aparece na prévia');
  descartar(model); descartar(outro);
});

test('roof patch has a scaled weave aligned to the underlying canvas', () => {
  const criar = () => { const b = criarConstrutor(); construirLona(b); return b.montar(); };
  const model = criar(), outro = criar();
  const patch = malhas(model).find((m) => m.material.color.getHexString() === 'd8c79b')!;
  const outroPatch = malhas(outro).find((m) => m.material.color.getHexString() === 'd8c79b')!;
  const seams = malhas(model).find((m) => m.material.color.getHexString() === '9c895f' && !m.material.map)!;
  assert.ok(patch.material.map instanceof T.DataTexture && patch.material.bumpMap instanceof T.DataTexture);
  assert.equal(patch.material.side, T.DoubleSide);
  assert.ok(patch.material.roughness > .8 && patch.material.bumpScale > 0);
  assert.deepEqual(patch.material.map.image.data, (outroPatch.material.map as T.DataTexture).image.data);
  assert.ok(!seams.material.map && !seams.material.bumpMap, 'barra lateral permanece para outra etapa');
  const pos = patch.geometry.getAttribute('position'), uv = patch.geometry.getAttribute('uv');
  assert.equal(pos.count, 12, 'geometria do remendo deve continuar com quatro triângulos');
  assert.equal(uv.count, pos.count);
  for (let i = 0; i < pos.count; i++) {
    const along = uv.getX(i) * TAMANHO_TRAMA / (2 * HALF_D);
    const across = uv.getY(i) * TAMANHO_TRAMA / Math.hypot(HALF_W, RIDGE - EAVE);
    assert.ok(along >= 19 / 24 - 1e-5 && along <= 21 / 24 + 1e-5);
    assert.ok(across >= .5 - 1e-5 && across <= 2 / 3 + 1e-5);
    const [x, y, z] = amostrarAgua(-1, along, across);
    const expected = new T.Vector3(x - .006 * .786, y + .006 * .618, z);
    assert.ok(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos, i)) < 1e-5, 'UV ou geometria do remendo deslocado');
  }
  // Isola o remendo para confirmar que o mapa de cor chega à prévia.
  const detalhe = new T.Group(); detalhe.add(patch.clone());
  const comTextura = renderModelPreview(detalhe, {direcao: [-7, 5, 8], largura: 500, altura: 500});
  const mapa = patch.material.map; patch.material.map = null;
  const semTextura = renderModelPreview(detalhe, {direcao: [-7, 5, 8], largura: 500, altura: 500});
  patch.material.map = mapa;
  assert.ok(contarDiferencas(comTextura, semTextura) > 500, 'trama não aparece na prévia');
  descartar(model); descartar(outro);
});

test('wall weave follows physical coordinates across each facade and leaves details untouched', () => {
  const builder = criarConstrutor();
  let faixas = 0, paredes = 0, frente = 0;
  construirLona({...builder, superficie: (...args) => {
    if (args[1].textura === 'trama' && args[1].cor !== '#d8c79b' && faixas++ >= 8) { paredes++; builder.superficie(...args); }
  }});
  construirEntrada({...builder, superficie: (...args) => {
    if (args[1].textura === 'trama' && args[4](.5, .5)[2] === HALF_D) { frente++; builder.superficie(...args); }
  }});
  assert.equal(paredes, 4, 'duas laterais e duas partes do fundo');
  assert.equal(frente, 3, 'dois lados e painel superior da frente');
  const model = builder.montar();
  let laterais = 0, fundos = 0, fachada = 0;
  for (const mesh of malhas(model).filter((m) => m.name === 'lona')) {
    assert.ok(mesh.material.map instanceof T.DataTexture && mesh.material.bumpMap instanceof T.DataTexture);
    const pos = mesh.geometry.getAttribute('position'), uv = mesh.geometry.getAttribute('uv');
    assert.equal(pos.count, uv.count);
    for (let i = 0; i < pos.count; i += 3) {
      const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const extremidade = Math.abs(Math.abs(z) - HALF_D) < 1e-5;
      if (extremidade) z < 0 ? fundos++ : fachada++; else laterais++;
      for (let j = i; j < i + 3; j++) {
        const horizontal = extremidade ? pos.getX(j) + HALF_W : pos.getZ(j) + HALF_D;
        assert.ok(Math.abs(uv.getX(j) - horizontal / TAMANHO_TRAMA) < 1e-4, 'escala horizontal ou junção da trama incorreta');
        assert.ok(Math.abs(uv.getY(j) - pos.getY(j) / TAMANHO_TRAMA) < 1e-4, 'escala vertical ou junção da trama incorreta');
      }
    }
  }
  assert.ok(laterais && fundos && fachada, 'faltam paredes texturizadas');
  descartar(model);

  const entrada = criarConstrutor();
  construirEntrada(entrada);
  const modeloEntrada = entrada.montar();
  const seams = malhas(modeloEntrada).find((m) => m.name === 'lona' && m.material.color.getHexString() === '9c895f');
  assert.ok(seams && !seams.material.map && !seams.material.bumpMap, 'costuras devem permanecer sem alteração');
  descartar(modeloEntrada);
});

test('both entrance flaps receive a correctly scaled canvas weave without changing seams', () => {
  const construirAbas = () => {
    const builder = criarConstrutor();
    let abas = 0;
    construirEntrada({...builder, viga: () => {}, superficie: (...args) => {
      // Apenas as abas ficam levemente à frente do plano da fachada.
      if (args[4](.5, .5)[2] > HALF_D + .0035 && args[1].cor === '#cdba8c') {
        abas++;
        assert.equal(args[1].textura, 'trama');
        builder.superficie(...args);
      }
    }});
    assert.equal(abas, 2);
    return builder.montar();
  };
  const model = construirAbas(), outro = construirAbas();
  const flap = malhas(model)[0], material = flap.material;
  assert.ok(material.map instanceof T.DataTexture && material.bumpMap instanceof T.DataTexture);
  assert.equal(material.side, T.DoubleSide);
  assert.ok(material.roughness > .8 && material.bumpScale > 0);
  assert.deepEqual(material.map.image.data, (malhas(outro)[0].material.map as T.DataTexture).image.data);
  const pos = flap.geometry.getAttribute('position'), uv = flap.geometry.getAttribute('uv');
  assert.equal(pos.count, uv.count);
  let esquerda = 0, direita = 0;
  for (let i = 0; i < pos.count; i++) {
    pos.getX(i) < 0 ? esquerda++ : direita++;
    assert.ok(Math.abs(uv.getX(i) - (pos.getX(i) + HALF_W) / TAMANHO_TRAMA) < 1e-4);
    assert.ok(Math.abs(uv.getY(i) - pos.getY(i) / TAMANHO_TRAMA) < 1e-4);
  }
  assert.ok(esquerda && direita, 'as duas abas devem receber trama');
  const comTextura = renderModelPreview(model, {largura: 600, altura: 600});
  const mapa = material.map; material.map = null;
  const semTextura = renderModelPreview(model, {largura: 600, altura: 600});
  material.map = mapa;
  assert.ok(contarDiferencas(comTextura, semTextura) > 500, 'trama não aparece na prévia');
  descartar(model); descartar(outro);
});

test('flipped canvas triangles keep their UV coordinates attached to the vertices', () => {
  const builder = criarConstrutor();
  builder.superficie('lona', {cor: '#ffffff', textura: 'trama'}, 2, 2,
    (u, v) => [u, v, 0], [0, 0, -1], (u, v) => [u, v]);
  const model = builder.montar(), geom = malhas(model)[0].geometry;
  const pos = geom.getAttribute('position'), uv = geom.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    assert.ok(Math.abs(pos.getX(i) - uv.getX(i)) < 1e-6);
    assert.ok(Math.abs(pos.getY(i) - uv.getY(i)) < 1e-6);
    assert.ok(geom.getAttribute('normal').getZ(i) < -.99);
  }
  descartar(model);
});

test('stakes have a pointed tip, a rope groove and axial UVs', () => {
  const builder = criarConstrutor();
  construirEstaca(builder, 0, 0, 1, .38);
  const model = builder.montar(), stake = malhas(model)[0];
  const geometry = stake.geometry, pos = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  const inverse = new T.Matrix4().compose(new T.Vector3(0, .1, 0),
    new T.Quaternion().setFromEuler(new T.Euler(0, 0, -.38)), new T.Vector3(1, 1, 1)).invert();
  const radiusAt = (altura: number) => {
    const vertices: T.Vector3[] = [];
    for (let i = 0; i < pos.count; i++) {
      const p = new T.Vector3().fromBufferAttribute(pos, i).applyMatrix4(inverse);
      if (Math.abs(p.y - altura) < 1e-5) {
        vertices.push(p);
        assert.ok(Math.abs(uv.getY(i) - (altura + .15) / .3) < 1e-5, 'veios não acompanham o eixo');
      }
    }
    assert.ok(vertices.length > 0, `perfil ausente em ${altura}`);
    return Math.max(...vertices.map((p) => Math.hypot(p.x, p.z)));
  };
  assert.ok(radiusAt(-.15) < .002, 'ponta não afiada');
  assert.ok(radiusAt(-.065) > .027, 'corpo ausente');
  assert.ok(radiusAt(.078) < radiusAt(.060), 'entalhe da corda ausente');
  assert.ok(radiusAt(.15) > .02, 'cabeça da estaca ausente');
  descartar(model);
});

test('stake wood material is deterministic, textured and visible in the preview', () => {
  const a = buildTentModel(), b = buildTentModel();
  const stake = malhas(a).find((m) => m.name === 'estacas')!;
  const other = malhas(b).find((m) => m.name === 'estacas')!;
  const map = stake.material.map, bump = stake.material.bumpMap;
  assert.ok(map instanceof T.DataTexture && bump instanceof T.DataTexture);
  assert.equal(map.colorSpace, T.SRGBColorSpace);
  assert.equal(bump.colorSpace, T.NoColorSpace);
  assert.equal(map.wrapS, T.RepeatWrapping);
  assert.equal(map.wrapT, T.RepeatWrapping);
  assert.ok(stake.material.bumpScale > 0 && stake.material.roughness > .8);
  assert.deepEqual(map.image.data, (other.material.map as T.DataTexture).image.data);
  assert.deepEqual(bump.image.data, (other.material.bumpMap as T.DataTexture).image.data);
  assert.ok(new Set((map.image.data as Uint8Array).filter((_, i) => i % 4 === 0)).size > 20);
  assert.equal(stake.geometry.getAttribute('uv').count, stake.geometry.getAttribute('position').count);
  assert.equal(malhas(a.clone(true)).find((m) => m.name === 'estacas')!.material, stake.material);
  // Usa uma estaca isolada para que a diferença da textura possa ser medida em detalhe.
  const builder = criarConstrutor(); construirEstaca(builder, 0, 0, 1, .38);
  const detalhe = builder.montar(), material = malhas(detalhe)[0].material;
  const texturizada = renderModelPreview(detalhe, {largura: 400, altura: 400});
  const textura = material.map; material.map = null;
  const semTextura = renderModelPreview(detalhe, {largura: 400, altura: 400});
  material.map = textura;
  assert.ok(contarDiferencas(texturizada, semTextura) > 100, 'prévia sem textura da estaca');
  descartar(a); descartar(b); descartar(detalhe);
});

test('rope receives deterministic seamless color and bump textures', () => {
  const a = buildTentModel(), b = buildTentModel(), clone = a.clone(true);
  const rope = malhas(a).find((m) => m.name === 'cordas')!;
  const otherRope = malhas(b).find((m) => m.name === 'cordas')!;
  assert.ok(rope.material.map instanceof T.DataTexture);
  assert.ok(rope.material.bumpMap instanceof T.DataTexture);
  assert.equal(rope.material.map.colorSpace, T.SRGBColorSpace);
  assert.equal(rope.material.bumpMap.colorSpace, T.NoColorSpace);
  assert.equal(rope.material.map.wrapS, T.RepeatWrapping);
  assert.equal(rope.material.map.wrapT, T.RepeatWrapping);
  assert.ok(rope.material.bumpScale > 0);
  assert.deepEqual(rope.material.map.image.data, (otherRope.material.map as T.DataTexture).image.data);
  assert.deepEqual(rope.material.bumpMap.image.data, (otherRope.material.bumpMap as T.DataTexture).image.data);
  const samples = rope.material.map.image.data as Uint8Array;
  assert.ok(new Set(samples.filter((_, i) => i % 4 === 0)).size > 20, 'textura sem variação');
  const uv = rope.geometry.getAttribute('uv');
  assert.equal(uv.count, rope.geometry.getAttribute('position').count);
  for (const n of uv.array) assert.ok(Number.isFinite(n));
  assert.ok(Math.max(...Array.from(uv.array)) > 2, 'textura não se repete ao longo da corda');
  assert.equal(malhas(clone).find((m) => m.name === 'cordas')!.material, rope.material);
  for (const m of malhas(a).filter((m) => m.name !== 'cordas' && m.name !== 'estacas' && m.name !== 'lona')) assert.equal(m.material.map, null);
  descartar(a); descartar(b);
});

test('rope UVs continue through the sag and close around rings', () => {
  const builder = criarConstrutor();
  builder.viga('cordas', {cor: '#a2906f'}, [0, 0, 0], [0, 2, 0], .014);
  const model = builder.montar(), geo = malhas(model)[0].geometry;
  const pos = geo.getAttribute('position'), uv = geo.getAttribute('uv'), normal = geo.getAttribute('normal');
  let seamVertices = 0;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getY(i) - 1) > 1e-5 || Math.abs(normal.getY(i)) > .5) continue;
    assert.ok(Math.abs(uv.getY(i) - 1 / PASSO_CORDA) < 1e-5, 'textura interrompida no meio da corda');
    assert.ok(Math.abs(Math.hypot(pos.getX(i), pos.getZ(i)) - .014) < 1e-5, 'raio muda no meio da corda');
    seamVertices++;
  }
  assert.ok(seamVertices >= 16);
  descartar(model);

  const ringBuilder = criarConstrutor();
  ringBuilder.anel('cordas', {cor: '#a2906f'}, [0, 0, 0], .085, .012);
  const ring = ringBuilder.montar(), ringUV = malhas(ring)[0].geometry.getAttribute('uv');
  const fim = Math.max(...Array.from({length: ringUV.count}, (_, i) => ringUV.getY(i)));
  assert.ok(fim > 0 && Math.abs(fim - Math.round(fim)) < 1e-6, 'textura não fecha no anel');
  descartar(ring);
});

test('model preview renders the rope texture', () => {
  const model = buildTentModel(), rope = malhas(model).find((m) => m.name === 'cordas')!;
  const textured = renderModelPreview(model, {largura: 640, altura: 460});
  const map = rope.material.map;
  rope.material.map = null;
  const plain = renderModelPreview(model, {largura: 640, altura: 460});
  rope.material.map = map;
  assert.ok(contarDiferencas(textured, plain) > 20, 'textura ausente da prévia');
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

/**
 * Rasterizador ortográfico em CPU: desenha as malhas reais (sem GPU, sem navegador)
 * com z-buffer, luz direcional e sombra de contato. Usado pelas miniaturas da
 * biblioteca e pela pré-visualização de modelos em desenvolvimento.
 */
import * as T from 'three';
import {deflateSync} from 'node:zlib';

const crcTable = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const b of body) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  const result = Buffer.alloc(body.length + 8);
  result.writeUInt32BE(data.length, 0);
  body.copy(result, 4);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, body.length + 4);
  return result;
}

export function codificarPng(rgba: Buffer, largura: number, altura: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(largura, 0);
  header.writeUInt32BE(altura, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) rgba.copy(rows, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

export type Vista = {azimute: number; elevacao: number; distancia?: number};

/** Direção de câmera a partir de ângulos em graus, na mesma distância da vista padrão. */
export function direcaoDeAngulos({azimute, elevacao, distancia = Math.sqrt(138)}: Vista): [number, number, number] {
  const a = azimute * Math.PI / 180, e = elevacao * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e) * distancia, Math.sin(e) * distancia, Math.cos(a) * Math.cos(e) * distancia];
}

export function renderModelPreview(modelo: T.Object3D, opcoes: {direcao?: [number, number, number]; largura?: number; altura?: number; sombra?: boolean} = {}): Buffer {
  const direcao = opcoes.direcao ?? [7, 5, 8];
  const largura = opcoes.largura ?? 280, altura = opcoes.altura ?? 200;
  const comSombra = opcoes.sombra ?? true;
  modelo.updateMatrixWorld(true);
  const centro = new T.Box3().setFromObject(modelo).getCenter(new T.Vector3());
  const camera = new T.OrthographicCamera(-5, 5, 5, -5, .1, 100);
  camera.position.copy(centro).add(new T.Vector3(...direcao));
  camera.lookAt(centro);
  camera.updateMatrixWorld(true);

  const faces: {p: T.Vector3[]; depth: number; color: string}[] = [];
  const luz = new T.Vector3(-.4, 1, .7).normalize();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  modelo.traverse((obj) => {
    if (!(obj instanceof T.Mesh)) return;
    const material = obj.material as T.MeshStandardMaterial;
    const pos = obj.geometry.getAttribute('position');
    const idx = obj.geometry.index;
    const count = idx?.count ?? pos.count;
    for (let i = 0; i < count; i += 3) {
      const p = [0, 1, 2].map((j) => new T.Vector3().fromBufferAttribute(pos, idx ? idx.getX(i + j) : i + j).applyMatrix4(obj.matrixWorld));
      const normal = p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();
      if (normal.dot(camera.position.clone().sub(p[0])) < 0) continue;
      const brilho = .58 + .42 * Math.max(0, normal.dot(luz));
      const cor = material.color.clone().multiplyScalar(brilho);
      if (material.emissiveIntensity > 0) cor.lerp(material.emissive, .3);
      const projetado = p.map((v) => v.applyMatrix4(camera.matrixWorldInverse));
      projetado.forEach((v) => {
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      });
      faces.push({p: projetado, depth: projetado.reduce((a, v) => a + v.z, 0) / 3, color: '#' + cor.getHexString()});
    }
  });

  // enquadramento: 120/82 são margens em "meio-pixel" da miniatura de 280×200
  const escala = Math.min(120 / (maxX - minX), 82 / (maxY - minY));
  const fator = altura / 100;                      // 2 na miniatura padrão (280×200)
  const ox = largura / 2 / fator - (minX + maxX) / 2 * escala;
  const oy = altura * .91 / fator + minY * escala;

  const rgba = Buffer.alloc(largura * altura * 4);
  const depth = new Float64Array(largura * altura).fill(-Infinity);
  if (comSombra) {
    const rx = largura * (80 / 280), ry = altura * .05, sy = altura * .9;
    for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
      if (((x - largura / 2) / rx) ** 2 + ((y - sy) / ry) ** 2 < 1) rgba[(y * largura + x) * 4 + 3] = 28;
    }
  }
  for (const face of faces) {
    const v = face.p.map((p) => ({x: (ox + p.x * escala) * fator, y: (oy - p.y * escala) * fator, z: p.z}));
    const [a, b, c] = v;
    const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(area) < .0001) continue;
    const left = Math.max(0, Math.floor(Math.min(...v.map((p) => p.x)))), right = Math.min(largura - 1, Math.ceil(Math.max(...v.map((p) => p.x))));
    const top = Math.max(0, Math.floor(Math.min(...v.map((p) => p.y)))), bottom = Math.min(altura - 1, Math.ceil(Math.max(...v.map((p) => p.y))));
    const rgb = [1, 3, 5].map((i) => parseInt(face.color.slice(i, i + 2), 16));
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const px = x + .5, py = y + .5;
      const u = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / area;
      const t = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / area;
      const q = 1 - u - t;
      if (u < -.00001 || t < -.00001 || q < -.00001) continue;
      const z = u * a.z + t * b.z + q * c.z, index = y * largura + x;
      if (z < depth[index]) continue;
      depth[index] = z;
      rgba[index * 4] = rgb[0];
      rgba[index * 4 + 1] = rgb[1];
      rgba[index * 4 + 2] = rgb[2];
      rgba[index * 4 + 3] = 255;
    }
  }
  return codificarPng(rgba, largura, altura);
}

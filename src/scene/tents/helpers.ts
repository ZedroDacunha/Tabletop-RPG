import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {ParteTenda as Parte, Acabamento, Ponto} from './types';
import {criarTexturasCorda, PASSO_CORDA} from './ropeTexture';
import {criarTexturasMadeiraEstaca} from './woodTexture';
import {criarTexturasLona} from './canvasTexture';
import {criarTexturasCostura} from './seamTexture';
import {criarTexturasRemendo} from './patchTexture';
import {ajustarUvCumeeira, criarTexturasCumeeira} from './ridgeTexture';

/** Agrupa as geometrias por parte e acabamento para limitar as draw calls. */
export function criarConstrutor() {
  const pecas = new Map<string, {geometrias: T.BufferGeometry[]; acabamento: Acabamento}>();

  const guardar = (parte: Parte, acabamento: Acabamento, geometria: T.BufferGeometry) => {
    const chave = `${parte}|${acabamento.cor}|${acabamento.metal ?? 0}|${acabamento.brilho ?? 0}|${acabamento.fosco ? 1 : 0}|${acabamento.duplaFace ? 1 : 0}|${acabamento.textura ?? ''}`;
    if (!pecas.has(chave)) pecas.set(chave, {geometrias: [], acabamento});
    pecas.get(chave)!.geometrias.push(geometria);
  };

  /**
   * Superfície de lona: grade paramétrica, com normais calculadas a partir das dobras.
   * `paraFora` aponta para o lado de fora da peça; se a malha nascer virada, a ordem dos
   * triângulos é invertida — assim a lona é iluminada por fora em todas as faces.
   */
  const superficie = (parte: Parte, acabamento: Acabamento, uN: number, vN: number, fn: (u: number, v: number) => Ponto, paraFora: Ponto = [0, 1, 0], uvFn?: (u: number, v: number) => [number, number]) => {
    const posicoes: number[] = [], uvs: number[] = [];
    const ponto = (u: number, v: number) => new T.Vector3(...fn(u, v));
    for (let i = 0; i < uN; i++) for (let j = 0; j < vN; j++) {
      const a = ponto(i / uN, j / vN), b = ponto((i + 1) / uN, j / vN), c = ponto((i + 1) / uN, (j + 1) / vN), d = ponto(i / uN, (j + 1) / vN);
      posicoes.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
      if (uvFn) {
        const ua = uvFn(i / uN, j / vN), ub = uvFn((i + 1) / uN, j / vN);
        const uc = uvFn((i + 1) / uN, (j + 1) / vN), ud = uvFn(i / uN, (j + 1) / vN);
        uvs.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(posicoes, 3));
    if (uvFn) g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    g.computeVertexNormals();
    const normais = g.getAttribute('normal');
    const soma = [0, 0, 0];
    for (let i = 0; i < normais.count; i++) { soma[0] += normais.getX(i); soma[1] += normais.getY(i); soma[2] += normais.getZ(i); }
    if (soma[0] * paraFora[0] + soma[1] * paraFora[1] + soma[2] * paraFora[2] < 0) {
      const pos = g.getAttribute('position') as T.BufferAttribute;
      for (let i = 0; i < pos.count; i += 3) {
        const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
        pos.setXYZ(i + 2, bx, by, bz);
        if (uvFn) {
          const uv = g.getAttribute('uv') as T.BufferAttribute;
          const u = uv.getX(i + 1), v = uv.getY(i + 1);
          uv.setXY(i + 1, uv.getX(i + 2), uv.getY(i + 2));
          uv.setXY(i + 2, u, v);
        }
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
    }
    guardar(parte, acabamento, g);
  };

  const caixa = (parte: Parte, acabamento: Acabamento, p: Ponto, s: Ponto, r: Ponto = [0, 0, 0]) => {
    const g = new T.BoxGeometry(...s);
    const m = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(1, 1, 1));
    guardar(parte, acabamento, g.applyMatrix4(m));
  };

  const cilindro = (parte: Parte, acabamento: Acabamento, p: Ponto, topo: number, base: number, altura: number, r: Ponto = [0, 0, 0], lados = 10) => {
    const g = new T.CylinderGeometry(topo, base, altura, lados, 1, false);
    if (acabamento.textura === 'madeira-cumeeira') ajustarUvCumeeira(g);
    const m = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(1, 1, 1));
    guardar(parte, acabamento, g.applyMatrix4(m));
  };

  const anel = (parte: Parte, acabamento: Acabamento, p: Ponto, raio: number, tubo: number, r: Ponto = [Math.PI / 2, 0, 0]) => {
    const g = new T.TorusGeometry(raio, tubo, 5, 12);
    if (parte === 'cordas') {
      const uv = g.getAttribute('uv');
      // Número inteiro de voltas garante continuidade ao fechar o anel.
      const voltas = Math.max(1, Math.round(2 * Math.PI * raio / PASSO_CORDA));
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * voltas);
    }
    const m = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(1, 1, 1));
    guardar(parte, acabamento, g.applyMatrix4(m));
  };

  /** Viga entre dois pontos, com leve barriga quando é corda. */
  const viga = (parte: Parte, acabamento: Acabamento, a: Ponto, b: Ponto, raio: number, barriga = 0) => {
    const inicio = new T.Vector3(...a), fim = new T.Vector3(...b);
    const meio = inicio.clone().add(fim).multiplyScalar(.5);
    meio.y -= barriga;
    const trecho = (pa: T.Vector3, pb: T.Vector3, r: number, inicioUV: number) => {
      const comprimento = pa.distanceTo(pb);
      // Os dois trechos da corda precisam ter o mesmo raio na junção.
      const g = new T.CylinderGeometry(parte === 'cordas' ? r : r * .85, r, comprimento, 7, 1, false);
      if (parte === 'cordas') {
        const uv = g.getAttribute('uv');
        for (let i = 0; i < uv.count; i++) uv.setY(i, inicioUV + uv.getY(i) * comprimento / PASSO_CORDA);
      }
      const m = new T.Matrix4().compose(pa.clone().add(pb).multiplyScalar(.5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), pb.clone().sub(pa).normalize()), new T.Vector3(1, 1, 1));
      guardar(parte, acabamento, g.applyMatrix4(m));
    };
    trecho(inicio, meio, raio, 0);
    trecho(meio, fim, raio, inicio.distanceTo(meio) / PASSO_CORDA);
  };

  const montar = (): T.Group => {
    // ---------- Fim: funde por parte + acabamento ----------
    const modelo = new T.Group();
    modelo.name = 'tent';
    pecas.forEach(({geometrias, acabamento}, chave) => {
      const fundida = mergeGeometries(geometrias, false);
      if (!fundida) throw new Error(`Falha ao montar a tenda (${chave})`);
      fundida.computeBoundingBox();
      fundida.computeBoundingSphere();
      const material = new T.MeshStandardMaterial({
        color: acabamento.cor,
        roughness: acabamento.metal ? .45 : (acabamento.brilho ?? .92),
        metalness: acabamento.metal ?? 0,
        flatShading: acabamento.fosco ?? false,
        side: acabamento.duplaFace ? T.DoubleSide : T.FrontSide,
        ...(chave.startsWith('cordas|') ? {...criarTexturasCorda(), bumpScale: .0015} : {}),
        ...(chave.startsWith('estacas|') ? {...criarTexturasMadeiraEstaca(), bumpScale: .0015} : {}),
        ...(acabamento.textura === 'trama' ? {...criarTexturasLona(), bumpScale: .0007} : {}),
        ...(acabamento.textura === 'costura' ? {...criarTexturasCostura(), bumpScale: .0005} : {}),
        ...(acabamento.textura === 'remendo' ? {...criarTexturasRemendo(), bumpScale: .0007} : {}),
        ...(acabamento.textura === 'madeira-cumeeira' ? {...criarTexturasCumeeira(), bumpScale: .001} : {}),
      });
      const malha = new T.Mesh(fundida, material);
      malha.name = chave.split('|')[0];
      malha.castShadow = true;
      malha.receiveShadow = true;
      modelo.add(malha);
      geometrias.forEach((g) => g.dispose());
    });
    return modelo;
  };
  return {guardar, superficie, caixa, cilindro, anel, viga, montar};
}

export type ConstrutorTenda = ReturnType<typeof criarConstrutor>;

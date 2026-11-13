import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Tenda de expedição montada por partes: lona (águas, paredes, oitões e portinhola),
 * estrutura de madeira (cumeeira, pernas, prumos), cordas, estacas e interior.
 * Cada parte é registrada separadamente e só é fundida por (parte, acabamento) no fim,
 * para manter o custo de desenho baixo sem perder a leitura do modelo.
 */
type Parte = 'lona' | 'estrutura' | 'cordas' | 'estacas' | 'interior';
type Acabamento = {cor: string; metal?: number; brilho?: number; fosco?: boolean; duplaFace?: boolean};

const HALF_W = 1.24;   // meia largura na base
const HALF_D = 1.6;    // metade do comprimento
const RIDGE = 2.18;    // altura da cumeeira
const EAVE = 0.62;     // altura do beiral (encontro lona/parede)
const DOOR_W = 0.52;   // meia largura da portinhola

const lonaClara = '#cdba8c';
const lonaSombra = '#c1ad80';
const lonaCostura = '#9c895f';
const lonaRemendo = '#d8c79b';
const madeira = '#7b5a3b';
const madeiraEscura = '#65482e';
const corda = '#a2906f';
const interiorEscuro = '#332f26';
const lonaChao = '#8b7c5c';
const lonaRolo = '#b3a075';

type Ponto = [number, number, number];

export function buildTentModel(): T.Group {
  const pecas = new Map<string, {geometrias: T.BufferGeometry[]; acabamento: Acabamento}>();

  const guardar = (parte: Parte, acabamento: Acabamento, geometria: T.BufferGeometry) => {
    const chave = `${parte}|${acabamento.cor}|${acabamento.metal ?? 0}|${acabamento.brilho ?? 0}|${acabamento.fosco ? 1 : 0}`;
    if (!pecas.has(chave)) pecas.set(chave, {geometrias: [], acabamento});
    pecas.get(chave)!.geometrias.push(geometria);
  };

  /**
   * Superfície de lona: grade paramétrica, com normais calculadas a partir das dobras.
   * `paraFora` aponta para o lado de fora da peça; se a malha nascer virada, a ordem dos
   * triângulos é invertida — assim a lona é iluminada por fora em todas as faces.
   */
  const superficie = (parte: Parte, acabamento: Acabamento, uN: number, vN: number, fn: (u: number, v: number) => Ponto, paraFora: Ponto = [0, 1, 0]) => {
    const posicoes: number[] = [];
    const ponto = (u: number, v: number) => new T.Vector3(...fn(u, v));
    for (let i = 0; i < uN; i++) for (let j = 0; j < vN; j++) {
      const a = ponto(i / uN, j / vN), b = ponto((i + 1) / uN, j / vN), c = ponto((i + 1) / uN, (j + 1) / vN), d = ponto(i / uN, (j + 1) / vN);
      posicoes.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(posicoes, 3));
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
    const m = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(1, 1, 1));
    guardar(parte, acabamento, g.applyMatrix4(m));
  };

  const anel = (parte: Parte, acabamento: Acabamento, p: Ponto, raio: number, tubo: number, r: Ponto = [Math.PI / 2, 0, 0]) => {
    const g = new T.TorusGeometry(raio, tubo, 5, 12);
    const m = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(1, 1, 1));
    guardar(parte, acabamento, g.applyMatrix4(m));
  };

  /** Viga entre dois pontos, com leve barriga quando é corda. */
  const viga = (parte: Parte, acabamento: Acabamento, a: Ponto, b: Ponto, raio: number, barriga = 0) => {
    const inicio = new T.Vector3(...a), fim = new T.Vector3(...b);
    const meio = inicio.clone().add(fim).multiplyScalar(.5);
    meio.y -= barriga;
    const trecho = (pa: T.Vector3, pb: T.Vector3, r: number) => {
      const g = new T.CylinderGeometry(r * .85, r, pa.distanceTo(pb), 7, 1, false);
      const m = new T.Matrix4().compose(pa.clone().add(pb).multiplyScalar(.5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), pb.clone().sub(pa).normalize()), new T.Vector3(1, 1, 1));
      guardar(parte, acabamento, g.applyMatrix4(m));
    };
    trecho(inicio, meio, raio);
    trecho(meio, fim, raio);
  };

  // ---------- Lona: duas águas, quatro faixas costuradas por lado ----------
  const alturaBeiral = (x: number) => EAVE + (1 - Math.abs(x) / HALF_W) * (RIDGE - EAVE);
  for (const lado of [-1, 1]) {
    const faixas = 4;
    for (let faixa = 0; faixa < faixas; faixa++) {
      const acabamento: Acabamento = {cor: faixa % 2 ? lonaClara : lonaSombra, duplaFace: true};
      superficie('lona', acabamento, 6, 6, (u, v) => {
        const aoLongo = (faixa + u) / faixas;
        // a lona sobra 3 cm em cada ponta: cobre o encontro com os oitões
        const z = (aoLongo - .5) * (HALF_D * 2 + .06);
        // o beiral passa 8 cm por fora da parede e termina abaixo do topo dela:
        // assim a lona cobre o encontro em vez de encostar de topo (fresta de 1 px).
        let x = lado * v * (HALF_W + .08);
        let y = RIDGE + v * (EAVE - .12 - RIDGE);
        // a lona cede entre os apoios e ganha dobras verticais
        y -= Math.sin(Math.PI * aoLongo) * .05 * (1 - v * .4);
        y += Math.sin(Math.PI * 2 * u) * .007 * (1 - v);
        // ondulação contínua ao longo do comprimento, nula no beiral: se ela
        // depender da faixa, as emendas entre panos ficam desencontradas, e se
        // chegar até a borda, o beiral ondulado deixa passar raio rasante de 1 px.
        x += lado * Math.sin(aoLongo * Math.PI * 8) * .011 * Math.sin(Math.PI * v);
        return [x, y, z];
      }, [lado, .9, 0]);
      // costura entre as faixas
      if (faixa > 0) {
        const limite = faixa / faixas;
        superficie('lona', {cor: lonaCostura, duplaFace: true}, 1, 6, (u, v) => {
          const aoLongo = limite + (u - .5) * .012;
          return [lado * (v * (HALF_W + .08) + .012), RIDGE + v * (EAVE - .12 - RIDGE) + .012, (aoLongo - .5) * (HALF_D * 2 + .06)];
        }, [lado, .9, 0]);
      }
    }
  }

  // costura da cumeeira, acompanhando a barriga da lona
  superficie('lona', {cor: lonaCostura, duplaFace: true}, 8, 1, (u, v) => {
    const z = (u - .5) * HALF_D * 2;
    return [(v - .5) * .07, RIDGE + .012 - Math.sin(Math.PI * u) * .05, z];
  }, [0, 1, 0]);

  // ---------- Lona: paredes laterais, com saia no chão ----------
  for (const lado of [-1, 1]) {
    superficie('lona', {cor: lonaSombra, duplaFace: true}, 10, 4, (u, v) => {
      // 3 cm de sobra em cada ponta: a parede cobre a quina com os oitões
      const z = (u - .5) * (HALF_D * 2 + .06);
      const x = lado * (HALF_W + v * .05) + lado * Math.sin(Math.PI * u * 5) * .014 * v;
      const y = EAVE * (1 - v);
      return [x, y, z];
    }, [lado, .15, 0]);
    // barra de reforço na base
    superficie('lona', {cor: lonaCostura, duplaFace: true}, 10, 1, (u, v) => [
      lado * (HALF_W + .02), .05 + v * .07, (u - .5) * HALF_D * 2,
    ], [lado, 0, 0]);
  }

  // ---------- Lona: oitão dos fundos ----------
  // a lona sobra 6 cm além de cada parede lateral: sem isso a quina vira uma fresta
  // de 1 px no rasterizador e deixa ver o piso de dentro.
  const SOBRA_QUINA = .06;
  superficie('lona', {cor: lonaClara, duplaFace: true}, 8, 3, (u, v) => {
    const x = (u - .5) * 2 * (HALF_W + SOBRA_QUINA);
    return [x, v * EAVE, -HALF_D - Math.sin(Math.PI * u) * .03];
  }, [0, .2, -1]);
  superficie('lona', {cor: lonaSombra, duplaFace: true}, 8, 4, (u, v) => {
    const x = (u - .5) * 2 * HALF_W * (1 - v);
    // começa 8 cm abaixo do beiral para cobrir o encontro com a parede do oitão
    const y = EAVE - .08 + v * (RIDGE - EAVE + .08) - Math.sin(Math.PI * u) * .02 * v;
    return [x, y, -HALF_D - Math.sin(Math.PI * u) * .025];
  }, [0, .6, -1]);
  // ---------- Lona: frente com portinhola ----------
  for (const lado of [-1, 1]) {
    // parede ao lado da portinhola
    superficie('lona', {cor: lonaSombra, duplaFace: true}, 4, 3, (u, v) => {
      const x = lado * (DOOR_W + u * (HALF_W - DOOR_W));
      return [x, v * EAVE, HALF_D + Math.sin(Math.PI * u) * .015];
    }, [0, .2, 1]);
    // oitão da frente, do beiral até a encosta da cumeeira
    superficie('lona', {cor: lonaClara, duplaFace: true}, 4, 4, (u, v) => {
      const x = lado * (DOOR_W + u * (HALF_W - DOOR_W));
      const topo = alturaBeiral(x);
      return [x, EAVE - .08 + v * (topo - EAVE + .08), HALF_D + Math.sin(Math.PI * u) * .02];
    }, [0, .6, 1]);
  }
  // faixa triangular acima da portinhola
  superficie('lona', {cor: lonaClara, duplaFace: true}, 4, 4, (u, v) => {
    const x = (u - .5) * 2 * DOOR_W * (1 - v);
    return [x, alturaBeiral(DOOR_W) + v * (RIDGE - alturaBeiral(DOOR_W)), HALF_D + .015];
  }, [0, .8, 1]);

  // porta enrolada à direita e aba caída à esquerda
  cilindro('lona', {cor: lonaRolo, duplaFace: true}, [DOOR_W + .06, .8, HALF_D + .01], .075, .055, 1.5, [0, 0, .04], 10);
  anel('cordas', {cor: corda}, [DOOR_W + .06, 1.15, HALF_D + .01], .085, .012, [0, 0, Math.PI / 2]);
  anel('cordas', {cor: corda}, [DOOR_W + .06, .45, HALF_D + .01], .085, .012, [0, 0, Math.PI / 2]);
  superficie('lona', {cor: lonaSombra, duplaFace: true}, 4, 5, (u, v) => {
    const x = -DOOR_W + u * .42;
    const y = 1.5 - v * 1.48;
    return [x + Math.sin(Math.PI * u) * .03, Math.max(.03, y), HALF_D + .05 - v * .06 + Math.sin(Math.PI * u) * .02];
  }, [-.2, 0, 1]);

  // remendos costurados, só textura de leitura
  for (const [x, y, z, w, h] of [[-.78, 1.24, HALF_D - .12, .3, .22], [.82, .44, HALF_D - .05, .26, .19], [-.9, .3, -HALF_D + .06, .24, .2]]) {
    superficie('lona', {cor: lonaRemendo, duplaFace: true}, 2, 2, (u, v) => [x + (u - .5) * w, y + (v - .5) * h, z], [0, 0, Math.sign(z)]);
  }

  // ---------- Estrutura de madeira ----------
  cilindro('estrutura', {cor: madeira, fosco: true}, [0, RIDGE, 0], .048, .055, HALF_D * 2 + .34, [Math.PI / 2, 0, 0], 9);
  for (const z of [-HALF_D + .06, HALF_D - .06]) {
    for (const lado of [-1, 1]) {
      viga('estrutura', {cor: madeira, fosco: true}, [0, RIDGE - .03, z], [lado * (HALF_W - .02), .01, z], .042);
      // prumo de parede
      cilindro('estrutura', {cor: madeiraEscura, fosco: true}, [lado * (HALF_W - .03), EAVE / 2, z], .028, .032, EAVE, [0, 0, 0], 7);
    }
    // sapatas e amarração no pé das pernas
    for (const lado of [-1, 1]) caixa('estrutura', {cor: madeiraEscura, fosco: true}, [lado * (HALF_W - .02), .03, z], [.14, .06, .2], [0, 0, lado * .12]);
  }
  // ponteiras da cumeeira
  for (const z of [-HALF_D - .15, HALF_D + .15]) anel('estrutura', {cor: madeiraEscura, fosco: true}, [0, RIDGE, z], .055, .016, [0, 0, 0]);

  // ---------- Cordas e estacas ----------
  const estacas: Ponto[] = [];
  for (const z of [-1, 1]) {
    for (const lado of [-1, 1]) {
      const topo: Ponto = [0, RIDGE, z * (HALF_D + .12)];
      const pe: Ponto = [lado * 1.62, .045, z * (HALF_D + .78)];
      viga('cordas', {cor: corda}, topo, pe, .014, .05);
      anel('cordas', {cor: corda}, topo, .045, .01);
      estacas.push([lado * 1.62, 0, z * (HALF_D + .78)]);
    }
  }
  for (const [x, y, z] of estacas) {
    // estaca inclinada para fora, com entalhe
    cilindro('estacas', {cor: madeiraEscura, fosco: true}, [x, .1, z], .022, .03, .3, [0, 0, -Math.sign(x) * .38], 6);
    caixa('estacas', {cor: corda}, [x + Math.sign(x) * .02, .2, z], [.05, .03, .05], [0, 0, -Math.sign(x) * .38]);
  }

  // ---------- Interior ----------
  superficie('interior', {cor: interiorEscuro}, 4, 4, (u, v) => [(u - .5) * 1.1, v * 1.35, .15], [0, 0, 1]);
  superficie('interior', {cor: lonaChao}, 5, 4, (u, v) => [(u - .5) * 1.9, .012, (v - .5) * 2.6], [0, 1, 0]);
  // saco de dormir enrolado e mochila, visíveis pela portinhola
  cilindro('interior', {cor: lonaRolo}, [-.42, .13, .9], .13, .13, .78, [0, 0, Math.PI / 2], 10);
  anel('cordas', {cor: corda}, [-.42, .13, .9], .135, .012, [0, Math.PI / 2, 0]);
  caixa('interior', {cor: '#6d5a3e'}, [.38, .22, .92], [.38, .42, .3], [0, .2, 0]);
  anel('cordas', {cor: corda}, [.38, .34, .92], .2, .012, [Math.PI / 2, 0, 0]);

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
    });
    const malha = new T.Mesh(fundida, material);
    malha.name = chave.split('|')[0];
    malha.castShadow = true;
    malha.receiveShadow = true;
    modelo.add(malha);
    geometrias.forEach((g) => g.dispose());
  });
  return modelo;
}

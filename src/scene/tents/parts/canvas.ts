import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, lonaClara, lonaSombra, lonaCostura, lonaRemendo} from '../types';
import type {Acabamento, Ponto} from '../types';

const FAIXAS = 4, SEGMENTOS_COMPRIMENTO = 6, SEGMENTOS_AGUA = 6;
const FOLGA_DETALHE = .006;

/** Mesmo tecido usado para a água, incluindo as dobras entre faixas. */
function pontoAgua(lado: number, aoLongo: number, v: number): Ponto {
  const u = aoLongo * FAIXAS - Math.floor(aoLongo * FAIXAS);
  const z = (aoLongo - .5) * (HALF_D * 2 + .06);
  const x = lado * (v * (HALF_W + .08) + Math.sin(aoLongo * Math.PI * 8) * .011 * Math.sin(Math.PI * v));
  const y = RIDGE + v * (EAVE - .12 - RIDGE) - Math.sin(Math.PI * aoLongo) * .05 * (1 - v * .4)
    + Math.sin(Math.PI * 2 * u) * .007 * (1 - v);
  return [x, y, z];
}

/** Interpola sobre os triângulos reais, não sobre uma curva entre vértices. */
export function amostrarAgua(lado: number, aoLongo: number, v: number): Ponto {
  const nu = FAIXAS * SEGMENTOS_COMPRIMENTO, nv = SEGMENTOS_AGUA;
  const i = Math.min(Math.floor(aoLongo * nu), nu - 1), j = Math.min(Math.floor(v * nv), nv - 1);
  const fu = aoLongo * nu - i, fv = v * nv - j;
  const a = pontoAgua(lado, i / nu, j / nv), b = pontoAgua(lado, (i + 1) / nu, j / nv);
  const c = pontoAgua(lado, (i + 1) / nu, (j + 1) / nv), d = pontoAgua(lado, i / nu, (j + 1) / nv);
  return a.map((_, k) => fu >= fv
    ? a[k] * (1 - fu) + b[k] * (fu - fv) + c[k] * fv
    : a[k] * (1 - fv) + c[k] * fu + d[k] * (fv - fu)) as Ponto;
}

/** Afastamento mínimo na normal evita z-fighting sem deixar o detalhe suspenso. */
function detalheAgua(lado: number, aoLongo: number, v: number): Ponto {
  const [x, y, z] = amostrarAgua(lado, aoLongo, v);
  return [x + lado * FOLGA_DETALHE * .786, y + FOLGA_DETALHE * .618, z];
}

/** Lona externa, exceto a entrada. */
export function construirLona({superficie}: ConstrutorTenda) {
  // ---------- Lona: duas águas, quatro faixas costuradas por lado ----------
  for (const lado of [-1, 1]) {
    for (let faixa = 0; faixa < FAIXAS; faixa++) {
      const acabamento: Acabamento = {cor: faixa % 2 ? lonaClara : lonaSombra, duplaFace: true};
      superficie('lona', acabamento, SEGMENTOS_COMPRIMENTO, SEGMENTOS_AGUA,
        (u, v) => pontoAgua(lado, (faixa + u) / FAIXAS, v), [lado, .9, 0]);

      if (faixa > 0) {
        // Duas metades permitem acompanhar a triangulação de cada faixa vizinha.
        for (const sentido of [-1, 1]) superficie('lona', {cor: lonaCostura, duplaFace: true}, 1, SEGMENTOS_AGUA,
          (u, v) => detalheAgua(lado, faixa / FAIXAS + sentido * u * .004, v), [lado, .9, 0]);
      }
    }
    // A costura da cumeeira acompanha cada água em vez de formar uma placa plana.
    superficie('lona', {cor: lonaCostura, duplaFace: true}, FAIXAS * SEGMENTOS_COMPRIMENTO, 1,
      (u, v) => detalheAgua(lado, u, v * .025), [lado, 1, 0]);

    // Remendo na água: os limites coincidem com a grade da lona, evitando
    // cruzar triângulos que possuem inclinações diferentes.
    if (lado === -1) superficie('lona', {cor: lonaRemendo, duplaFace: true}, 2, 1,
      (u, v) => detalheAgua(lado, (19 + 2 * u) / 24, (3 + v) / 6), [lado, .9, 0]);
  }

  // ---------- Lona: paredes laterais, com saia no chão ----------
  for (const lado of [-1, 1]) {
    superficie('lona', {cor: lonaSombra, duplaFace: true}, 10, 4, (u, v) => {
      // 3 cm de sobra em cada ponta: a parede cobre a quina com os oitões
      const z = (u - .5) * (HALF_D * 2 + .06);
      const x = lado * (HALF_W + v * .05) + lado * Math.sin(Math.PI * u * 5) * .014 * v;
      const y = EAVE * (1 - v);
      return [x, y, z];
    }, [lado, .15, 0]);
    // Faixa fixada à mesma parede inclinada, com a ondulação correspondente.
    // A posição é interpolada na grade da parede, para não atravessá-la.
    superficie('lona', {cor: lonaCostura, duplaFace: true}, 10, 1, (u, v) => {
      const altura = .05 + v * .07;
      const t = 1 - altura / EAVE;
      const x = lado * (HALF_W + t * .05 + Math.sin(Math.PI * u * 5) * .014 * t + FOLGA_DETALHE);
      return [x, altura, (u - .5) * (HALF_D * 2 + .06)];
    }, [lado, 0, 0]);
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
}

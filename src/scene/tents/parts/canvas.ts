import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, lonaClara, lonaSombra, lonaCostura, lonaRemendo} from '../types';
import type {Acabamento, Ponto} from '../types';
import {uvTelhado, uvParedeLateral, uvParedeExtremidade} from '../canvasTexture';
import {PASSO_PONTO} from '../seamTexture';

const FAIXAS = 4, SEGMENTOS_COMPRIMENTO = 6, SEGMENTOS_AGUA = 6;
const FOLGA_DETALHE = .006;

/** Mesmo tecido usado para a água, incluindo as dobras entre faixas. */
function pontoAgua(lado: number, aoLongo: number, v: number): Ponto {
  const u = aoLongo * FAIXAS - Math.floor(aoLongo * FAIXAS);
  const z = (aoLongo - .5) * (HALF_D * 2);
  const x = lado * (v * HALF_W + Math.sin(aoLongo * Math.PI * 8) * .011 * Math.sin(Math.PI * v));
  const y = RIDGE + v * (EAVE - RIDGE) - Math.sin(Math.PI * aoLongo) * .05 * (1 - v * .4)
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
      const acabamento: Acabamento = {cor: faixa % 2 ? lonaClara : lonaSombra, duplaFace: true, textura: 'trama'};
      superficie('lona', acabamento, SEGMENTOS_COMPRIMENTO, SEGMENTOS_AGUA,
        (u, v) => pontoAgua(lado, (faixa + u) / FAIXAS, v), [lado, .9, 0],
        (u, v) => uvTelhado((faixa + u) / FAIXAS, v));

      if (faixa > 0) {
        // Duas metades permitem acompanhar a triangulação de cada faixa vizinha.
        for (const sentido of [-1, 1]) superficie('lona', {cor: lonaCostura, duplaFace: true, textura: 'costura'}, 1, SEGMENTOS_AGUA,
          (u, v) => detalheAgua(lado, faixa / FAIXAS + sentido * u * .004, v), [lado, .9, 0],
          (u, v) => [.5 + sentido * u * .5, v * Math.hypot(HALF_W, RIDGE - EAVE) / PASSO_PONTO]);
      }
    }
    // A costura da cumeeira acompanha cada água em vez de formar uma placa plana.
    superficie('lona', {cor: lonaCostura, duplaFace: true, textura: 'costura'}, FAIXAS * SEGMENTOS_COMPRIMENTO, 1,
      (u, v) => detalheAgua(lado, u, v * .025), [lado, 1, 0],
      (u, v) => [v, u * 2 * HALF_D / PASSO_PONTO]);

    // Remendo na água: os limites coincidem com a grade da lona, evitando
    // cruzar triângulos que possuem inclinações diferentes.
    if (lado === -1) superficie('lona', {cor: lonaRemendo, duplaFace: true, textura: 'trama'}, 2, 1,
      (u, v) => detalheAgua(lado, (19 + 2 * u) / 24, (3 + v) / 6), [lado, .9, 0],
      (u, v) => uvTelhado((19 + 2 * u) / 24, (3 + v) / 6));
  }

  // ---------- Lona: paredes laterais, com saia no chão ----------
  for (const lado of [-1, 1]) {
    const segmentos = FAIXAS * SEGMENTOS_COMPRIMENTO;
    const alturaBeiral = (u: number) => amostrarAgua(lado, u, 1)[1];
    const pontoParede = (u: number, v: number): Ponto => {
      // Cada vértice superior coincide com o beiral, inclusive onde a lona cede.
      const z = (u - .5) * (HALF_D * 2);
      const x = lado * (HALF_W + Math.sin(Math.PI * u * 5) * .014 * v);
      return [x, alturaBeiral(u) * (1 - v), z];
    };
    superficie('lona', {cor: lonaSombra, duplaFace: true, textura: 'trama'}, segmentos, 4, pontoParede, [lado, .15, 0],
      (u, v) => { const [, y, z] = pontoParede(u, v); return uvParedeLateral(z, y); });
    // Faixa junto à parede, sem prolongar a barra além das quinas; pontos acompanham o comprimento.
    superficie('lona', {cor: lonaCostura, duplaFace: true, textura: 'costura'}, segmentos, 1, (u, v) => {
      const altura = .05 + v * .07;
      const t = 1 - altura / alturaBeiral(u);
      const x = lado * (HALF_W + Math.sin(Math.PI * u * 5) * .014 * t + FOLGA_DETALHE);
      return [x, altura, (u - .5) * (HALF_D * 2)];
    }, [lado, 0, 0], (u, v) => [v, u * 2 * HALF_D / PASSO_PONTO]);
  }

  // ---------- Lona: oitão dos fundos ----------
  // Os oitões compartilham as mesmas bordas das paredes e do telhado:
  // sem sobras retangulares nas quinas e sem sobreposição coplanar.
  superficie('lona', {cor: lonaClara, duplaFace: true, textura: 'trama'}, 8, 3, (u, v) => [
    (u - .5) * 2 * HALF_W, v * EAVE, -HALF_D,
  ], [0, 0, -1], (u, v) => uvParedeExtremidade((u - .5) * 2 * HALF_W, v * EAVE));
  superficie('lona', {cor: lonaSombra, duplaFace: true, textura: 'trama'}, 8, 4, (u, v) => [
    (u - .5) * 2 * HALF_W * (1 - v), EAVE + v * (RIDGE - EAVE), -HALF_D,
  ], [0, 0, -1], (u, v) => uvParedeExtremidade((u - .5) * 2 * HALF_W * (1 - v), EAVE + v * (RIDGE - EAVE)));
}

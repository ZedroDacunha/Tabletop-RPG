import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, lonaClara, lonaSombra, lonaCostura, lonaRemendo} from '../types';
import type {Acabamento} from '../types';

/** Lona externa, exceto a entrada. */
export function construirLona({superficie}: ConstrutorTenda) {
  // ---------- Lona: duas águas, quatro faixas costuradas por lado ----------
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
  // remendos costurados, só textura de leitura
  for (const [x, y, z, w, h] of [[-.78, 1.24, HALF_D - .12, .3, .22], [.82, .44, HALF_D - .05, .26, .19], [-.9, .3, -HALF_D + .06, .24, .2]]) {
    superficie('lona', {cor: lonaRemendo, duplaFace: true}, 2, 2, (u, v) => [x + (u - .5) * w, y + (v - .5) * h, z], [0, 0, Math.sign(z)]);
  }

}

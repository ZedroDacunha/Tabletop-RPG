import type {ConstrutorTenda} from '../helpers';
import {HALF_D, RIDGE, madeiraEscura, corda} from '../types';
import type {Ponto} from '../types';

/** Tirantes e estacas da tenda. */
export function construirCordasEEstacas({viga, anel, cilindro, caixa}: ConstrutorTenda) {
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

}

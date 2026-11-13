import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, madeira, madeiraEscura} from '../types';

/** Armação; na frente os caibros terminam no beiral, sem cruzar a porta. */
export function construirEstrutura({cilindro, viga, caixa, anel}: ConstrutorTenda) {
  // ---------- Estrutura de madeira ----------
  cilindro('estrutura', {cor: madeira, fosco: true}, [0, RIDGE, 0], .048, .055, HALF_D * 2 + .34, [Math.PI / 2, 0, 0], 9);
  for (const z of [-HALF_D + .06, HALF_D - .06]) {
    for (const lado of [-1, 1]) {
      // Os caibros ficam por dentro da lona: o raio da madeira não atravessa a água.
      viga('estrutura', {cor: madeira, fosco: true}, [0, RIDGE - .14, z], [lado * (HALF_W - .02), z > 0 ? .48 : .01, z], .042);
      // prumo de parede
      cilindro('estrutura', {cor: madeiraEscura, fosco: true}, [lado * (HALF_W - .03), EAVE / 2, z], .028, .032, EAVE, [0, 0, 0], 7);
    }
    // sapatas e amarração no pé das pernas
    for (const lado of [-1, 1]) caixa('estrutura', {cor: madeiraEscura, fosco: true}, [lado * (HALF_W - .02), .03, z], [.14, .06, .2], [0, 0, lado * .12]);
  }
  // ponteiras da cumeeira
  for (const z of [-HALF_D - .15, HALF_D + .15]) anel('estrutura', {cor: madeiraEscura, fosco: true}, [0, RIDGE, z], .055, .016, [0, 0, 0]);

}

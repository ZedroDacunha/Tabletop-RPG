import type {ConstrutorTenda} from '../helpers';
import {corda, lonaChao, lonaRolo} from '../types';

/** Piso e acessórios guardados dentro da tenda. */
export function construirInterior({superficie, cilindro, anel, caixa}: ConstrutorTenda) {
  // ---------- Interior ----------
  superficie('interior', {cor: lonaChao}, 5, 4, (u, v) => [(u - .5) * 1.9, .012, (v - .5) * 2.6], [0, 1, 0]);
  // saco de dormir enrolado e mochila, visíveis pela portinhola
  cilindro('interior', {cor: lonaRolo}, [-.42, .13, .9], .13, .13, .78, [0, 0, Math.PI / 2], 10);
  anel('cordas', {cor: corda}, [-.42, .13, .9], .135, .012, [0, Math.PI / 2, 0]);
  caixa('interior', {cor: '#6d5a3e'}, [.38, .22, .92], [.38, .42, .3], [0, .2, 0]);
  anel('cordas', {cor: corda}, [.38, .34, .92], .2, .012, [Math.PI / 2, 0, 0]);

}

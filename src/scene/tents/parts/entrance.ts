import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, DOOR_W, DOOR_H, lonaClara, lonaSombra, lonaCostura, corda} from '../types';

/** Frente da tenda: abertura central de altura útil, com abas presas nas laterais. */
export function construirEntrada({superficie, anel}: ConstrutorTenda) {
  // O perfil acompanha a água do telhado e se sobrepõe a ela para evitar frestas.
  const topo = (x: number) => RIDGE + Math.abs(x) / (HALF_W + .08) * (EAVE - .12 - RIDGE) + .025;
  const frente = HALF_D;

  for (const lado of [-1, 1]) {
    // As laterais ocupam somente o espaço entre a abertura e as paredes.
    superficie('lona', {cor: lonaSombra, duplaFace: true}, 8, 8, (u, v) => {
      const x = lado * (DOOR_W + u * (HALF_W + .03 - DOOR_W));
      return [x, v * topo(x), frente + .005 + Math.sin(Math.PI * u) * .012];
    }, [0, 0, 1]);

    // Bordas reforçadas definem claramente os limites da abertura.
    superficie('lona', {cor: lonaCostura, duplaFace: true}, 1, 6, (u, v) => [
      lado * (DOOR_W + u * .035), v * DOOR_H, frente + .025,
    ], [0, 0, 1]);

    // A lona da porta é recolhida para fora da passagem e amarrada no meio.
    superficie('lona', {cor: lonaClara, duplaFace: true}, 4, 8, (u, v) => {
      const largura = .10 + .20 * Math.abs(2 * v - 1);
      const x = lado * (DOOR_W + .04 + u * largura);
      // A borda superior das abas não pode ultrapassar a inclinação do telhado.
      const y = .04 + v * (Math.min(DOOR_H, topo(x) - .025) - .04);
      const z = frente + .045 + .022 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      return [x, y, z];
    }, [0, 0, 1]);
    // Uma volta de corda em torno da aba recolhida.
    anel('cordas', {cor: corda}, [lado * (DOOR_W + .09), .78, frente + .04], .075, .009, [Math.PI / 2, 0, 0]);
  }

  // Painel central acima da passagem, preenchendo até o perfil triangular do teto.
  // A parte inferior é horizontal: não há um buraco entre o teto e a porta.
  superficie('lona', {cor: lonaClara, duplaFace: true}, 8, 5, (u, v) => {
    const x = (u * 2 - 1) * DOOR_W;
    return [x, DOOR_H + v * (topo(x) - DOOR_H), frente + .005];
  }, [0, 0, 1]);
  superficie('lona', {cor: lonaCostura, duplaFace: true}, 8, 1, (u, v) => [
    (u * 2 - 1) * DOOR_W, DOOR_H + v * .035, frente + .025,
  ], [0, 0, 1]);
}

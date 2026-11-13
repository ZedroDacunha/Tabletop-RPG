import type {ConstrutorTenda} from '../helpers';
import {HALF_D, RIDGE, madeiraEscura, corda} from '../types';
import type {Ponto} from '../types';

const ANGULO_ESTACA = .38;
const RAIO_TIRANTE = .011;
const RAIO_VOLTA = .01;

/** Tirantes amarrados na cumeeira e nas estacas inclinadas. */
export function construirCordasEEstacas({viga, anel, cilindro}: ConstrutorTenda) {
  for (const extremidade of [-1, 1]) for (const lado of [-1, 1]) {
    const zEstaca = extremidade * (HALF_D + .78);
    const xEstaca = lado * 1.62;
    const seno = Math.sin(ANGULO_ESTACA), cosseno = Math.cos(ANGULO_ESTACA);
    // A estaca é inclinada para fora; o eixo das voltas acompanha a inclinação.
    const eixoEstaca = (distancia: number): Ponto => [
      xEstaca + lado * seno * distancia, .1 + cosseno * distancia, zEstaca,
    ];
    cilindro('estacas', {cor: madeiraEscura, fosco: true}, [xEstaca, .1, zEstaca],
      .022, .03, .3, [0, 0, -lado * ANGULO_ESTACA], 6);

    // Duas voltas ao redor da madeira, lado a lado. A última toca o tirante.
    // Em Euler XYZ, a inclinação é no eixo Y antes de deitar o anel.
    const rotacaoEstaca: Ponto = [Math.PI / 2, -lado * ANGULO_ESTACA, 0];
    for (const altura of [.068, .088]) {
      anel('cordas', {cor: corda}, eixoEstaca(altura), .032, RAIO_VOLTA, rotacaoEstaca);
    }
    const centroInferior = eixoEstaca(.088);
    // Lado voltado para a barraca, perpendicular ao eixo da estaca.
    const pe: Ponto = [centroInferior[0] - lado * cosseno * .032,
      centroInferior[1] + seno * .032, centroInferior[2]];

    // Os dois tirantes de cada extremidade têm amarrações separadas ao longo
    // da cumeeira; os anéis ficam perpendiculares ao eixo horizontal da viga.
    const zTopo = extremidade * (HALF_D + (lado < 0 ? .07 : .115));
    for (const deslocamento of [-.009, .009]) {
      anel('cordas', {cor: corda}, [0, RIDGE, zTopo + deslocamento], .059, RAIO_VOLTA, [0, 0, 0]);
    }
    const topo: Ponto = [lado * .059, RIDGE, zTopo];
    viga('cordas', {cor: corda}, topo, pe, RAIO_TIRANTE, .05);

    // Ponta curta sai da volta inferior, dando leitura de nó sem flutuar.
    const centroPonta = eixoEstaca(.068);
    const inicioPonta: Ponto = [centroPonta[0] + lado * cosseno * .032,
      centroPonta[1] - seno * .032, centroPonta[2]];
    const fimPonta: Ponto = [inicioPonta[0] + lado * .07, inicioPonta[1] - .045,
      inicioPonta[2] + extremidade * .025];
    viga('cordas', {cor: corda}, inicioPonta, fimPonta, .009);
  }
}

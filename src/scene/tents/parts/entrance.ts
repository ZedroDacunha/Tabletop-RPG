import type {ConstrutorTenda} from '../helpers';
import {HALF_W, HALF_D, RIDGE, EAVE, DOOR_W, DOOR_H, lonaClara, lonaSombra, lonaCostura, corda} from '../types';
import {uvParedeExtremidade} from '../canvasTexture';
import {PASSO_PONTO} from '../seamTexture';

/** Frente da tenda: abertura central de altura útil, com abas presas nas laterais. */
export function construirEntrada({superficie, viga}: ConstrutorTenda) {
  // O mesmo perfil e os mesmos extremos do telhado, sem sobra além da quina.
  const topo = (x: number) => RIDGE + Math.abs(x) / HALF_W * (EAVE - RIDGE);
  const frente = HALF_D;

  for (const lado of [-1, 1]) {
    // As laterais ocupam somente o espaço entre a abertura e as paredes.
    superficie('lona', {cor: lonaSombra, duplaFace: true, textura: 'trama'}, 8, 8, (u, v) => {
      const x = lado * (DOOR_W + u * (HALF_W - DOOR_W));
      return [x, v * topo(x), frente];
    }, [0, 0, 1], (u, v) => {
      const x = lado * (DOOR_W + u * (HALF_W - DOOR_W));
      return uvParedeExtremidade(x, v * topo(x));
    });

    // Bordas reforçadas definem claramente os limites da abertura.
    superficie('lona', {cor: lonaCostura, duplaFace: true, textura: 'costura'}, 1, 6, (u, v) => {
      const x = lado * (DOOR_W + u * .035);
      return [x, v * Math.min(DOOR_H, topo(x) - .004), frente + .003];
    }, [0, 0, 1], (u, v) => {
      const x = lado * (DOOR_W + u * .035);
      return [u, v * Math.min(DOOR_H, topo(x) - .004) / PASSO_PONTO];
    });

    // A aba sobrepõe a borda da abertura e acompanha a parede. Apenas uma
    // pequena folga evita z-fighting, sem deixar uma placa suspensa na frente.
    const pontoAba = (u: number, v: number): [number, number, number] => {
      const largura = .10 + .20 * Math.abs(2 * v - 1);
      const x = lado * (DOOR_W + .02 + u * largura);
      const y = .04 + v * (Math.min(DOOR_H, topo(x) - .025) - .04);
      const z = frente + .004 + .008 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      return [x, y, z];
    };
    // A trama segue as coordenadas da frente, sem esticar com a largura variável.
    superficie('lona', {cor: lonaClara, duplaFace: true, textura: 'trama'}, 4, 8, pontoAba, [0, 0, 1],
      (u, v) => { const [x, y] = pontoAba(u, v); return uvParedeExtremidade(x, y); });

    // A amarração segue as dobras da superfície em vez de formar um anel
    // circular que ficava suspenso atrás e à frente de uma aba plana.
    for (let i = 0; i < 4; i++) {
      const a = pontoAba(i / 4, .5), b = pontoAba((i + 1) / 4, .5);
      a[2] += .006; b[2] += .006;
      viga('cordas', {cor: corda}, a, b, .006);
    }
  }

  // Painel central acima da passagem, preenchendo até o perfil triangular do teto.
  // A parte inferior é horizontal: não há um buraco entre o teto e a porta.
  superficie('lona', {cor: lonaClara, duplaFace: true, textura: 'trama'}, 8, 5, (u, v) => {
    const x = (u * 2 - 1) * DOOR_W;
    return [x, DOOR_H + v * (topo(x) - DOOR_H), frente];
  }, [0, 0, 1], (u, v) => {
    const x = (u * 2 - 1) * DOOR_W;
    return uvParedeExtremidade(x, DOOR_H + v * (topo(x) - DOOR_H));
  });
  superficie('lona', {cor: lonaCostura, duplaFace: true, textura: 'costura'}, 8, 1, (u, v) => {
    const x = (u * 2 - 1) * DOOR_W;
    return [x, Math.min(DOOR_H + v * .035, topo(x) - .004), frente + .003];
  }, [0, 0, 1], (u, v) => [v, u * 2 * DOOR_W / PASSO_PONTO]);
}

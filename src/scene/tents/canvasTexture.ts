import * as T from 'three';
import {HALF_D, HALF_W, RIDGE, EAVE} from './types';

/** Um mosaico cobre 12 cm de lona; os fios se repetem dentro dele. */
export const TAMANHO_TRAMA = .12;

/** UVs em metros, partilhados pela água e pelos detalhes sobre ela. */
export function uvTelhado(aoLongo: number, inclinacao: number): [number, number] {
  return [aoLongo * 2 * HALF_D / TAMANHO_TRAMA,
    inclinacao * Math.hypot(HALF_W, RIDGE - EAVE) / TAMANHO_TRAMA];
}

/** UVs em metros: mantêm a mesma escala de tecido nas paredes de cada plano. */
export function uvParedeLateral(z: number, y: number): [number, number] {
  return [(z + HALF_D) / TAMANHO_TRAMA, y / TAMANHO_TRAMA];
}

export function uvParedeExtremidade(x: number, y: number): [number, number] {
  return [(x + HALF_W) / TAMANHO_TRAMA, y / TAMANHO_TRAMA];
}

/** Trama simples de algodão cru: urdume e trama alternam a passagem sobre/baixo.
 * A cor é neutra para preservar os tons da lona; não há sujeira ou desgaste.
 */
export function criarTexturasLona() {
  const tamanho = 128, fios = 16, tau = Math.PI * 2;
  const cor = new Uint8Array(tamanho * tamanho * 4);
  const relevo = new Uint8Array(tamanho * tamanho * 4);
  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    const u = (x + .5) / tamanho, v = (y + .5) / tamanho;
    const urdume = Math.cos(tau * fios * u), trama = Math.cos(tau * fios * v);
    const alternancia = Math.cos(Math.PI * fios * u) * Math.cos(Math.PI * fios * v);
    const altura = T.MathUtils.clamp(.5 + .21 * (urdume + trama) + .08 * alternancia * (urdume - trama), 0, 1);
    const brilho = Math.round(225 + 30 * altura);
    const h = Math.round(altura * 255);
    const i = (y * tamanho + x) * 4;
    cor.set([brilho, brilho, brilho, 255], i);
    relevo.set([h, h, h, 255], i);
  }
  const criar = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const mapa = new T.DataTexture(dados, tamanho, tamanho, T.RGBAFormat);
    mapa.colorSpace = espaco;
    mapa.wrapS = mapa.wrapT = T.RepeatWrapping;
    mapa.magFilter = T.LinearFilter;
    mapa.minFilter = T.LinearMipmapLinearFilter;
    mapa.generateMipmaps = true;
    mapa.anisotropy = 4;
    // O rasterizador offline também deve filtrar a trama quando vista de longe.
    mapa.userData.filtrarPrevia = true;
    mapa.needsUpdate = true;
    return mapa;
  };
  return {map: criar(cor, T.SRGBColorSpace), bumpMap: criar(relevo, T.NoColorSpace)};
}

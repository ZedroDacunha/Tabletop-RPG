import * as T from 'three';
import {HALF_D, HALF_W, RIDGE, EAVE} from './types';
import {alturaTrama, uvTelhado} from './canvasTexture';
import {PASSO_PONTO} from './seamTexture';

// Limites do remendo na grade da água; a textura e a geometria compartilham estes valores.
export const INICIO_REMENDO = 19 / 24, FIM_REMENDO = 21 / 24;
export const TOPO_REMENDO = 3 / 6, BASE_REMENDO = 4 / 6;
const LARGURA = 2 * HALF_D * (FIM_REMENDO - INICIO_REMENDO);
const ALTURA = Math.hypot(HALF_W, RIDGE - EAVE) * (BASE_REMENDO - TOPO_REMENDO);

/** Pontos bordados dentro do perímetro, espaçados em metros e sem geometria extra. */
function pontos(x: number, y: number): number {
  const margem = .008, raio = .0015, meioFio = .009;
  const ponto = (longitudinal: number, transversal: number, comprimento: number) => {
    if (longitudinal < margem || longitudinal > comprimento - margem) return 0;
    const fase = ((longitudinal + PASSO_PONTO / 2) % PASSO_PONTO) - PASSO_PONTO / 2;
    const distancia = Math.hypot(transversal, Math.max(0, Math.abs(fase) - meioFio));
    return 1 - T.MathUtils.smoothstep(distancia, raio * .65, raio * 1.35);
  };
  return Math.max(
    ponto(x, y - margem, LARGURA), ponto(x, y - (ALTURA - margem), LARGURA),
    ponto(y, x - margem, ALTURA), ponto(y, x - (LARGURA - margem), ALTURA),
  );
}

/** Lona com a mesma escala e fase do telhado, com costura discreta no próprio mapa. */
export function criarTexturasRemendo() {
  const tamanho = 256;
  const cor = new Uint8Array(tamanho * tamanho * 4), relevo = new Uint8Array(tamanho * tamanho * 4);
  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    const u = (x + .5) / tamanho, v = (y + .5) / tamanho;
    const [ut, vt] = uvTelhado(INICIO_REMENDO + u * (FIM_REMENDO - INICIO_REMENDO), TOPO_REMENDO + v * (BASE_REMENDO - TOPO_REMENDO));
    const tecido = alturaTrama(ut, vt), fio = pontos(u * LARGURA, v * ALTURA);
    const brilho = Math.round(225 + 30 * tecido - 30 * fio);
    const altura = Math.round(T.MathUtils.clamp(tecido + .3 * fio, 0, 1) * 255);
    const i = (y * tamanho + x) * 4;
    cor.set([brilho, brilho, brilho, 255], i);
    relevo.set([altura, altura, altura, 255], i);
  }
  const criar = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const mapa = new T.DataTexture(dados, tamanho, tamanho, T.RGBAFormat);
    mapa.colorSpace = espaco;
    mapa.wrapS = mapa.wrapT = T.ClampToEdgeWrapping;
    mapa.magFilter = T.LinearFilter;
    mapa.minFilter = T.LinearMipmapLinearFilter;
    mapa.generateMipmaps = true;
    mapa.anisotropy = 4;
    mapa.userData.filtrarPrevia = true;
    mapa.needsUpdate = true;
    return mapa;
  };
  return {map: criar(cor, T.SRGBColorSpace), bumpMap: criar(relevo, T.NoColorSpace)};
}

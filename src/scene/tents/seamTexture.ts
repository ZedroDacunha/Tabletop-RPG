import * as T from 'three';

/** Distância entre pontos ao longo da costura, em metros. */
export const PASSO_PONTO = .035;

/** Fita de lona com duas carreiras de pontos, sem sujeira ou desgaste. */
export function criarTexturasCostura() {
  const tamanho = 128;
  const cor = new Uint8Array(tamanho * tamanho * 4);
  const relevo = new Uint8Array(tamanho * tamanho * 4);
  const suave = (a: number, b: number, x: number) => {
    const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    const u = (x + .5) / tamanho, v = (y + .5) / tamanho;
    // Dois pontos estreitos, de pontas arredondadas, repetidos ao longo da fita.
    const distanciaLinha = Math.min(Math.abs(u - .27), Math.abs(u - .73));
    const distanciaPonta = Math.max(0, Math.abs(v - .5) - .20);
    const distancia = Math.hypot(distanciaLinha / .035, distanciaPonta / .07);
    const fio = 1 - suave(.55, 1.15, distancia);
    // Pequena trama periódica no tecido entre os pontos.
    const fibra = Math.cos(2 * Math.PI * 4 * u) * Math.cos(2 * Math.PI * 4 * v);
    const brilho = Math.round(232 + 3 * fibra + 20 * fio);
    const altura = Math.round(125 + 9 * fibra + 75 * fio);
    const i = (y * tamanho + x) * 4;
    cor.set([brilho, brilho, brilho, 255], i);
    relevo.set([altura, altura, altura, 255], i);
  }
  const criar = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const mapa = new T.DataTexture(dados, tamanho, tamanho, T.RGBAFormat);
    mapa.colorSpace = espaco;
    mapa.wrapS = mapa.wrapT = T.RepeatWrapping;
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

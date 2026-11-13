import * as T from 'three';

/** Comprimento real de uma repetição da torção, em metros. */
export const PASSO_CORDA = .12;

/** Texturas periódicas de cânhamo: três cordões torcidos e fibras mais finas.
 * São geradas localmente, sem imagens externas nem dependência do DOM.
 */
export function criarTexturasCorda() {
  const tamanho = 128;
  const cor = new Uint8Array(tamanho * tamanho * 4);
  const relevo = new Uint8Array(tamanho * tamanho * 4);
  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    const u = (x + .5) / tamanho, v = (y + .5) / tamanho;
    const fase = 2 * Math.PI * (3 * u - v);
    const cordao = .5 + .5 * Math.cos(fase);
    const fibras = Math.sin(2 * Math.PI * (18 * u - 6 * v)) * .06
      + Math.sin(2 * Math.PI * (27 * u - 8 * v)) * .025;
    const altura = T.MathUtils.clamp(.25 + .67 * cordao + fibras, 0, 1);
    const brilho = Math.round(185 + 68 * altura);
    const h = Math.round(altura * 255);
    const i = (y * tamanho + x) * 4;
    cor.set([brilho, brilho, brilho, 255], i);
    relevo.set([h, h, h, 255], i);
  }
  const criar = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const textura = new T.DataTexture(dados, tamanho, tamanho, T.RGBAFormat);
    textura.colorSpace = espaco;
    textura.wrapS = textura.wrapT = T.RepeatWrapping;
    textura.magFilter = T.LinearFilter;
    textura.minFilter = T.LinearMipmapLinearFilter;
    textura.generateMipmaps = true;
    textura.anisotropy = 4;
    textura.needsUpdate = true;
    return textura;
  };
  return {map: criar(cor, T.SRGBColorSpace), bumpMap: criar(relevo, T.NoColorSpace)};
}

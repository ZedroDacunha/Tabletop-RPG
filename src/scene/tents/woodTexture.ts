import * as T from 'three';

/** Textura procedural de madeira rústica, com fibras longitudinais e veios irregulares.
 * Gerada localmente; não depende de canvas, downloads ou arquivos de terceiros.
 */
export function criarTexturasMadeiraEstaca() {
  const largura = 128, altura = 128, tau = Math.PI * 2;
  const cor = new Uint8Array(largura * altura * 4);
  const relevo = new Uint8Array(largura * altura * 4);
  for (let y = 0; y < altura; y++) for (let x = 0; x < largura; x++) {
    const u = (x + .5) / largura, v = (y + .5) / altura;
    // Frequências inteiras mantêm a textura contínua na emenda da estaca.
    const deformacao = .09 * Math.sin(tau * (2 * v)) + .04 * Math.sin(tau * (5 * v + 3 * u));
    const veio = Math.sin(tau * (11 * u + deformacao));
    const fibras = Math.sin(tau * (31 * u + .3 * Math.sin(tau * (3 * v + 2 * u))));
    const desgaste = Math.sin(tau * (3 * u + 2 * v)) * .035 + Math.sin(tau * (7 * u - v)) * .025;
    const alturaVeio = T.MathUtils.clamp(.64 + veio * .16 + fibras * .055 + desgaste, 0, 1);
    const brilho = .68 + .42 * alturaVeio;
    const i = (y * largura + x) * 4;
    cor.set([Math.round(170 * brilho), Math.round(123 * brilho), Math.round(79 * brilho), 255], i);
    const h = Math.round(alturaVeio * 255);
    relevo.set([h, h, h, 255], i);
  }
  const textura = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const mapa = new T.DataTexture(dados, largura, altura, T.RGBAFormat);
    mapa.colorSpace = espaco;
    mapa.wrapS = mapa.wrapT = T.RepeatWrapping;
    mapa.magFilter = T.LinearFilter;
    mapa.minFilter = T.LinearMipmapLinearFilter;
    mapa.generateMipmaps = true;
    mapa.anisotropy = 4;
    mapa.needsUpdate = true;
    return mapa;
  };
  return {map: textura(cor, T.SRGBColorSpace), bumpMap: textura(relevo, T.NoColorSpace)};
}

import * as T from 'three';

// O atlas separa a madeira longitudinal da seção cortada das duas pontas.
const LARGURA = 512, ALTURA = 256;
const INICIO_CORPO = 8, LARGURA_CORPO = 392, INICIO_PONTA = 416, LARGURA_PONTA = 88;

/** Mantém os veios no eixo e desenha anéis de crescimento nas duas tampas. */
export function ajustarUvCumeeira(geometria: T.BufferGeometry) {
  const uv = geometria.getAttribute('uv'), normal = geometria.getAttribute('normal');
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    if (Math.abs(normal.getY(i)) > .5) {
      uv.setXY(i, (INICIO_PONTA + u * LARGURA_PONTA) / LARGURA, (.5 + v * (ALTURA - 1)) / ALTURA);
    } else {
      uv.setXY(i, (INICIO_CORPO + u * LARGURA_CORPO) / LARGURA, v);
    }
  }
}

/** Madeira fosca procedural em tons neutros: o material mantém a cor da viga. */
export function criarTexturasCumeeira() {
  const cor = new Uint8Array(LARGURA * ALTURA * 4), relevo = new Uint8Array(LARGURA * ALTURA * 4);
  const tau = 2 * Math.PI;
  for (let y = 0; y < ALTURA; y++) for (let x = 0; x < LARGURA; x++) {
    const v = (y + .5) / ALTURA;
    let altura: number;
    if (x < INICIO_PONTA - 8) {
      // Os oito texels nas margens repetem o outro lado da circunferência.
      const u = (((x - INICIO_CORPO + .5) / LARGURA_CORPO) % 1 + 1) % 1;
      const curva = .09 * Math.sin(tau * (2 * v)) + .035 * Math.sin(tau * (5 * v + 2 * u));
      const veios = Math.sin(tau * (11 * u + curva));
      const fibras = Math.sin(tau * (29 * u + .3 * Math.sin(tau * (3 * v + u))));
      altura = T.MathUtils.clamp(.54 + .22 * veios + .07 * fibras, 0, 1);
    } else {
      // Anéis na seção da madeira; a margem estende a ponta sem contaminar o corpo.
      const u = T.MathUtils.clamp((x - INICIO_PONTA + .5) / LARGURA_PONTA, 0, 1);
      const dx = u - .5, dy = v - .5;
      const raio = Math.hypot(dx * 1.03, dy * .97);
      const anel = Math.sin(tau * (raio * 13 + .018 * Math.sin(tau * (u * 3 + v * 2))));
      altura = T.MathUtils.clamp(.55 + .17 * anel + .035 * Math.cos(tau * (u * 9 + v * 7)), 0, 1);
    }
    const brilho = Math.round(223 + 30 * altura), h = Math.round(altura * 255);
    const i = (y * LARGURA + x) * 4;
    cor.set([brilho, brilho, brilho, 255], i);
    relevo.set([h, h, h, 255], i);
  }
  const criar = (dados: Uint8Array, espaco: T.ColorSpace) => {
    const mapa = new T.DataTexture(dados, LARGURA, ALTURA, T.RGBAFormat);
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

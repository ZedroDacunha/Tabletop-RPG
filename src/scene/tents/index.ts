import {criarConstrutor} from './helpers';
import {construirLona} from './parts/canvas';
import {construirEntrada} from './parts/entrance';
import {construirEstrutura} from './parts/structure';
import {construirCordasEEstacas} from './parts/ropes';

/** Tenda de acampamento com peças agrupadas por material para economizar draw calls. */
export function buildTentModel() {
  const tenda = criarConstrutor();
  construirLona(tenda);
  construirEntrada(tenda);
  construirEstrutura(tenda);
  construirCordasEEstacas(tenda);
  return tenda.montar();
}

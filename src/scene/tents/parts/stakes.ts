import * as T from 'three';
import type {ConstrutorTenda} from '../helpers';

/** Estaca de 30 cm feita como um galho talhado: ponta, corpo e entalhe para a corda.
 * O centro e a inclinação permanecem iguais aos usados pelas amarrações.
 */
export function construirEstaca({guardar}: ConstrutorTenda, x: number, z: number, lado: number, angulo: number) {
  // Coordenadas locais (raio, altura); o entalhe fica sob as duas voltas.
  const perfil = [
    [.001, -.15], [.028, -.065], [.026, .060], [.022, .078], [.023, .15], [0, .15],
  ].map(([raio, altura]) => new T.Vector2(raio, altura));
  const geometria = new T.LatheGeometry(perfil, 6);
  const pos = geometria.getAttribute('position'), uv = geometria.getAttribute('uv');
  // V acompanha o comprimento real; U circunda a estaca, com variação por peça.
  const variacao = (lado > 0 ? .19 : 0) + (z > 0 ? .31 : 0);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + variacao, (pos.getY(i) + .15) / .3);
  geometria.applyMatrix4(new T.Matrix4().compose(
    new T.Vector3(x, .1, z),
    new T.Quaternion().setFromEuler(new T.Euler(0, 0, -lado * angulo)),
    new T.Vector3(1, 1, 1),
  ));
  guardar('estacas', {cor: '#ffffff', fosco: true}, geometria);
}

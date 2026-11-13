import * as T from 'three';
import {buildTentModel} from '../src/scene/tentModel';
const m = buildTentModel();
let tris = 0;
const partes: Record<string, number> = {};
m.traverse((o) => {
  if (!(o instanceof T.Mesh)) return;
  const n = (o.geometry.index?.count ?? o.geometry.getAttribute('position').count) / 3;
  tris += n;
  partes[o.name] = (partes[o.name] ?? 0) + 1;
  console.log(o.name.padEnd(10), (o.material as T.MeshStandardMaterial).color.getHexString(), String(Math.round(n)).padStart(5), 'tris');
});
const b = new T.Box3().setFromObject(m);
console.log('malhas', m.children.length, 'triangulos', Math.round(tris), 'partes', partes);
console.log('bounds', b.min.toArray().map((v) => +v.toFixed(2)), b.max.toArray().map((v) => +v.toFixed(2)));

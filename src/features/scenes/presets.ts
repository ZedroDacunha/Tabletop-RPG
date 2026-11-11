import {makeEntity, type Entity, type Kind, type Vec3} from '../projects/project';
import {catalog} from '../assets/catalog';

export type PresetItem = {kind:Kind;x:number;z:number;scale?:number;rotation?:number;y?:number};
export type ScenePreset = {id:string;name:string;description:string;icon:Kind;items:PresetItem[]};

const nameOf = (kind:Kind) => catalog.find((item) => item.kind === kind)?.name ?? kind;

/** Cenários prontos, montados com as peças nativas. Coordenadas em metros, relativas ao centro do cenário. */
export const presets:ScenePreset[]=[
 {
  id:'clearing',name:'Clareira na floresta',description:'Árvores ao redor de uma clareira aberta.',icon:'pine',
  items:[
   {kind:'pine',x:-6,z:-5,scale:1.2,rotation:.3},{kind:'oak',x:5,z:-6,scale:1.1,rotation:1.1},
   {kind:'birch',x:-5,z:5,scale:1.05,rotation:2.1},{kind:'pine',x:6,z:4,scale:1.15,rotation:.8},
   {kind:'deadtree',x:0,z:-7,scale:.95,rotation:1.6},{kind:'bush',x:-3,z:-2,scale:.9,rotation:.4},
   {kind:'bush',x:3,z:-3,scale:1,rotation:1.2},{kind:'bush',x:-2,z:3,scale:.85,rotation:2.4},
   {kind:'mushrooms',x:-1.5,z:-4,scale:.9},{kind:'mushrooms',x:2.4,z:4.2,scale:.8},
   {kind:'log',x:-4,z:1,scale:1,rotation:.6},{kind:'rock',x:1,z:-2.6,scale:.9,rotation:.2},
   {kind:'rock',x:-6,z:0,scale:.8,rotation:1.9},
  ],
 },
 {
  id:'camp',name:'Acampamento de expedição',description:'Tendas, fogueira e suprimentos.',icon:'tent',
  items:[
   {kind:'tent',x:-3,z:0,scale:1.2,rotation:.5},{kind:'tent',x:3,z:.6,scale:1.1,rotation:-.6},
   {kind:'campfire',x:0,z:1.2,scale:1.1},{kind:'lantern',x:-1.6,z:2.4,scale:.95},
   {kind:'lantern',x:1.9,z:2.3,scale:.95},{kind:'crate',x:-4.6,z:2.6,scale:.8,rotation:.2},
   {kind:'crate',x:-3.5,z:3.4,scale:.7,rotation:-.1},{kind:'barrel',x:4.3,z:2.9,scale:.85},
   {kind:'cart',x:4.6,z:-1.6,scale:.8,rotation:-.7},{kind:'chest',x:-4.4,z:-1.5,scale:.75,rotation:.3},
   {kind:'banner',x:0,z:3.7,scale:.9,rotation:-.2},{kind:'fence',x:-1.9,z:4.3,scale:.8,rotation:.1},
   {kind:'fence',x:2,z:4.4,scale:.8,rotation:-.1},
  ],
 },
 {
  id:'ruins',name:'Ruína esquecida',description:'Muralhas, arco e uma torre caída.',icon:'arch',
  items:[
   {kind:'wall',x:-3.4,z:-4,scale:1.1},{kind:'wall',x:3.4,z:-4,scale:1.1},
   {kind:'arch',x:0,z:-4.4,scale:1.2},{kind:'tower',x:-5.6,z:-5.4,scale:1},
   {kind:'column',x:-5,z:-1,scale:.9},{kind:'column',x:5,z:-1.6,scale:.8},
   {kind:'stairs',x:0,z:-1.8,scale:.95},{kind:'statue',x:-2.4,z:-2.2,scale:.85,rotation:.4},
   {kind:'deadtree',x:5.6,z:2.4,scale:1.1,rotation:1.2},{kind:'floor',x:0,z:0,scale:.9},
   {kind:'floor',x:0,z:2,scale:.9},{kind:'floor',x:0,z:4,scale:.9},
  ],
 },
 {
  id:'shrine',name:'Santuário antigo',description:'Altar cercado de colunas e cristais.',icon:'shrine',
  items:[
   {kind:'shrine',x:0,z:0,scale:1.05},{kind:'column',x:-3.2,z:-1.6,scale:.8},
   {kind:'column',x:3.2,z:-1.6,scale:.8},{kind:'column',x:-3.2,z:1.8,scale:.8},
   {kind:'column',x:3.2,z:1.8,scale:.8},{kind:'statue',x:0,z:-3.4,scale:.9,rotation:.2},
   {kind:'crystal',x:-2.6,z:3.2,scale:.8},{kind:'crystal',x:2.8,z:3.4,scale:.9,rotation:1.4},
   {kind:'lantern',x:-1.6,z:-2.4,scale:.95},{kind:'lantern',x:1.7,z:-2.5,scale:.95},
   {kind:'floor',x:0,z:3.6,scale:.9},
  ],
 },
 {
  id:'lagoon',name:'Lagoa tranquila',description:'Água, ponte de madeira e pedras.',icon:'pond',
  items:[
   {kind:'pond',x:0,z:0,scale:1.2},{kind:'bridge',x:0,z:-3.7,scale:.8},
   {kind:'birch',x:-3.6,z:2.4,scale:1.05,rotation:.9},{kind:'birch',x:3.8,z:2.2,scale:.95,rotation:2.2},
   {kind:'rock',x:-4.4,z:-1.6,scale:.9,rotation:.6},{kind:'rock',x:4.6,z:-1.2,scale:.8,rotation:1.7},
   {kind:'crystal',x:-2.8,z:-3.4,scale:.85},{kind:'bush',x:4.2,z:3.6,scale:.9,rotation:.3},
   {kind:'log',x:-4.8,z:4.2,scale:.9,rotation:.5},{kind:'mushrooms',x:2.6,z:4.4,scale:.8},
  ],
 },
];

/** Instancia as peças de um cenário a partir de uma origem no mapa. */
export function buildPreset(preset:ScenePreset, origin:Vec3):Entity[]{
 return preset.items.map((item) => {
  const entity = makeEntity(item.kind, nameOf(item.kind), [origin[0] + item.x, item.y ?? 0, origin[2] + item.z]);
  if (item.scale !== undefined) entity.scale = [item.scale, item.scale, item.scale];
  entity.rotation = [0, item.rotation ?? 0, 0];
  return entity;
 });
}

/** Procura um ponto livre no mapa para encaixar o cenário sem sobrepor o que já existe. */
export function findFreeOrigin(objects:Entity[], radius:number, size:number):Vec3{
 const limit = Math.max(0, size / 2 - 7);
 const candidates:Array<[number, number]> = [
  [0, 0], [9, 0], [-9, 0], [0, 9], [0, -9], [9, 9], [-9, 9], [9, -9], [-9, -9],
  [16, 0], [-16, 0], [0, 16], [0, -16], [16, 16], [-16, -16],
 ];
 const free = ([x, z]:[number, number]) => !objects.some((object) => Math.hypot(object.position[0] - x, object.position[2] - z) < radius);
 for (const [x, z] of candidates) {
  const point:[number, number] = [Math.max(-limit, Math.min(limit, x)), Math.max(-limit, Math.min(limit, z))];
  if (free(point)) return [point[0], 0, point[1]];
 }
 return [0, 0, 0];
}

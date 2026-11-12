import {catalog} from '../assets/catalog';
import type {Entity} from '../projects/project';

export type LayerId='natureza'|'construcoes'|'objetos'|'basicos'|'importados';
export type Layer={id:LayerId;name:string};
export const layers:Layer[]=[
 {id:'natureza',name:'Natureza'},
 {id:'construcoes',name:'Construções'},
 {id:'objetos',name:'Objetos'},
 {id:'basicos',name:'Básicos'},
 {id:'importados',name:'Importados'},
];
const BY_CATEGORY:Record<string,LayerId>={'Natureza':'natureza','Construções':'construcoes','Objetos':'objetos','Mobiliário':'objetos','Acampamento':'objetos','Iluminação':'objetos','Masmorra':'objetos','Decoração':'objetos','Básicos':'basicos','Importados':'importados'};
const KIND_LAYER=new Map<string,LayerId>(catalog.map(item=>[item.kind,BY_CATEGORY[item.category]??'basicos']));

export function layerOf(entity:Entity):LayerId{
 return entity.kind==='model'?'importados':KIND_LAYER.get(entity.kind)??'basicos';
}
export function layerSummary(objects:Entity[],layer:LayerId):{total:number;visible:number;locked:number}{
 const inside=objects.filter(o=>layerOf(o)===layer);
 return {total:inside.length,visible:inside.filter(o=>o.visible).length,locked:inside.filter(o=>o.locked).length};
}
export function setLayer(objects:Entity[],layer:LayerId,change:{visible?:boolean;locked?:boolean}):Entity[]{
 return objects.map(o=>layerOf(o)!==layer?o:{...o,...(change.visible!==undefined?{visible:change.visible}:{}),...(change.locked!==undefined?{locked:change.locked}:{})});
}


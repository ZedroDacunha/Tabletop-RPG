export type Vec3 = [number, number, number];
export const KINDS = [
 'pine','oak','birch','deadtree','bush','mushrooms','log','crystal','pond',
 'rock','wall','arch','floor','tower','stairs','fence','bridge','shrine',
 'tent','campfire','lantern','banner','statue','chest','cart','crate','barrel','well','column',
 'cube','sphere','cylinder',
] as const;
export type Kind = typeof KINDS[number];
export type Group = { id:string; name:string };
export type Entity = { id:string; kind:Kind|'model'; assetId?:string; groupId?:string; name:string; position:Vec3; rotation:Vec3; scale:Vec3; visible:boolean; locked:boolean; color:string };
export type Asset = { id:string; name:string; data:string; bytes:number };
export type Project = { schemaVersion:1; id:string; name:string; updatedAt:string; objects:Entity[]; assets:Asset[]; groups?:Group[]; settings:{ size:number; gridSize:number; grid:boolean; snap:boolean; guides?:boolean; atmosphere:'dawn'|'day'|'dusk'|'night'; background:string }; camera?:{position:Vec3;target:Vec3} };
export const uid = () => crypto.randomUUID();
export const GROUP_NAME_MAX=60;
export function makeGroup(name:string):Group{return {id:uid(),name:name.trim().slice(0,GROUP_NAME_MAX)||'Grupo'};}
export function assignGroup(objects:Entity[], ids:ReadonlySet<string>, groupId?:string):Entity[]{
 return objects.map(o=>{if(!ids.has(o.id))return o;const {groupId:_,...rest}=o;return groupId?{...rest,groupId}:rest});
}
export function pruneGroups(groups:Group[]|undefined, objects:Entity[]):Group[]|undefined{
 if(!groups?.length)return undefined;
 const used=new Set(objects.map(o=>o.groupId).filter((id):id is string=>Boolean(id)));
 const kept=groups.filter(g=>used.has(g.id));
 return kept.length?kept:undefined;
}
export function withGroups(project:Project, groups:Group[]|undefined):Project{
 const {groups:_,...rest}=project;return groups?.length?{...rest,groups}:rest;
}
export const MAX_PROJECT_BYTES=100*1024*1024;
export function nudgeEntity(entity:Entity, delta:{x?:number;y?:number;z?:number;rotate?:number}, limit=5000):Entity{
 const clamp=(value:number)=>Math.max(-limit,Math.min(limit,value));
 const position:Vec3=[clamp(entity.position[0]+(delta.x??0)),clamp(entity.position[1]+(delta.y??0)),clamp(entity.position[2]+(delta.z??0))];
 const rotation:Vec3=[entity.rotation[0],entity.rotation[1]+(delta.rotate??0),entity.rotation[2]];
 return {...entity,position,rotation};
}

export function toggleSelection(ids:string[], id:string, additive:boolean):string[]{
 if(!additive)return ids.length===1&&ids[0]===id?ids:[id];
 return ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];
}
export function selectionCenter(entities:Entity[]):Vec3{
 if(!entities.length)return [0,0,0];
 const sum=entities.reduce<Vec3>((acc,e)=>[acc[0]+e.position[0],acc[1]+e.position[1],acc[2]+e.position[2]],[0,0,0]);
 return [sum[0]/entities.length,sum[1]/entities.length,sum[2]/entities.length];
}

export const GUIDE_THRESHOLD=.75;
export type Neighbour={ entity:Entity; distance:number; delta:Vec3 };
export function nearestNeighbour(entity:Entity, objects:Entity[]):Neighbour|null{
 let best:Neighbour|null=null;
 for(const other of objects){
  if(other.id===entity.id||!other.visible)continue;
  const delta:Vec3=[other.position[0]-entity.position[0],other.position[1]-entity.position[1],other.position[2]-entity.position[2]];
  const distance=Math.hypot(...delta);
  if(!best||distance<best.distance)best={entity:other,distance,delta};
 }
 return best;
}
export function alignToNeighbours(position:Vec3, entity:Entity, objects:Entity[], threshold=GUIDE_THRESHOLD):{position:Vec3;aligned:string[]}{
 const axis=(index:0|2):{name:string;value:number}|null=>{
  let best:{name:string;value:number;gap:number}|null=null;
  for(const other of objects){
   if(other.id===entity.id||!other.visible)continue;
   const gap=Math.abs(other.position[index]-position[index]);
   if(gap>threshold)continue;
   if(!best||gap<best.gap)best={name:other.name,value:other.position[index],gap};
  }
  return best?{name:best.name,value:best.value}:null;
 };
 const x=axis(0),z=axis(2);const aligned:string[]=[];
 if(x)aligned.push(x.name);if(z&&z.name!==x?.name)aligned.push(z.name);
 return {position:[x?x.value:position[0],position[1],z?z.value:position[2]],aligned};
}

export function emptyProject():Project {return {schemaVersion:1,id:uid(),name:'Meu novo mundo',updatedAt:new Date().toISOString(),objects:[],assets:[],settings:{size:30,gridSize:1,grid:true,snap:true,guides:true,atmosphere:'day',background:'#202a28'}};}
export function makeEntity(kind:Entity['kind'],name:string,position:Vec3=[0,0,0],assetId?:string):Entity {return {id:uid(),kind,name,position,rotation:[0,0,0],scale:[1,1,1],visible:true,locked:false,color:kind==='cube'?'#a7bf99':kind==='sphere'?'#d5b68c':'#9eafa9',...(assetId?{assetId}:{})};}
function object(v:unknown):v is Record<string,unknown>{return typeof v==='object'&&v!==null&&!Array.isArray(v);}
function vector(v:unknown,scale=false):v is Vec3{return Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&(scale?x>=0.05&&x<=50:Math.abs(x)<=5000));}
const color=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function validateProject(raw:unknown):Project {
 const fail=(msg:string):never=>{throw new Error(msg)};
 if(!object(raw)||raw.schemaVersion!==1) return fail('Formato de projeto não reconhecido. Use um arquivo .tabletop exportado pelo editor.');
 if(typeof raw.name!=='string'||raw.name.length>120||typeof raw.id!=='string')return fail('O projeto não tem um nome ou identificador válido.');
 if(!Array.isArray(raw.objects)||raw.objects.length>1500||!Array.isArray(raw.assets)||raw.assets.length>80)return fail('O projeto excede o limite de 1.500 objetos ou 80 modelos.');
 const assets:Asset[]=raw.assets.map(a=>{if(!object(a)||typeof a.id!=='string'||typeof a.name!=='string'||a.name.length>120||typeof a.data!=='string'||!/^data:model\/gltf-binary;base64,[A-Za-z0-9+/]+=*$/.test(a.data)||a.data.length>45*1024*1024||typeof a.bytes!=='number'||!Number.isFinite(a.bytes)||a.bytes<0) return fail('Um modelo do projeto está inválido.');return a as Asset;});
 const assetIds=new Set(assets.map(a=>a.id));if(assetIds.size!==assets.length)return fail('O projeto contém modelos com identificadores repetidos.');
 let groups:Group[]|undefined;
 if(raw.groups!==undefined){if(!Array.isArray(raw.groups)||raw.groups.length>200)return fail('Os grupos do mapa são inválidos.');groups=raw.groups.map(g=>{if(!object(g)||typeof g.id!=='string'||!g.id||typeof g.name!=='string'||!g.name.trim()||g.name.length>GROUP_NAME_MAX)return fail('Um grupo do mapa tem propriedades inválidas.');return {id:g.id,name:g.name}});if(new Set(groups.map(g=>g.id)).size!==groups.length)return fail('O projeto contém grupos com identificadores repetidos.')}
 let objects:Entity[]=raw.objects.map(o=>{if(!object(o)||typeof o.id!=='string'||typeof o.name!=='string'||o.name.length>120||!((KINDS as readonly unknown[]).includes(o.kind)||o.kind==='model')||!vector(o.position)||!vector(o.rotation)||!vector(o.scale,true)||(o.groupId!==undefined&&typeof o.groupId!=='string')||typeof o.visible!=='boolean'||typeof o.locked!=='boolean'||!color(o.color))return fail('Um objeto tem propriedades inválidas.');if(o.kind==='model'&&(typeof o.assetId!=='string'||!assetIds.has(o.assetId)))return fail('O projeto está incompleto: falta o arquivo de um modelo 3D.');return o as Entity;});
 if(new Set(objects.map(o=>o.id)).size!==objects.length)return fail('O projeto contém objetos com identificadores repetidos.');
 if(groups){const known=new Set(groups.map(g=>g.id));objects=objects.map(o=>{const {groupId,...rest}=o;return groupId&&known.has(groupId)?{groupId,...rest}:rest})}
 else objects=objects.map(o=>{const {groupId,...rest}=o;return rest});
 const s=raw.settings;if(!object(s)||!Number.isFinite(s.size)||Number(s.size)<10||Number(s.size)>100||!Number.isFinite(s.gridSize)||Number(s.gridSize)<0.25||Number(s.gridSize)>5||typeof s.grid!=='boolean'||typeof s.snap!=='boolean'||(s.guides!==undefined&&typeof s.guides!=='boolean')||!['dawn','day','dusk','night'].includes(String(s.atmosphere))||!color(s.background))return fail('As configurações do mapa são inválidas.');
 const camera=raw.camera;if(camera!==undefined&&(!object(camera)||!vector(camera.position)||!vector(camera.target)))return fail('A posição da câmera é inválida.');
 return {schemaVersion:1,id:raw.id,name:raw.name,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date().toISOString(),objects,assets,settings:s as Project['settings'],...(groups?{groups}:{}),...(camera?{camera:camera as Project['camera']}:{})};
}
export function exampleProject():Project{
 const p=emptyProject();p.name='Acampamento nas ruínas';p.settings.grid=false;p.settings.atmosphere='dusk';
 function add(kind:Kind,name:string,x:number,z:number,scale=1,rot=0,y=0){const e=makeEntity(kind,name,[x,y,z]);e.scale=[scale,scale,scale];e.rotation=[0,rot,0];p.objects.push(e);}
 // A handmade woodland clearing. All scenery is generated in this project.
 const trees:[number,number,number][]=[[-10,-8,1.35],[-7,-10,1.6],[-3,-11,1.2],[2,-10,1.5],[7,-10,1.25],[10,-7,1.5],[11,-3,1.1],[-11,-3,1.5],[-10,2,1.2],[-8,6,1.3],[10,4,1.35],[7,8,1.1],[-4,10,.95],[11,9,1.3]];
 trees.forEach(([x,z,s],i)=>add(i%3?'pine':'oak',`Árvore ${i+1}`,x,z,s,i*.6));
 [[-8,-5],[-6,8],[9,-5],[9,7],[-10,7],[5,-10],[-4,-8]].forEach(([x,z],i)=>add('rock',`Rocha ${i+1}`,x,z,.8+i%3*.25,i));
 for(let i=0;i<6;i++)add('floor','Caminho de pedra',.3*Math.sin(i),5-i*2.3,1,0,-.05);
 add('arch','Arco das ruínas',0,-5.8,1.3);add('wall','Muralha oeste',-4,-6,1.1);add('wall','Muralha leste',4,-6,1.1);
 add('column','Coluna antiga',-5,-3,.9);add('column','Coluna antiga',5,-4,.7);
 add('tent','Tenda do explorador',-4.5,1.3,1.25,.55);add('tent','Tenda de suprimentos',4,1.8,1.1,-.6);
 add('campfire','Fogueira do acampamento',0,1,1.15);add('crate','Caixa de provisões',-5,4,.8,.1);add('crate','Equipamentos',-6.2,3,.65,-.1);
 add('barrel','Barril de água',5,4,.85);add('barrel','Barril de suprimentos',6,3.7,.8);add('well','Poço esquecido',6,-1,1.1);
 // Camada de ambientação: vegetação rasteira, água, luzes e detalhes das ruínas.
 add('birch','Bétula nova',-8.4,-7,1.1,.4);add('birch','Bétula jovem',7.6,-8.4,.95,-.7);add('birch','Bétula do caminho',-11.5,4.5,1.2,1.1);
 add('deadtree','Árvore seca',11.6,1.6,1.05,.3);add('deadtree','Tronco retorcido',-12.2,-.5,.9,1.9);
 add('bush','Arbusto',-6.5,-3.5,.9,.2);add('bush','Arbusto',7.8,2.6,1,-.4);add('bush','Arbusto',-2.6,7.4,.85,.8);add('bush','Arbusto',3.4,-7.2,.8,1.3);
 add('mushrooms','Cogumelos',-7.8,-9.2,.9,0);add('mushrooms','Cogumelos',5.2,6.6,.8,.9);
 add('log','Tronco caído',-9.4,8.2,1,.6);add('log','Tronco caído',9.6,-6.4,.85,-.5);
 add('crystal','Cristais',-11.8,9.4,.9,0);
 add('pond','Lagoa',8.6,-8.8,1.05,0);
 add('bridge','Ponte de madeira',-6.2,6.4,.75,.35);
 add('fence','Cerca do acampamento',-1.8,5.6,.8,.15);add('fence','Cerca do acampamento',2.2,5.9,.8,-.1);
 add('lantern','Lanterna da tenda',-3.2,2.6,.95,0);add('lantern','Lanterna do acampamento',2.8,2.4,.95,0);
 add('banner','Estandarte da expedição',1.6,4.8,.9,-.4);
 add('statue','Estátua esquecida',-6.4,-5.2,.9,.5);add('chest','Baú do acampamento',-5.4,2.2,.8,.3);
 add('cart','Carrinho de suprimentos',6.6,5.2,.8,-.75);add('stairs','Escadaria da ruína',0,-3.4,.95,0);
 add('tower','Torre caída',-9.2,-1.2,1.05,.2);add('shrine','Santuário antigo',0,-8.6,1,0);
 p.camera={position:[23,20,27],target:[0,0,0]};return p;
}

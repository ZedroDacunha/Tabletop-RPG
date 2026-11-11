export type Vec3 = [number, number, number];
export const KINDS = ['pine','oak','rock','wall','arch','floor','tent','campfire','crate','barrel','well','column','cube','sphere','cylinder'] as const;
export type Kind = typeof KINDS[number];
export type Entity = { id:string; kind:Kind|'model'; assetId?:string; name:string; position:Vec3; rotation:Vec3; scale:Vec3; visible:boolean; locked:boolean; color:string };
export type Asset = { id:string; name:string; data:string; bytes:number };
export type Project = { schemaVersion:1; id:string; name:string; updatedAt:string; objects:Entity[]; assets:Asset[]; settings:{ size:number; gridSize:number; grid:boolean; snap:boolean; atmosphere:'day'|'dusk'|'night'; background:string }; camera?:{position:Vec3;target:Vec3} };
export const uid = () => crypto.randomUUID();
export const MAX_PROJECT_BYTES=100*1024*1024;
export function emptyProject():Project {return {schemaVersion:1,id:uid(),name:'Meu novo mundo',updatedAt:new Date().toISOString(),objects:[],assets:[],settings:{size:30,gridSize:1,grid:true,snap:true,atmosphere:'day',background:'#202a28'}};}
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
 const objects:Entity[]=raw.objects.map(o=>{if(!object(o)||typeof o.id!=='string'||typeof o.name!=='string'||o.name.length>120||!((KINDS as readonly unknown[]).includes(o.kind)||o.kind==='model')||!vector(o.position)||!vector(o.rotation)||!vector(o.scale,true)||typeof o.visible!=='boolean'||typeof o.locked!=='boolean'||!color(o.color))return fail('Um objeto tem propriedades inválidas.');if(o.kind==='model'&&(typeof o.assetId!=='string'||!assetIds.has(o.assetId)))return fail('O projeto está incompleto: falta o arquivo de um modelo 3D.');return o as Entity;});
 if(new Set(objects.map(o=>o.id)).size!==objects.length)return fail('O projeto contém objetos com identificadores repetidos.');
 const s=raw.settings;if(!object(s)||!Number.isFinite(s.size)||Number(s.size)<10||Number(s.size)>100||!Number.isFinite(s.gridSize)||Number(s.gridSize)<0.25||Number(s.gridSize)>5||typeof s.grid!=='boolean'||typeof s.snap!=='boolean'||!['day','dusk','night'].includes(String(s.atmosphere))||!color(s.background))return fail('As configurações do mapa são inválidas.');
 const camera=raw.camera;if(camera!==undefined&&(!object(camera)||!vector(camera.position)||!vector(camera.target)))return fail('A posição da câmera é inválida.');
 return {schemaVersion:1,id:raw.id,name:raw.name,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date().toISOString(),objects,assets,settings:s as Project['settings'],...(camera?{camera:camera as Project['camera']}:{})};
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
 p.camera={position:[23,20,27],target:[0,0,0]};return p;
}

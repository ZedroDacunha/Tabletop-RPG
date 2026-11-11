import {validateProject,type Asset,type Entity,type Group,type Project,type Vec3} from './project';

export const CLIP_FORMAT='trecho';
export type Clip={
 format:typeof CLIP_FORMAT;version:1;name:string;source:string;
 objects:Entity[];groups:Group[];assets:Asset[];
};
export function buildClip(project:Project, ids:string[], name:string):Clip{
 const inside=new Set(ids);
 const picked=project.objects.filter(o=>inside.has(o.id));
 const groupIds=new Set(picked.map(o=>o.groupId).filter((id):id is string=>Boolean(id)));
 const assetIds=new Set(picked.map(o=>o.assetId).filter((id):id is string=>Boolean(id)));
 return {
  format:CLIP_FORMAT,version:1,name:name.trim().slice(0,60)||'Trecho',source:project.name,
  objects:picked.map(o=>({...o,locked:false})),
  groups:(project.groups??[]).filter(g=>groupIds.has(g.id)),
  assets:project.assets.filter(a=>assetIds.has(a.id)),
 };
}
export function pasteClip(clip:Clip, origin:Vec3, id:()=>string):{objects:Entity[];groups:Group[]}{
 const groupMap=new Map<string,string>();
 const groups=clip.groups.map(g=>{const id2=id();groupMap.set(g.id,id2);return {id:id2,name:g.name}});
 const objects=clip.objects.map(o=>{
  const groupId=o.groupId?groupMap.get(o.groupId):undefined;
  const {groupId:_,...rest}=o;
  return {
   ...rest,id:id(),
   position:[o.position[0]+origin[0],o.position[1]+origin[1],o.position[2]+origin[2]] as Vec3,
   locked:false,
   ...(groupId?{groupId}:{}),
  } as Entity;
 });
 return {objects,groups};
}
export function clipCenter(clip:Clip):Vec3{
 if(!clip.objects.length)return [0,0,0];
 const sum=clip.objects.reduce<Vec3>((acc,o)=>[acc[0]+o.position[0],acc[1]+o.position[1],acc[2]+o.position[2]],[0,0,0]);
 return [sum[0]/clip.objects.length,sum[1]/clip.objects.length,sum[2]/clip.objects.length];
}
export const MAX_CLIP_BYTES=100*1024*1024;
function object(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
export function validateClip(raw:unknown):Clip{
 const fail=(message:string):never=>{throw new Error(message)};
 if(!object(raw)||raw.format!==CLIP_FORMAT||raw.version!==1)return fail('Esse arquivo não é um trecho do Tabletop RPG.');
 if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>60)return fail('O trecho não tem um nome válido.');
 if(!Array.isArray(raw.objects)||!raw.objects.length||raw.objects.length>1500)return fail('O trecho deve ter entre 1 e 1.500 peças.');
 const project=validateProject({
  schemaVersion:1,id:'trecho',name:'Trecho',
  updatedAt:new Date().toISOString(),
  objects:raw.objects,
  assets:Array.isArray(raw.assets)?raw.assets:[],
  groups:Array.isArray(raw.groups)?raw.groups:[],
  settings:{size:30,gridSize:1,grid:true,snap:true,atmosphere:'day',background:'#202a28'},
 });
 return {format:CLIP_FORMAT,version:1,name:raw.name.trim(),source:typeof raw.source==='string'?raw.source.slice(0,80):'',objects:project.objects,groups:project.groups??[],assets:project.assets};
}

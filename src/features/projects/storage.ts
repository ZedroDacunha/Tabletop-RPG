import {uid,validateProject,type Project} from './project';
import {cleanMapName,copyName,newestFirst,summarise,type ProjectSummary} from './library';
import type {Clip} from './clip';
import {cleanSnippetName,summariseClip,type SnippetSummary} from './snippets';

const DB='tabletop-rpg',VERSION=3,LEGACY_KEY='current';
const STORES=['projects','index','meta','snippets','snippetIndex'];
const database=()=>new Promise<IDBDatabase>((resolve,reject)=>{
 const request=indexedDB.open(DB,VERSION);
 request.onupgradeneeded=()=>{const db=request.result;for(const store of STORES)if(!db.objectStoreNames.contains(store))db.createObjectStore(store);};
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error);
});
function readKey<T>(db:IDBDatabase,store:string,key:IDBValidKey):Promise<T|undefined>{
 return new Promise((resolve,reject)=>{const request=db.transaction(store,'readonly').objectStore(store).get(key);request.onsuccess=()=>resolve(request.result as T|undefined);request.onerror=()=>reject(request.error);});
}
function write(db:IDBDatabase,stores:string[],run:(tx:IDBTransaction)=>void):Promise<void>{
 return new Promise((resolve,reject)=>{const tx=db.transaction(stores,'readwrite');try{run(tx)}catch(e){reject(e);return}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
}
function readIndex(db:IDBDatabase):Promise<ProjectSummary[]>{
 return new Promise((resolve,reject)=>{const request=db.transaction('index','readonly').objectStore('index').getAll();request.onsuccess=()=>resolve((request.result??[]) as ProjectSummary[]);request.onerror=()=>reject(request.error);});
}
export async function listProjects():Promise<ProjectSummary[]>{
 const db=await database();
 try{
  const summaries=await readIndex(db);
  return newestFirst(summaries.filter(s=>s&&typeof s.id==='string'));
 }finally{db.close()}
}
export async function loadProject(id?:string):Promise<Project|null>{
 const db=await database();
 try{
  const stored=id??await readKey<string>(db,'meta','last');
  const raw=stored?await readKey<unknown>(db,'projects',stored):undefined;
  if(raw!==undefined)return validateProject(raw);
  const legacy=await readKey<unknown>(db,'projects',LEGACY_KEY);
  if(legacy===undefined)return null;
  const project=validateProject(legacy);
  await write(db,['projects'],tx=>tx.objectStore('projects').delete(LEGACY_KEY));
  await saveProject(project);
  return project;
 }finally{db.close()}
}
function store(db:IDBDatabase, project:Project, makeCurrent:boolean):Promise<void>{
 return write(db,makeCurrent?['projects','index','meta']:['projects','index'],tx=>{tx.objectStore('projects').put(project,project.id);tx.objectStore('index').put(summarise(project),project.id);if(makeCurrent)tx.objectStore('meta').put(project.id,'last');});
}
export async function saveProject(project:Project):Promise<void>{
 const db=await database();
 try{
  await store(db,project,true);
 }finally{db.close()}
}
export async function duplicateProject(id:string):Promise<Project|null>{
 const db=await database();
 try{
  const raw=await readKey<unknown>(db,'projects',id);
  if(raw===undefined)return null;
  const original=validateProject(raw);
  const copy:Project={...original,id:uid(),name:copyName(original.name,(await readIndex(db)).map(s=>s.name)),updatedAt:new Date().toISOString()};
  await store(db,copy,false);
  return copy;
 }finally{db.close()}
}
export async function renameProject(id:string,name:string):Promise<ProjectSummary|null>{
 const db=await database();
 try{
  const raw=await readKey<unknown>(db,'projects',id);
  if(raw===undefined)return null;
  const original=validateProject(raw);
  const clean=cleanMapName(name,original.name);
  if(clean===original.name)return summarise(original);
  const next:Project={...original,name:clean};
  await store(db,next,false);
  return summarise(next);
 }finally{db.close()}
}
export async function deleteProject(id:string):Promise<void>{
 const db=await database();
 try{
  await write(db,['projects','index','meta'],tx=>{tx.objectStore('projects').delete(id);tx.objectStore('index').delete(id);});
  const last=await readKey<string>(db,'meta','last');
  if(last===id){
   const rest=await listProjects();
   await write(db,['meta'],tx=>{if(rest.length)tx.objectStore('meta').put(rest[0].id,'last');else tx.objectStore('meta').delete('last')});
  }
 }finally{db.close()}
}
export function downloadFile(data:Blob,name:string){const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export function exportProject(p:Project){downloadFile(new Blob([JSON.stringify(p)],{type:'application/json'}),`${p.name.replace(/[^\p{L}\p{N}_-]/gu,'_')||'mapa'}.tabletop`);}

export type SnippetRecord={id:string;name:string;createdAt:string;clip:Clip};

export async function listSnippets():Promise<SnippetSummary[]>{
 const db=await database();
 try{
  const summaries=await new Promise<SnippetSummary[]>((resolve,reject)=>{const request=db.transaction('snippetIndex','readonly').objectStore('snippetIndex').getAll();request.onsuccess=()=>resolve((request.result??[]) as SnippetSummary[]);request.onerror=()=>reject(request.error);});
  return summaries.filter(s=>s&&typeof s.id==='string').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 }finally{db.close()}
}
export async function saveSnippet(record:SnippetRecord):Promise<void>{
 const db=await database();
 try{
  await write(db,['snippets','snippetIndex'],tx=>{tx.objectStore('snippets').put({...record,name:cleanSnippetName(record.name)},record.id);tx.objectStore('snippetIndex').put({...summariseClip(record),name:cleanSnippetName(record.name)},record.id);});
 }finally{db.close()}
}
export async function openSnippet(id:string):Promise<Clip|null>{
 const db=await database();
 try{
  const record=await readKey<SnippetRecord>(db,'snippets',id);
  if(!record||!record.clip)return null;
  return record.clip;
 }finally{db.close()}
}
export async function renameSnippet(id:string,name:string):Promise<void>{
 const clean=cleanSnippetName(name);
 const db=await database();
 try{
  const record=await readKey<SnippetRecord>(db,'snippets',id);
  if(!record)return;
  await write(db,['snippets','snippetIndex'],tx=>{
   tx.objectStore('snippets').put({...record,name:clean,clip:{...record.clip,name:clean}},id);
   tx.objectStore('snippetIndex').put({...summariseClip({...record,name:clean}),name:clean},id);
  });
 }finally{db.close()}
}
export async function deleteSnippet(id:string):Promise<void>{
 const db=await database();
 try{
  await write(db,['snippets','snippetIndex'],tx=>{tx.objectStore('snippets').delete(id);tx.objectStore('snippetIndex').delete(id);});
 }finally{db.close()}
}

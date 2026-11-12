import type {Clip} from './clip';
import {MAX_DOTS,type ProjectDot} from './library';

export type SnippetSummary={
 id:string;name:string;createdAt:string;objects:number;source:string;dots:ProjectDot[];
};
export const MAX_SNIPPETS=20;
export const SNIPPET_NAME_MAX=60;
export const SNIPPET_PREFIX='Trecho';

const round=(value:number)=>Math.round(value*100)/100||0;
export function summariseClip(record:{id:string;name:string;createdAt:string;clip:Clip}):SnippetSummary{
 const dots=record.clip.objects.filter(o=>o.visible).slice(0,MAX_DOTS).map(o=>({x:round(o.position[0]),z:round(o.position[2]),kind:o.kind}));
 return {
  id:record.id,
  name:record.name.trim().slice(0,SNIPPET_NAME_MAX)||SNIPPET_PREFIX,
  createdAt:record.createdAt,
  objects:record.clip.objects.length,
  source:record.clip.source.slice(0,80),
  dots,
 };
}

export function snippetName(taken:Iterable<string>):string{
 const used=new Set(Array.from(taken,n=>n.trim().toLocaleLowerCase('pt-BR')));
 for(let n=1;n<=9999;n++){
  const candidate=`${SNIPPET_PREFIX} ${n}`;
  if(!used.has(candidate.toLocaleLowerCase('pt-BR')))return candidate;
 }
 return `${SNIPPET_PREFIX} novo`.slice(0,SNIPPET_NAME_MAX);
}

export function cleanSnippetName(name:string):string{
 return name.trim().replace(/\s+/g,' ').slice(0,SNIPPET_NAME_MAX)||SNIPPET_PREFIX;
}

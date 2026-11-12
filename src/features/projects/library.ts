import type {Project} from './project';

export type ProjectDot={x:number;z:number;kind:string};
export type ProjectSummary={
 id:string;name:string;updatedAt:string;objects:number;size:number;
 background:string;atmosphere:Project['settings']['atmosphere'];dots:ProjectDot[];
};
export const MAX_DOTS=150;

export function summarise(project:Project):ProjectSummary{
 const dots=project.objects.filter(o=>o.visible).slice(0,MAX_DOTS).map(o=>({x:Math.round(o.position[0]*100)/100,z:Math.round(o.position[2]*100)/100,kind:o.kind}));
 return {id:project.id,name:project.name,updatedAt:project.updatedAt,objects:project.objects.length,size:project.settings.size,background:project.settings.background,atmosphere:project.settings.atmosphere,dots};
}
export function newestFirst(list:ProjectSummary[]):ProjectSummary[]{
 return [...list].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export function timeAgo(iso:string,now=Date.now()):string{
 const then=Date.parse(iso);
 if(!Number.isFinite(then))return 'agora mesmo';
 const minutes=Math.floor(Math.max(0,now-then)/60000);
 if(minutes<1)return 'agora mesmo';
 if(minutes<60)return `há ${minutes} min`;
 const hours=Math.floor(minutes/60);
 if(hours<24)return `há ${hours} h`;
 const days=Math.floor(hours/24);
 if(days===1)return 'ontem';
 if(days<30)return `há ${days} dias`;
 const date=new Date(then);
 return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
}

export const NAME_MAX=80;
export const MAP_NAME_MAX=120;
export function cleanMapName(name:string, fallback='Mapa'):string{
 const clean=name.replace(/\s+/g,' ').trim().slice(0,MAP_NAME_MAX).trim();
 return clean||fallback||'Mapa';
}

export function copyName(name:string, taken:Iterable<string>):string{
 const used=new Set(Array.from(taken,n=>n.trim().toLocaleLowerCase('pt-BR')));
 const cleaned=(name.trim()||'Mapa').replace(/\s*\(cópia(?:\s+\d+)?\)$/i,'').trim()||'Mapa';
 for(let n=1;n<1000;n++){
  const suffix=n===1?' (cópia)':` (cópia ${n})`;
  const candidate=cleaned.slice(0,Math.max(1,NAME_MAX-suffix.length)).trimEnd()+suffix;
  if(!used.has(candidate.toLocaleLowerCase('pt-BR')))return candidate;
 }
 return cleaned.slice(0,NAME_MAX);
}

export type MapSort='recentes'|'nome'|'tamanho';
export const MAP_SORTS:[MapSort,string][]=[['recentes','Mais recentes'],['nome','Nome (A–Z)'],['tamanho','Tamanho do mapa']];
function plain(value:string):string{
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
}
export function filterProjects(list:ProjectSummary[],query:string):ProjectSummary[]{
 const term=plain(query.trim());
 if(!term)return list;
 return list.filter(project=>plain(project.name).includes(term));
}
export function sortProjects(list:ProjectSummary[],mode:MapSort):ProjectSummary[]{
 const byName=(a:ProjectSummary,b:ProjectSummary)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'});
 if(mode==='nome')return [...list].sort(byName);
 if(mode==='tamanho')return [...list].sort((a,b)=>b.size-a.size||byName(a,b));
 return [...list].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}

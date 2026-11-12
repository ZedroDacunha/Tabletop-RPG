import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,makeEntity} from './project';
import {MAX_DOTS,MAP_SORTS,NAME_MAX,copyName,filterProjects,newestFirst,sortProjects,summarise,timeAgo} from './library';

test('the summary keeps the map identity and a small preview of the pieces',()=>{
 const p=emptyProject();p.name='Bosque';p.objects=[makeEntity('pine','A',[3,0,-4]),{...makeEntity('rock','B'),visible:false}];
 const s=summarise(p);
 assert.equal(s.id,p.id);
 assert.equal(s.name,'Bosque');
 assert.equal(s.objects,2);
 assert.equal(s.size,p.settings.size);
 assert.deepEqual(s.dots,[{x:3,z:-4,kind:'pine'}]);
 const crowded=emptyProject();
 crowded.objects=Array.from({length:400},()=>makeEntity('cube','C'));
 assert.equal(summarise(crowded).dots.length,MAX_DOTS);
 assert.equal(summarise(crowded).objects,400);
});

test('maps are listed newest first',()=>{
 const old={...summarise(emptyProject()),id:'a',updatedAt:'2026-01-01T10:00:00.000Z'};
 const recent={...summarise(emptyProject()),id:'b',updatedAt:'2026-03-01T10:00:00.000Z'};
 const middle={...summarise(emptyProject()),id:'c',updatedAt:'2026-02-01T10:00:00.000Z'};
 assert.deepEqual(newestFirst([old,recent,middle]).map(m=>m.id),['b','c','a']);
});

test('the saved time is described in words',()=>{
 const now=Date.parse('2026-11-11T12:00:00.000Z');
 assert.equal(timeAgo('2026-11-11T11:59:40.000Z',now),'agora mesmo');
 assert.equal(timeAgo('2026-11-11T11:42:00.000Z',now),'há 18 min');
 assert.equal(timeAgo('2026-11-11T08:30:00.000Z',now),'há 3 h');
 assert.equal(timeAgo('2026-11-10T09:00:00.000Z',now),'ontem');
 assert.equal(timeAgo('2026-11-06T12:00:00.000Z',now),'há 5 dias');
 assert.equal(timeAgo('2026-06-02T12:00:00.000Z',now),'02/06/2026');
 assert.equal(timeAgo('nao-e-data',now),'agora mesmo');
});

test('a copy gets a free name without touching the original',()=>{
 assert.equal(copyName('Bosque',[]),'Bosque (cópia)');
 assert.equal(copyName('Bosque',['Bosque (cópia)']),'Bosque (cópia 2)');
 assert.equal(copyName('Bosque',['Bosque (cópia)','Bosque (cópia 2)']),'Bosque (cópia 3)');
 assert.equal(copyName('Bosque (cópia)',['Bosque (cópia)']),'Bosque (cópia 2)');
 assert.equal(copyName('Bosque',['bosque (CÓPIA)']),'Bosque (cópia 2)');
 assert.equal(copyName('Bosque',['Outro mapa']),'Bosque (cópia)');
 assert.equal(copyName('   ',[]),'Mapa (cópia)');
 const long=copyName('M'.repeat(120),[]);
 assert.equal(long.length,NAME_MAX);
 assert.ok(long.endsWith(' (cópia)'));
 assert.ok(copyName('N'.repeat(NAME_MAX),['N'.repeat(NAME_MAX)+' (cópia)']).length<=NAME_MAX);
});

function summary(name:string,size:number,updatedAt:string){
 const p=emptyProject();p.name=name;p.settings.size=size;
 return {...summarise(p),id:name,updatedAt};
}
const maps=[summary('Ruína do portão',50,'2026-03-01T10:00:00.000Z'),summary('bosque',30,'2026-05-01T10:00:00.000Z'),summary('Acampamento',20,'2026-01-01T10:00:00.000Z')];

test('the map search ignores case, accents and extra spaces',()=>{
 assert.equal(filterProjects(maps,'').length,3);
 assert.equal(filterProjects(maps,'   ').length,3);
 assert.deepEqual(filterProjects(maps,'bos').map(m=>m.name),['bosque']);
 assert.deepEqual(filterProjects(maps,'BOSQUE').map(m=>m.name),['bosque']);
 assert.deepEqual(filterProjects(maps,'ruina').map(m=>m.name),['Ruína do portão'],'busca sem acento acha o nome acentuado');
 assert.deepEqual(filterProjects(maps,'  portao  ').map(m=>m.name),['Ruína do portão']);
 assert.deepEqual(filterProjects(maps,'ruína').map(m=>m.name),['Ruína do portão'],'acento digitado também funciona');
 assert.deepEqual(filterProjects(maps,'camp').map(m=>m.name),['Acampamento'],'busca no meio da palavra');
 assert.deepEqual(filterProjects(maps,'nada aqui').map(m=>m.name),[]);
});

test('the library sorts by date, name and map size',()=>{
 assert.deepEqual(sortProjects(maps,'recentes').map(m=>m.name),['bosque','Ruína do portão','Acampamento']);
 assert.deepEqual(sortProjects(maps,'nome').map(m=>m.name),['Acampamento','bosque','Ruína do portão']);
 assert.deepEqual(sortProjects(maps,'tamanho').map(m=>m.size),[50,30,20]);
 const same=[summary('Zona',30,'2026-01-01T10:00:00.000Z'),summary('Área',30,'2026-01-01T10:00:00.000Z'),summary('base',30,'2026-01-01T10:00:00.000Z')];
 assert.deepEqual(sortProjects(same,'tamanho').map(m=>m.name),['Área','base','Zona'],'empate no tamanho cai no nome');
 const original=maps.map(m=>m.name);
 sortProjects(maps,'nome');
 assert.deepEqual(maps.map(m=>m.name),original,'a lista original não é reordenada no lugar');
 assert.deepEqual(MAP_SORTS.map(([id])=>id),['recentes','nome','tamanho']);
});

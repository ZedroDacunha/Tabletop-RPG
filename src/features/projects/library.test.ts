import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,makeEntity} from './project';
import {MAX_DOTS,NAME_MAX,copyName,newestFirst,summarise,timeAgo} from './library';

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

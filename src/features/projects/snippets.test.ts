import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,makeEntity} from './project';
import {buildClip} from './clip';
import {MAX_SNIPPETS,SNIPPET_NAME_MAX,cleanSnippetName,summariseClip,snippetName} from './snippets';

function record(ids:number, name='Trecho 1', source='Bosque'){
 const p=emptyProject();p.name=source;
 p.objects=Array.from({length:ids},(_,i)=>makeEntity('pine',`P${i}`,[i,0,-i]));
 return {id:'s1',name,createdAt:'2026-11-11T10:00:00.000Z',clip:buildClip(p,p.objects.map(o=>o.id),name)};
}

test('the snippet summary carries the count, origin and a small preview',()=>{
 const s=summariseClip(record(3));
 assert.equal(s.id,'s1');
 assert.equal(s.name,'Trecho 1');
 assert.equal(s.objects,3);
 assert.equal(s.source,'Bosque');
 assert.equal(s.createdAt,'2026-11-11T10:00:00.000Z');
 assert.deepEqual(s.dots,[{x:0,z:0,kind:'pine'},{x:1,z:-1,kind:'pine'},{x:2,z:-2,kind:'pine'}]);
 const crowded=record(200);
 assert.equal(summariseClip(crowded).dots.length,150);
 assert.equal(summariseClip(crowded).objects,200);
});

test('hidden pieces stay out of the preview but count in the total',()=>{
 const r=record(2);
 r.clip.objects[1]={...r.clip.objects[1],visible:false};
 const s=summariseClip(r);
 assert.equal(s.objects,2);
 assert.equal(s.dots.length,1);
});

test('a saved snippet gets the first free default name',()=>{
 assert.equal(snippetName([]),'Trecho 1');
 assert.equal(snippetName(['Trecho 1']),'Trecho 2');
 assert.equal(snippetName(['Trecho 1','Trecho 3']),'Trecho 2');
 assert.equal(snippetName(['trecho 1','TRECHO 2']),'Trecho 3');
 assert.equal(snippetName(['Bosque']),'Trecho 1');
 assert.ok(snippetName(Array.from({length:9999},(_,i)=>`Trecho ${i+1}`)).length<=SNIPPET_NAME_MAX);
});

test('snippet names are trimmed, shortened and never empty',()=>{
 assert.equal(cleanSnippetName('   Ruína   do   portão '),'Ruína do portão');
 assert.equal(cleanSnippetName(''),'Trecho');
 assert.equal(cleanSnippetName('   '),'Trecho');
 assert.equal(cleanSnippetName('T'.repeat(120)).length,SNIPPET_NAME_MAX);
 assert.equal(MAX_SNIPPETS,20);
});

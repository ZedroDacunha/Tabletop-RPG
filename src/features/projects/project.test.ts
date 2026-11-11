import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,exampleProject,makeEntity,nudgeEntity,selectionCenter,toggleSelection,validateProject,KINDS} from './project';
import {catalog} from '../assets/catalog';

test('example survives a complete JSON export/import without losing transforms',()=>{
 const p=exampleProject();const restored=validateProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored,p);assert.equal(restored.objects.length,67);
 assert.equal(new Set(restored.objects.map(o=>o.id)).size,67);
});
test('embedded models remain portable with their entity references',()=>{
 const p=emptyProject();p.assets=[{id:'model-a',name:'Teste',data:'data:model/gltf-binary;base64,Z2xURg==',bytes:4}];
 p.objects=[makeEntity('model','Teste',[2,0,1],'model-a')];
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
 p.assets=[];assert.throws(()=>validateProject(p),/falta o arquivo/);
});
test('rejects unsupported schemas and duplicated object IDs',()=>{
 assert.throws(()=>validateProject({schemaVersion:2}),/Formato/);
 const p=emptyProject();const o=makeEntity('cube','Cubo');p.objects=[o,{...o}];
 assert.throws(()=>validateProject(p),/repetidos/);
});
test('rejects unsafe transforms, invalid camera and grid settings',()=>{
 for(const invalid of [NaN,Infinity,-Infinity,5001]){const p=emptyProject();p.objects=[makeEntity('cube','Cubo',[invalid,0,0])];assert.throws(()=>validateProject(p),/propriedades/)}
 const p=emptyProject();p.objects=[makeEntity('cube','Cubo')];p.objects[0].scale=[0,1,1];assert.throws(()=>validateProject(p),/propriedades/);
 const q=emptyProject();q.settings.gridSize=0;assert.throws(()=>validateProject(q),/configurações/);
 const r=emptyProject();r.camera={position:[NaN,0,0],target:[0,0,0]};assert.throws(()=>validateProject(r),/câmera/);
});
test('rejects remote models, invalid kinds and oversize scenes',()=>{
 const p=emptyProject();p.assets=[{id:'a',name:'a',data:'https://example.com/asset.glb',bytes:10}];assert.throws(()=>validateProject(p),/modelo/);
 const q=emptyProject();q.objects=Array.from({length:1501},()=>makeEntity('cube','Cubo'));assert.throws(()=>validateProject(q),/limite/);
 const r=emptyProject();r.objects=[makeEntity('cube','Cubo')];const raw=JSON.parse(JSON.stringify(r));raw.objects[0].kind='script';assert.throws(()=>validateProject(raw),/propriedades/);
});

test('todo tipo de peça tem um item de catálogo único',()=>{
 const kinds=catalog.map(item=>item.kind);
 assert.equal(new Set(kinds).size,catalog.length);
 for(const kind of KINDS)assert.ok(kinds.includes(kind),`falta catálogo para ${kind}`);
 assert.ok(catalog.every(item=>item.name.length>0&&item.detail.length>0&&/^#[0-9a-f]{6}$/i.test(item.color)));
});
test('as quatro atmosferas são aceitas na validação',()=>{
 for(const atmosphere of ['dawn','day','dusk','night'] as const){
  const p=emptyProject();p.settings.atmosphere=atmosphere;
  assert.equal(validateProject(JSON.parse(JSON.stringify(p))).settings.atmosphere,atmosphere);
 }
});

test('nudge desloca e gira sem mutar o objeto e respeita os limites',()=>{
 const entity=makeEntity('cube','Cubo',[0,0,0]);
 const moved=nudgeEntity(entity,{x:2,z:-3});
 assert.deepEqual(moved.position,[2,0,-3]);
 assert.deepEqual(entity.position,[0,0,0]);
 assert.deepEqual(nudgeEntity(entity,{rotate:Math.PI/12}).rotation,[0,Math.PI/12,0]);
 assert.deepEqual(nudgeEntity(makeEntity('cube','Cubo',[14,0,-14]),{x:10,z:-10},15).position,[15,0,-15]);
});
test('selection helpers toggle additively and average the group centre',()=>{
 assert.deepEqual(toggleSelection([],'a',false),['a']);
 assert.deepEqual(toggleSelection(['a'],'a',true),[]);
 assert.deepEqual(toggleSelection(['a'],'b',true),['a','b']);
 assert.deepEqual(toggleSelection(['a','b'],'b',false),['b']);
 assert.deepEqual(selectionCenter([]),[0,0,0]);
 const a=makeEntity('cube','A',[2,3,4]),b=makeEntity('cube','B',[4,1,0]);
 assert.deepEqual(selectionCenter([a,b]),[3,2,2]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,exampleProject,makeEntity,makeGroup,assignGroup,pruneGroups,withGroups,nudgeEntity,selectionCenter,toggleSelection,nearestNeighbour,alignToNeighbours,validateProject,KINDS} from './project';
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

test('groups travel with the project and clean themselves up',()=>{
 const p=emptyProject();const group=makeGroup('  Bosque antigo  ');
 assert.equal(group.name,'Bosque antigo');
 p.groups=[group];p.objects=[makeEntity('pine','A'),makeEntity('pine','B')];
 p.objects=assignGroup(p.objects,new Set([p.objects[0].id]),group.id);
 const restored=validateProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.groups,[group]);
 assert.equal(restored.objects[0].groupId,group.id);
 assert.equal(restored.objects[1].groupId,undefined);
 assert.deepEqual(pruneGroups(restored.groups,restored.objects),[group]);
 const cleared=assignGroup(restored.objects,new Set(restored.objects.map(o=>o.id)));
 assert.equal(cleared.some(o=>o.groupId!==undefined),false);
 assert.equal(pruneGroups(restored.groups,cleared),undefined);
 assert.equal('groups' in withGroups(restored,undefined),false);
});

test('rejects malformed groups and drops references to missing ones',()=>{
 const p=emptyProject();p.groups=[makeGroup('Ruínas')];p.objects=[makeEntity('rock','Pedra')];
 const dangling=JSON.parse(JSON.stringify(p));dangling.objects[0].groupId='nao-existe';
 assert.equal(validateProject(dangling).objects[0].groupId,undefined);
 const duplicated=JSON.parse(JSON.stringify(p));duplicated.groups=[p.groups[0],{...p.groups[0]}];
 assert.throws(()=>validateProject(duplicated),/grupos com identificadores/);
 assert.throws(()=>validateProject({...JSON.parse(JSON.stringify(p)),groups:[{id:'a',name:'   '}]}),/grupo do mapa/);
});

test('the ruler finds the closest visible neighbour and ignores the piece itself',()=>{
 const a=makeEntity('cube','A',[0,0,0]),b=makeEntity('cube','B',[3,0,0]),c=makeEntity('cube','C',[0,0,1.5]);
 const near=nearestNeighbour(a,[a,b,c]);
 assert.equal(near?.entity.id,c.id);
 assert.equal(near?.distance,1.5);
 assert.equal(nearestNeighbour(a,[a,{...b,visible:false},b])?.entity.id,b.id);
 assert.equal(nearestNeighbour(a,[a]),null);
});

test('alignment snaps only the axes that are close to another piece',()=>{
 const a=makeEntity('cube','A',[0,0,0]);
 const b=makeEntity('cube','B',[5,0,3]);
 const near=alignToNeighbours([4.6,0,3.9],a,[a,b]);
 assert.deepEqual(near.position,[5,0,3.9]);
 assert.deepEqual(near.aligned,['B']);
 // dois vizinhos diferentes podem fornecer cada eixo
 const c=makeEntity('cube','C',[0,0,3]);
 const far=makeEntity('cube','F',[5,0,9]);
 const crossed=alignToNeighbours([4.9,0,3.2],a,[a,far,c]);
 assert.deepEqual(crossed.position,[5,0,3]);
 assert.deepEqual(crossed.aligned,['F','C']);
 // o mesmo vizinho nos dois eixos empilharia as peças: fica só o eixo mais próximo
 const stacked=alignToNeighbours([4.9,0,3.3],a,[a,b]);
 assert.deepEqual(stacked.position,[5,0,3.3]);
 assert.deepEqual(stacked.aligned,['B']);
 assert.deepEqual(alignToNeighbours([10,0,10],a,[a,b]).position,[10,0,10]);
 assert.deepEqual(alignToNeighbours([10,0,10],a,[a,b]).aligned,[]);
 assert.deepEqual(alignToNeighbours([4.6,0,3.9],a,[a,{...b,visible:false}]).position,[4.6,0,3.9]);
 const p=emptyProject();p.settings.guides='talvez' as unknown as boolean;
 assert.throws(()=>validateProject(p),/configurações/);
});

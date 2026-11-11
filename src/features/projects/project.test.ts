import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,exampleProject,makeEntity,validateProject} from './project';

test('example survives a complete JSON export/import without losing transforms',()=>{
 const p=exampleProject();const restored=validateProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored,p);assert.equal(restored.objects.length,40);
 assert.equal(new Set(restored.objects.map(o=>o.id)).size,40);
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

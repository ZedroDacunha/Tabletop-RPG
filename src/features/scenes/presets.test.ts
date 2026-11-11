import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPreset,findFreeOrigin,presets} from './presets';
import {KINDS,emptyProject,makeEntity,validateProject} from '../projects/project';
import {catalog} from '../assets/catalog';

test('todo cenário usa peças conhecidas e cabe no mapa padrão',()=>{
 const kinds=new Set<string>(KINDS);
 const catalogKinds=new Set(catalog.map((item)=>item.kind));
 assert.equal(new Set(presets.map((p)=>p.id)).size,presets.length);
 for(const preset of presets){
  assert.ok(preset.name.length>0&&preset.description.length>0);
  assert.ok(preset.items.length>=8,`${preset.id} tem poucas peças`);
  assert.ok(kinds.has(preset.icon));
  for(const item of preset.items){
   assert.ok(kinds.has(item.kind),`${preset.id} usa tipo desconhecido: ${item.kind}`);
   assert.ok(catalogKinds.has(item.kind),`${preset.id} usa peça sem catálogo: ${item.kind}`);
   assert.ok(Math.abs(item.x)<=8&&Math.abs(item.z)<=8,`${preset.id} sai do raio esperado`);
   assert.ok((item.scale??1)>=.05&&(item.scale??1)<=5);
  }
 }
});

test('cenários geram entidades válidas e sobrevivem à validação do projeto',()=>{
 for(const preset of presets){
  const entities=buildPreset(preset,[0,0,0]);
  assert.equal(entities.length,preset.items.length);
  assert.equal(new Set(entities.map((e)=>e.id)).size,entities.length);
  const project=emptyProject();
  project.objects=entities;
  const restored=validateProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(restored.objects,entities);
 }
});

test('a origem livre evita sobreposição e respeita os limites do mapa',()=>{
 const occupied=[makeEntity('cube','Cubo',[0,0,0])];
 const origin=findFreeOrigin(occupied,7,30);
 assert.ok(Math.hypot(origin[0],origin[2])>=7);
 assert.ok(Math.abs(origin[0])<=8&&Math.abs(origin[2])<=8);
 const crowded=Array.from({length:40},(_,i)=>makeEntity('cube','Cubo',[(i%7)*4-12,0,Math.floor(i/7)*4-12]));
 const fallback=findFreeOrigin([...crowded,...occupied],7,20);
 assert.ok(Math.abs(fallback[0])<=3&&Math.abs(fallback[2])<=3);
});

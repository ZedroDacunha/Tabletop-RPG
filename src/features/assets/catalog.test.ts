import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {catalog,filterCatalog,catalogSubtypes,matchesSearch,CATEGORIES} from './catalog';
import {DETAILED_KINDS} from './detailedKinds';
import {buildDetailedModel} from '../../scene/detailedModels';
import {KINDS,makeEntity,emptyProject,validateProject} from '../projects/project';
import {layerOf} from '../scenes/layers';
import previews from './modelPreviews.json';

test('64 models have unique identifiers, a category, a subtype and a renderer preview',()=>{
 assert.equal(catalog.length,64);assert.equal(new Set(catalog.map(a=>a.kind)).size,64);
 assert.deepEqual([...catalog.map(a=>a.kind)].sort(),[...KINDS].sort());
 for(const item of catalog){assert.ok(CATEGORIES.includes(item.category));assert.ok(catalogSubtypes(item.category).includes(item.detail));}
 for(const kind of DETAILED_KINDS)assert.match(previews[kind],/^data:image\/png;base64,/);
});
test('category, subtype and accent-insensitive keyword search combine',()=>{
 assert.equal(filterCatalog('Mobiliário','Mesas e balcões','madeira mesa')[0]?.kind,'table');
 assert.equal(filterCatalog('Mobiliário','Assentos','mesa').length,0);
 assert.equal(filterCatalog('Todos','Todos','sarcOfago')[0]?.kind,'sarcophagus');
 assert.equal(filterCatalog('Todos','Todos','prisao')[0]?.kind,'cage');
 assert.ok(filterCatalog('Importados','Todos','').length===0);
 assert.ok(matchesSearch('Vaso de cerâmica','CERAMICA'));
 assert.equal(filterCatalog('Todos','Todos','').length,64);
});
test('subtypes belong to their category and furniture stays in the object scene layer',()=>{
 assert.ok(catalogSubtypes('Mobiliário').includes('Assentos'));
 assert.ok(!catalogSubtypes('Mobiliário').includes('Árvores'));
 for(const kind of ['table','brazier','cage','marketstall'] as const)assert.equal(layerOf(makeEntity(kind,kind)),'objetos');
 assert.equal(layerOf(makeEntity('willow','Salgueiro')),'natureza');
 assert.equal(layerOf(makeEntity('cottage','Casa')),'construcoes');
});
test('all new model kinds roundtrip through project export without changing old identifiers',()=>{
 const p=emptyProject();p.objects=KINDS.map(kind=>makeEntity(kind,kind));
 const restored=validateProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.objects,p.objects);
});
test('detailed meshes have finite bounds and merged draw calls within the asset budget',()=>{
 for(const kind of DETAILED_KINDS){const model=buildDetailedModel(kind);const bounds=new T.Box3().setFromObject(model);assert.ok(!bounds.isEmpty(),kind);assert.ok(bounds.min.y>=-.2,`${kind} below ground: ${bounds.min.y}`);let triangles=0,meshes=0;
 model.traverse(obj=>{if(obj instanceof T.Mesh){meshes++;const positions=obj.geometry.getAttribute('position');triangles+=(obj.geometry.index?.count??positions.count)/3;for(const n of positions.array)assert.ok(Number.isFinite(n),`${kind} non-finite geometry`);}});
 assert.ok(meshes>0&&meshes<=18,`${kind}: ${meshes} draw calls`);assert.ok(triangles>20&&triangles<16000,`${kind}: ${triangles} triangles`);
 model.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();(obj.material as T.Material).dispose()}});
 }
});

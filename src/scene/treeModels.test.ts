import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {buildTreeModel} from './treeModels';
import {TREE_KINDS} from '../features/assets/treeKinds';
import {filterCatalog} from '../features/assets/catalog';
import previews from '../features/assets/modelPreviews.json';
function meshes(model:T.Group){return model.children as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>[]}
function dispose(model:T.Group){for(const m of meshes(model)){m.geometry.dispose();m.material.map?.dispose();m.material.bumpMap?.dispose();m.material.dispose()}}
function fingerprint(model:T.Group){const hash=createHash('sha256');for(const m of meshes(model)){for(const name of ['position','normal','uv','color'])hash.update(Buffer.from(m.geometry.getAttribute(name).array.buffer));hash.update(Buffer.from((m.material.map as T.DataTexture).image.data));}return hash.digest('hex')}

test('all five species keep finite geometry, ground contact and bounded rendering cost',()=>{
 for(const kind of TREE_KINDS){const model=buildTreeModel(kind),bounds=new T.Box3().setFromObject(model);let triangles=0,bytes=0;
  assert.equal(model.children.length,kind==='deadtree'?1:2);
  for(const m of meshes(model)){const p=m.geometry.getAttribute('position');triangles+=p.count/3;for(const name of ['position','normal','uv','color']){const a=m.geometry.getAttribute(name);assert.equal(a.count,p.count);for(const n of a.array)assert.ok(Number.isFinite(n),`${kind} ${name}`);bytes+=a.array.byteLength;}assert.ok(m.castShadow&&m.receiveShadow);}
  assert.ok(triangles>1000&&triangles<16000,`${kind}: ${triangles}`);assert.ok(bytes<2200000,`${kind}: ${bytes} bytes`);
  assert.equal(bounds.min.y,0);assert.ok(bounds.max.y>3.5&&bounds.max.y<5.6,kind);assert.ok(bounds.max.x-bounds.min.x<5.5,kind);dispose(model);
 }
});
test('bark relief and leaf cutouts survive cloning with shared resources',()=>{
 for(const kind of TREE_KINDS){const source=buildTreeModel(kind),copy=source.clone(true);copy.position.x=12;assert.equal(source.position.x,0);
  for(let i=0;i<source.children.length;i++){const original=meshes(source)[i],clone=meshes(copy)[i];assert.equal(original.geometry,clone.geometry);assert.equal(original.material,clone.material);assert.equal(clone.material.map?.colorSpace,T.SRGBColorSpace);}
  const wood=meshes(source)[0].material;assert.equal(wood.bumpMap?.colorSpace,T.NoColorSpace);assert.ok(wood.bumpScale>0);
  if(kind!=='deadtree'){const foliage=meshes(copy)[1].material,data=(foliage.map as T.DataTexture).image.data;const alpha=Array.from(data).filter((_,i)=>i%4===3);assert.ok(alpha.includes(0)&&alpha.includes(255));assert.ok(foliage.alphaTest>0);assert.equal(foliage.transparent,false);assert.equal(foliage.side,T.DoubleSide);
   // A fully minified leaf atlas must retain coverage above the cutout threshold.
   assert.ok(alpha.reduce((a,b)=>a+b,0)/alpha.length/255>foliage.alphaTest,`${kind} disappears at distance`);
  }dispose(source);
 }
});
test('species rebuild deterministically after reload and remain visually distinct',()=>{
 const fingerprints=[];for(const kind of TREE_KINDS){const a=buildTreeModel(kind),b=buildTreeModel(kind);assert.equal(fingerprint(a),fingerprint(b));fingerprints.push(fingerprint(a));dispose(a);dispose(b);}assert.equal(new Set(fingerprints).size,5);
});
test('tree filtering and thumbnails cover exactly the existing five species',()=>{
 assert.deepEqual(filterCatalog('Natureza','Árvores','').map(a=>a.kind).sort(),[...TREE_KINDS].sort());for(const kind of TREE_KINDS)assert.match(previews[kind],/^data:image\/png;base64,/);
});

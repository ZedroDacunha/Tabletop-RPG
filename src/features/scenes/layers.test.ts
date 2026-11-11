import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,makeEntity} from '../projects/project';
import {layerOf,layerSummary,layers,setLayer} from './layers';

test('each piece belongs to the layer of its category',()=>{
 assert.equal(layerOf(makeEntity('pine','Pinheiro')),'natureza');
 assert.equal(layerOf(makeEntity('wall','Muralha')),'construcoes');
 assert.equal(layerOf(makeEntity('tent','Tenda')),'objetos');
 assert.equal(layerOf(makeEntity('cube','Cubo')),'basicos');
 assert.equal(layerOf({...makeEntity('cube','Modelo'),kind:'model',assetId:'a'}),'importados');
 assert.equal(layers.length,5);
});

test('the summary counts pieces, hidden pieces and locked pieces per layer',()=>{
 const objects=[makeEntity('pine','A'),{...makeEntity('oak','B'),visible:false},{...makeEntity('rock','C'),locked:true},makeEntity('wall','D')];
 assert.deepEqual(layerSummary(objects,'natureza'),{total:3,visible:2,locked:1});
 assert.deepEqual(layerSummary(objects,'construcoes'),{total:1,visible:1,locked:0});
 assert.deepEqual(layerSummary(objects,'objetos'),{total:0,visible:0,locked:0});
});

test('hiding or locking a layer never touches the other layers',()=>{
 const objects=[makeEntity('pine','A'),makeEntity('oak','B'),makeEntity('wall','C')];
 const hidden=setLayer(objects,'natureza',{visible:false});
 assert.deepEqual(hidden.map(o=>o.visible),[false,false,true]);
 assert.deepEqual(objects.map(o=>o.visible),[true,true,true],'não altera o array original');
 assert.deepEqual(setLayer(hidden,'natureza',{visible:true}).map(o=>o.visible),[true,true,true]);
 const locked=setLayer(hidden,'natureza',{locked:true});
 assert.deepEqual(locked.map(o=>o.locked),[true,true,false]);
 assert.deepEqual(setLayer(locked,'natureza',{locked:false}).map(o=>o.locked),[false,false,false]);
 const p=emptyProject();
 p.objects=setLayer(objects,'objetos',{visible:false});
 assert.deepEqual(p.objects.map(o=>o.visible),[true,true,true]);
});

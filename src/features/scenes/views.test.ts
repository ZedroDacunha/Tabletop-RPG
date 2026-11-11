import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_VIEWS,defaultViewName,makeViewpoint,nextViewIndex} from './views';

test('a viewpoint keeps a clean name and its own copy of the camera',()=>{
 const position:[number,number,number]=[3,4,5];const target:[number,number,number]=[0,1,0];
 const view=makeViewpoint('  Vista do portão  ',position,target,()=>'v1');
 assert.deepEqual(view,{id:'v1',name:'Vista do portão',position:[3,4,5],target:[0,1,0]});
 assert.notEqual(view.position,position);
 position[0]=99;
 assert.equal(view.position[0],3,'não guarda referência ao array da câmera');
 assert.equal(makeViewpoint('   ',position,target,()=>'v2').name,'Vista');
 assert.equal(makeViewpoint('x'.repeat(90),position,target,()=>'v3').name.length,60);
 assert.equal(MAX_VIEWS,24);
});

test('default names count up and navigation wraps both ways',()=>{
 assert.equal(defaultViewName(undefined),'Vista 1');
 assert.equal(defaultViewName([makeViewpoint('A',[0,0,0],[0,0,0],()=>'a')]),'Vista 2');
 assert.equal(nextViewIndex(0,3,1),1);
 assert.equal(nextViewIndex(2,3,1),0);
 assert.equal(nextViewIndex(0,3,-1),2);
 assert.equal(nextViewIndex(1,1,1),0);
 assert.equal(nextViewIndex(0,0,1),0);
});

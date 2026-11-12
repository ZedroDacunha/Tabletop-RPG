import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TRAVEL,MAX_TRAVEL,MAX_VIEWS,TRAVEL_OPTIONS,clampTravel,defaultViewName,makeViewpoint,nextViewIndex,travelLabel,travelOf} from './views';

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

test('a view travels in its own time, with safe limits',()=>{
 assert.equal(DEFAULT_TRAVEL,1.2);
 assert.equal(travelOf(undefined),DEFAULT_TRAVEL);
 assert.equal(travelOf({id:'a',name:'A',position:[0,0,0],target:[0,0,0]}),DEFAULT_TRAVEL);
 assert.equal(travelOf({id:'a',name:'A',position:[0,0,0],target:[0,0,0],travel:0}),0);
 assert.equal(travelOf({id:'a',name:'A',position:[0,0,0],target:[0,0,0],travel:2}),2);
 assert.equal(clampTravel(-3),0);
 assert.equal(clampTravel(99),MAX_TRAVEL);
 assert.equal(clampTravel(Number.NaN),DEFAULT_TRAVEL);
 assert.equal(clampTravel(1.24),1.2);
 assert.deepEqual([...TRAVEL_OPTIONS],[0,0.5,1,1.5,2,3]);
 assert.equal(travelLabel(0),'0 s');
 assert.equal(travelLabel(0.5),'0,5 s');
 assert.equal(travelLabel(1),'1 s');
 assert.equal(travelLabel(1.2),'1,2 s');
 assert.equal(travelLabel(2.5),'2,5 s');
});

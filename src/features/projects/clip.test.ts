import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,makeEntity,makeGroup,assignGroup} from './project';
import {buildClip,pasteClip,clipCenter,validateClip,CLIP_FORMAT} from './clip';

function scene(){
 const p=emptyProject();p.name='Bosque';
 p.groups=[makeGroup('Árvores')];
 p.objects=[makeEntity('pine','A',[2,0,4]),makeEntity('rock','B',[6,0,4]),makeEntity('tent','C',[30,0,30])];
 p.objects=assignGroup(p.objects,new Set([p.objects[0].id,p.objects[1].id]),p.groups[0].id);
 return p;
}

test('a clip keeps only the chosen pieces with their group and models',()=>{
 const p=scene();
 const clip=buildClip(p,[p.objects[0].id,p.objects[1].id],'  Canto do bosque  ');
 assert.equal(clip.format,CLIP_FORMAT);
 assert.equal(clip.version,1);
 assert.equal(clip.name,'Canto do bosque');
 assert.equal(clip.source,'Bosque');
 assert.equal(clip.objects.length,2);
 assert.deepEqual(clip.objects.map(o=>o.name),['A','B']);
 assert.equal(clip.groups.length,1);
 assert.equal(clip.groups[0].name,'Árvores');
 assert.equal(clip.assets.length,0);
 const p2=emptyProject();p2.assets=[{id:'m1',name:'Modelo',data:'data:model/gltf-binary;base64,Z2xURg==',bytes:4}];
 p2.objects=[makeEntity('model','M',[0,0,0],'m1'),makeEntity('cube','C',[1,0,0])];
 const withModel=buildClip(p2,[p2.objects[0].id],'Modelo');
 assert.equal(withModel.assets.length,1);
 assert.equal(withModel.assets[0].id,'m1');
 const locked=buildClip({...p,objects:p.objects.map(o=>({...o,locked:true}))},[p.objects[0].id],'Travado');
 assert.equal(locked.objects[0].locked,false,'trecho sai destravado para poder ser colado');
});

test('pasting gives new ids, remaps groups and moves the clip to the anchor',()=>{
 const p=scene();
 const clip=buildClip(p,[p.objects[0].id,p.objects[1].id],'Canto');
 let counter=0;const next=()=>`novo-${++counter}`;
 const center=clipCenter(clip);
 assert.deepEqual(center,[4,0,4]);
 const pasted=pasteClip(clip,[0,-center[1],0],next);
 assert.deepEqual(pasted.objects.map(o=>o.id),['novo-2','novo-3']);
 assert.deepEqual(pasted.objects.map(o=>o.position),[ [2,0,4],[6,0,4] ]);
 assert.notEqual(pasted.groups[0].id,clip.groups[0].id);
 assert.equal(pasted.groups[0].name,'Árvores');
 assert.ok(pasted.objects.every(o=>o.groupId===pasted.groups[0].id));
 const shifted=pasteClip(clip,[10,0,-center[2]],next);
 assert.deepEqual(shifted.objects.map(o=>o.position),[ [12,0,0],[16,0,0] ]);
});

test('malformed clips are refused with clear messages',()=>{
 assert.throws(()=>validateClip(null),/não é um trecho/);
 assert.throws(()=>validateClip({format:'outro',version:1}),/não é um trecho/);
 const p=scene();const clip=buildClip(p,[p.objects[0].id],'Ok');
 assert.equal(validateClip(JSON.parse(JSON.stringify(clip))).objects.length,1);
 assert.throws(()=>validateClip({...clip,objects:[]}),/entre 1 e 1.500/);
 assert.throws(()=>validateClip({...clip,name:'   '}),/nome válido/);
 const broken=JSON.parse(JSON.stringify(clip));
 broken.objects[0].kind='model';broken.objects[0].assetId='sumiu';
 assert.throws(()=>validateClip(broken),/modelo/);
});

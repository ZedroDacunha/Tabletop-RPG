import {useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {Asset,Kind} from '../features/projects/project';
import {loadAsset} from '../features/assets/importer';
function Box({p=[0,0,0],s=[1,1,1],c='#a4ac9e',r=[0,0,0]}:{p?:[number,number,number];s?:[number,number,number];c?:string;r?:[number,number,number]}){return <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.95}/></mesh>}
function Stone({p=[0,0,0],s=[1,1,1],c='#89958a'}:{p?:[number,number,number];s?:[number,number,number];c?:string}){return <mesh position={p} scale={s} castShadow receiveShadow rotation={[.1,.4,.15]}><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={c} roughness={1} flatShading/></mesh>}
function Cylinder({p=[0,0,0],r1=.25,r2=.3,h=1,c='#74624b',rotation=[0,0,0],segments=8}:{p?:[number,number,number];r1?:number;r2?:number;h?:number;c?:string;rotation?:[number,number,number];segments?:number}){return <mesh position={p} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={[r1,r2,h,segments]}/><meshStandardMaterial color={c} roughness={.9} flatShading/></mesh>}
export function BuiltinModel({kind,color='#a7bf99'}:{kind:Kind;color?:string}){
 const tentShape=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-1.15,0);s.lineTo(1.15,0);s.lineTo(0,1.7);s.closePath();return s;},[]);
 switch(kind){
 case 'pine': return <group><Cylinder p={[0,1.3,0]} h={2.6} r1={.13} r2={.24}/>{[0,1,2].map(i=><mesh key={i} position={[0,1.8+i*.8,0]} rotation={[0,i*.35,0]} castShadow><coneGeometry args={[1.2-i*.23,2,7]}/><meshStandardMaterial color={['#466449','#547652','#6b8d62'][i]} roughness={1} flatShading/></mesh>)}</group>;
 case 'oak':return <group><Cylinder p={[0,1.2,0]} h={2.4} r1={.2} r2={.34}/><Cylinder p={[.45,1.8,0]} h={1.3} r1={.1} r2={.16} rotation={[0,0,-.65]}/><Stone p={[-.65,2.6,0]} s={[1.2,1.05,1.2]} c="#789267"/><Stone p={[.7,2.9,0]} s={[1.2,1.25,1.15]} c="#91a775"/><Stone p={[0,3.25,.5]} s={[1.1,1.1,1.1]} c="#9eb280"/></group>;
 case 'rock':return <group><Stone p={[0,.53,0]} s={[1.1,.8,.85]}/><Stone p={[.8,.2,.4]} s={[.5,.35,.45]} c="#a5afa0"/><Stone p={[-.6,.18,.65]} s={[.38,.28,.4]} c="#748476"/></group>;
 case 'wall':return <group>{Array.from({length:4},(_,y)=>Array.from({length:y===3?2:4},(_,x)=><Box key={`${y}-${x}`} p={[-1.32+x*.87+(y%2?.15:0),.24+y*.48,0]} s={[.83,.45,.72]} c={['#99a18f','#aab09d','#858e80'][(x+y)%3]}/>))}<Box p={[0,.08,0]} s={[4,.16,1]} c="#788575"/></group>;
 case 'arch':return <group>{[-1,1].map(x=><group key={x}>{[0,1,2,3].map(y=><Box key={y} p={[x,.24+y*.45,0]} s={[.58,.43,.75]} c={y%2?'#a2a895':'#b5b8a4'}/>)}<Box p={[x,.08,0]} s={[.9,.16,.95]}/></group>)}<mesh position={[0,1.78,0]} castShadow><torusGeometry args={[1,.3,4,9,Math.PI]}/><meshStandardMaterial color="#b3b6a3" roughness={1} flatShading/></mesh><Box p={[0,2.8,.01]} s={[.48,.4,.8]} c="#c2c1aa"/></group>;
 case 'floor':return <group><Box p={[0,.025,0]} s={[2.35,.05,2.35]} c="#4c5a49"/>{[-1,0,1].map(x=>[-1,0,1].map(z=><Box key={`${x}-${z}`} p={[x*.75,.085,z*.75]} s={[.71,.12,.71]} c={['#989e8b','#87947d','#a2a38d'][(x+z+6)%3]}/>))}</group>;
 case 'tent':return <group><mesh position={[0,0,-1.2]} castShadow receiveShadow><extrudeGeometry args={[tentShape,{depth:2.4,bevelEnabled:false}]}/><meshStandardMaterial color="#bba773" roughness={1} flatShading/></mesh><mesh position={[0,.02,1.205]} scale={[.7,.8,1]}><shapeGeometry args={[tentShape]}/><meshStandardMaterial color="#49483a" side={THREE.DoubleSide}/></mesh><Cylinder p={[0,.83,1.3]} h={1.72} r1={.045} r2={.05} c="#5f4c36"/>{[-1.2,1.2].map(x=><Box key={x} p={[x,.06,0]} s={[.09,.12,2.7]} c="#776247"/>)}</group>;
 case 'campfire':return <group>{Array.from({length:8},(_,i)=><Stone key={i} p={[Math.cos(i*Math.PI/4)*.9,.18,Math.sin(i*Math.PI/4)*.9]} s={[.3,.24,.28]} c={i%2?'#91988a':'#707e72'}/>)}{[0,1,2].map(i=><Cylinder key={i} p={[0,.2+i*.08,0]} r1={.13} r2={.16} h={1.4} c="#60432d" rotation={[Math.PI/2,0,i*Math.PI/3]}/>)}<mesh position={[0,.7,0]}><coneGeometry args={[.4,1.05,5]}/><meshStandardMaterial color="#ed963d" emissive="#e5671c" emissiveIntensity={1.3}/></mesh><mesh position={[.1,.5,.1]}><coneGeometry args={[.24,.75,5]}/><meshStandardMaterial color="#ffd993" emissive="#ffbb4f" emissiveIntensity={1.2}/></mesh><pointLight position={[0,1,0]} intensity={5} color="#ff9e4b" distance={5}/></group>;
 case 'crate':return <group><Box p={[0,.55,0]} s={[1.1,1.1,1.1]} c="#94704a"/>{[-.5,.5].map(x=><group key={x}><Box p={[x,.55,.58]} s={[.12,1.15,.1]} c="#c19b68"/><Box p={[x,.55,-.58]} s={[.12,1.15,.1]} c="#c19b68"/></group>)}{[.08,1.02].map(y=><group key={y}><Box p={[0,y,.58]} s={[1.15,.12,.1]} c="#c19b68"/><Box p={[0,y,-.58]} s={[1.15,.12,.1]} c="#c19b68"/></group>)}<Box p={[0,.55,.64]} s={[.12,1.35,.06]} r={[0,0,.7]} c="#bb9463"/></group>;
 case 'barrel':return <group><Cylinder p={[0,.6,0]} h={1.2} r1={.48} r2={.48} c="#a38152" segments={10}/>{[.15,.98].map(y=><Cylinder key={y} p={[0,y,0]} h={.13} r1={.51} r2={.51} c="#545b54" segments={10}/>)}<Cylinder p={[0,1.21,0]} h={.03} r1={.43} r2={.43} c="#bea273"/></group>;
 case 'well':return <group>{Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return <group key={i}>{[0,1].map(y=><Box key={y} p={[Math.cos(a)*.7,.22+y*.4,Math.sin(a)*.7]} s={[.47,.38,.4]} r={[0,-a,0]} c={i%2?'#9ea693':'#808f7d'}/>)}</group>})}<Cylinder p={[0,.12,0]} h={.06} r1={.6} r2={.6} c="#314b4c"/>{[-.95,.95].map(x=><Cylinder key={x} p={[x,1.2,0]} h={2.4} r1={.07} r2={.1}/>)}<Cylinder p={[0,2.25,0]} h={2.2} r1={.1} r2={.1} rotation={[0,0,Math.PI/2]}/></group>;
 case 'column':return <group><Box p={[0,.12,0]} s={[1,.24,1]} c="#8e9a89"/><Cylinder p={[0,1.2,0]} h={2} r1={.32} r2={.4} c="#aeb39f" segments={8}/><Box p={[0,2.25,0]} s={[.85,.2,.85]} c="#bec1ac"/></group>;
 case 'cube':return <Box p={[0,.5,0]} c={color}/>;
 case 'sphere':return <mesh position={[0,.6,0]} castShadow receiveShadow><sphereGeometry args={[.6,24,16]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>;
 case 'cylinder':return <Cylinder p={[0,.6,0]} h={1.2} r1={.5} r2={.5} c={color} segments={20}/>;
 }
}
export function ImportedModel({asset,onError}:{asset:Asset;onError:(message:string)=>void}){
 const [model,setModel]=useState<THREE.Object3D|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;loadAsset(asset).then(value=>{if(active)setModel(clone(value))}).catch(()=>{if(active){setFailed(true);onError(`Não foi possível carregar “${asset.name}”. O projeto foi preservado.`)}});return ()=>{active=false}},[asset.id]);
 if(failed)return <Box c="#b86252"/>;if(!model)return <Box c="#738879"/>;
 return <primitive object={model} dispose={null}/>;
}

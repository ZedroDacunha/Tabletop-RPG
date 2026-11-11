import {Component,useEffect,useMemo,useRef,useState,Suspense,type ReactNode} from 'react';
import {Canvas,useThree,type ThreeEvent} from '@react-three/fiber';
import {Grid,OrbitControls,TransformControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {BuiltinModel,ImportedModel} from './Models';
import type {Project,Entity,Vec3} from '../features/projects/project';
import {CompatibleMap} from './CompatibleMap';
import {downloadFile} from '../features/projects/storage';
export type Tool='select'|'translate'|'rotate'|'scale';
export type CameraCommand={id:number;type:'home'|'top'|'focus'|'image';position?:Vec3};
export type Placement={kind:Entity['kind'];name:string;assetId?:string}|null;
export type ViewportProps={project:Project;selected:string|null;tool:Tool;placement:Placement;command:CameraCommand;onSelect:(id:string|null)=>void;onPlace:(p:Vec3)=>void;onTransform:(id:string,patch:Partial<Entity>)=>void;onCamera:(camera:NonNullable<Project['camera']>)=>void;onError:(msg:string)=>void};
type Props=ViewportProps;
class SceneErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){if(this.state.failed)return <div className="webgl-error"><h2>Não foi possível iniciar o espaço 3D</h2><p>Confira se a aceleração gráfica está ativa no navegador e recarregue a página. Seu mapa salvo permanece no navegador.</p><button onClick={()=>location.reload()}>Tentar novamente</button></div>;return this.props.children}}
function CameraRig({project,command,onCamera}:Pick<Props,'project'|'command'|'onCamera'>){
 const controls=useRef<Controls>(null);const {camera,gl,invalidate,scene}=useThree();const onCameraRef=useRef(onCamera);onCameraRef.current=onCamera;
 const remember=()=>{if(controls.current)onCameraRef.current({position:camera.position.toArray() as Vec3,target:controls.current.target.toArray() as Vec3})};
 useEffect(()=>{const c=controls.current;if(!c)return;camera.position.fromArray(project.camera?.position??[23,20,27]);c.target.fromArray(project.camera?.target??[0,0,0]);c.update();invalidate()},[project.id]);
 useEffect(()=>{const c=controls.current;if(!c||command.id===0)return;
 if(command.type==='image'){gl.render(scene,camera);gl.domElement.toBlob(blob=>{if(blob)downloadFile(blob,`${project.name}.png`)});return;}
 const target=command.type==='focus'&&command.position?new THREE.Vector3(...command.position):new THREE.Vector3(0,0,0);c.target.copy(target);
 if(command.type==='top')camera.position.copy(target).add(new THREE.Vector3(.001,project.settings.size*1.3,.001));
 else if(command.type==='focus')camera.position.copy(target).add(new THREE.Vector3(7,6,8));
 else camera.position.set(project.settings.size*.77,project.settings.size*.67,project.settings.size*.9);
 c.update();invalidate();remember();
 },[command.id]);
 return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.12} minDistance={2} maxDistance={150} maxPolarAngle={Math.PI/2-.025} mouseButtons={{LEFT:undefined,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.ROTATE}} onEnd={remember}/>;
}
function Placed({entity,project,selected,tool,onSelect,onTransform,onError}:Omit<Props,'placement'|'command'|'onPlace'|'onCamera'>&{entity:Entity}){
 const ref=useRef<THREE.Group>(null);const active=selected===entity.id;const edit=active&&!entity.locked&&tool!=='select';const asset=project.assets.find(a=>a.id===entity.assetId);
 const capture=()=>{const o=ref.current;if(o)onTransform(entity.id,{position:o.position.toArray() as Vec3,rotation:[o.rotation.x,o.rotation.y,o.rotation.z],scale:o.scale.toArray().map(s=>Math.max(.05,Math.min(50,s))) as Vec3})};
 const model=<group ref={ref} name={entity.id} position={entity.position} rotation={entity.rotation} scale={entity.scale} visible={entity.visible} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5)onSelect(entity.id)}}>
 {entity.kind==='model'&&asset?<ImportedModel asset={asset} onError={onError}/>:entity.kind!=='model'?<BuiltinModel kind={entity.kind} color={entity.color}/>:null}
 {active&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]}><ringGeometry args={[1.45,1.49,64]}/><meshBasicMaterial color="#d1edb2" transparent opacity={.85} depthWrite={false}/></mesh>}
 </group>;
 return edit?<TransformControls mode={tool} translationSnap={project.settings.snap?project.settings.gridSize:null} rotationSnap={project.settings.snap?Math.PI/12:null} scaleSnap={project.settings.snap ? .1 : null} onMouseUp={capture}>{model}</TransformControls>:model;
}
type AtmosphereKey='dawn'|'day'|'dusk'|'night';
type Ambience={skyTop:string;skyHorizon:string;glow:string;sunColor:string;sunDisc:string;sunIntensity:number;sunPosition:[number,number,number];ambient:number;hemiSky:string;hemiGround:string;hemi:number;ground:string;groundDeep:string;grid:string;gridSection:string;fog:[number,number];exposure:number;stars:number};
const AMBIENCE:Record<AtmosphereKey,Ambience>={
 dawn:{skyTop:'#63799f',skyHorizon:'#f6cba6',glow:'#ffd9b8',sunColor:'#ffcfaa',sunDisc:'#fff0d8',sunIntensity:2.2,sunPosition:[-24,7,18],ambient:.62,hemiSky:'#cbd8ea',hemiGround:'#5b584a',hemi:.78,ground:'#6d7c60',groundDeep:'#3a473c',grid:'#9db48c',gridSection:'#b4c7a0',fog:[62,160],exposure:1.02,stars:45},
 day:{skyTop:'#7ea7cd',skyHorizon:'#e2ebde',glow:'#fdf7e4',sunColor:'#fff2d6',sunDisc:'#fffaf0',sunIntensity:2.55,sunPosition:[-16,27,13],ambient:.82,hemiSky:'#d9e6dd',hemiGround:'#4f5844',hemi:1.05,ground:'#77865f',groundDeep:'#48573f',grid:'#9db48c',gridSection:'#b1c79c',fog:[78,185],exposure:1.06,stars:0},
 dusk:{skyTop:'#3f4f6d',skyHorizon:'#e89a6b',glow:'#ffc08a',sunColor:'#ffb377',sunDisc:'#ffe0b8',sunIntensity:2,sunPosition:[-26,10,15],ambient:.7,hemiSky:'#b6c2d8',hemiGround:'#4a4a3b',hemi:.82,ground:'#69785c',groundDeep:'#39443b',grid:'#93a982',gridSection:'#a8bd94',fog:[66,158],exposure:1.03,stars:35},
 night:{skyTop:'#0b131c',skyHorizon:'#1d2a33',glow:'#31536b',sunColor:'#b9ccf5',sunDisc:'#dce7ff',sunIntensity:.85,sunPosition:[-18,23,-10],ambient:.36,hemiSky:'#5d7a9f',hemiGround:'#2f362b',hemi:.42,ground:'#3a4a3d',groundDeep:'#232c26',grid:'#6f8570',gridSection:'#819a82',fog:[48,135],exposure:1,stars:1},
};
function mixColors(base:string,tint:string,amount:number){return new THREE.Color(base).lerp(new THREE.Color(tint),amount).getHexString()}
function SkyDome({top,horizon,glow,radius=210}:{top:string;horizon:string;glow:string;radius?:number}){
 const geometry=useMemo(()=>{
  const g=new THREE.SphereGeometry(radius,32,20);const position=g.attributes.position;const colors=new Float32Array(position.count*3);
  const cTop=new THREE.Color(top),cHorizon=new THREE.Color(horizon),cGlow=new THREE.Color(glow),tmp=new THREE.Color();
  for(let i=0;i<position.count;i++){
   const y=Math.max(0,position.getY(i)/radius);const k=Math.pow(y,.6);
   tmp.copy(cHorizon).lerp(cTop,k).lerp(cGlow,Math.pow(1-y,7)*.55);
   colors[i*3]=tmp.r;colors[i*3+1]=tmp.g;colors[i*3+2]=tmp.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return g;
 },[top,horizon,glow,radius]);
 return <mesh geometry={geometry} renderOrder={-2}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false}/></mesh>;
}
function CelestialBody({direction,color,size=9}:{direction:[number,number,number];color:string;size?:number}){
 const position=new THREE.Vector3(...direction).normalize().multiplyScalar(196);
 return <group position={position}>
  <mesh><sphereGeometry args={[size,18,14]}/><meshBasicMaterial color={color} fog={false} toneMapped={false}/></mesh>
  <mesh><sphereGeometry args={[size*2.6,16,12]}/><meshBasicMaterial color={color} transparent opacity={.13} fog={false} toneMapped={false} depthWrite={false}/></mesh>
 </group>;
}
function Stars({count,radius=200}:{count:number;radius?:number}){
 const geometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();const points=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   const theta=Math.random()*Math.PI*2;const phi=Math.acos(.12+Math.random()*.85);
   points[i*3]=Math.sin(phi)*Math.cos(theta)*radius;points[i*3+1]=Math.cos(phi)*radius;points[i*3+2]=Math.sin(phi)*Math.sin(theta)*radius;
  }
  g.setAttribute('position',new THREE.BufferAttribute(points,3));return g;
 },[count,radius]);
 return <points geometry={geometry}><pointsMaterial size={1.7} sizeAttenuation={false} color="#e9f1ff" transparent opacity={.8} fog={false} depthWrite={false}/></points>;
}
function useGroundTexture(color:string,repeat:number){
 return useMemo(()=>{
  const size=256;const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle=color;ctx.fillRect(0,0,size,size);
  let seed=7919;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<240;i++){
   const r=3+rand()*18;const alpha=.028+rand()*.05;
   ctx.fillStyle=rand()>.48?`rgba(255,255,255,${alpha.toFixed(3)})`:`rgba(0,0,0,${alpha.toFixed(3)})`;
   ctx.beginPath();ctx.arc(rand()*size,rand()*size,r,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return texture;
 },[color,repeat]);
}
function World(props:Props){
 const {project,selected,placement}=props;const [point,setPoint]=useState<Vec3>([0,0,0]);const [hover,setHover]=useState(false);const s=project.settings;
 const ambience=AMBIENCE[s.atmosphere]??AMBIENCE.day;
 const {gl,invalidate}=useThree();
 useEffect(()=>{gl.toneMappingExposure=ambience.exposure;invalidate()},[ambience,gl,invalidate]);
 const sky=useMemo(()=>({top:mixColors(ambience.skyTop,s.background,.18),horizon:mixColors(ambience.skyHorizon,s.background,.42),glow:mixColors(ambience.glow,s.background,.15)}),[ambience,s.background]);
 const groundTexture=useGroundTexture(ambience.ground,Math.max(6,Math.round(s.size/3)));
 function floorPoint(e:ThreeEvent<PointerEvent|MouseEvent>):Vec3{let x=e.point.x,z=e.point.z;if(s.snap){x=Math.round(x/s.gridSize)*s.gridSize;z=Math.round(z/s.gridSize)*s.gridSize;}const limit=s.size/2;return [Math.max(-limit,Math.min(limit,x)),0,Math.max(-limit,Math.min(limit,z))];}
 return <>
 <color attach="background" args={[s.background]}/><fog attach="fog" args={[s.background,ambience.fog[0],ambience.fog[1]]}/>
 <SkyDome top={sky.top} horizon={sky.horizon} glow={sky.glow}/>
 <CelestialBody direction={ambience.sunPosition} color={ambience.sunDisc}/>
 {ambience.stars>0&&<Stars count={ambience.stars}/>}
 <ambientLight intensity={ambience.ambient}/><hemisphereLight args={[ambience.hemiSky,ambience.hemiGround,ambience.hemi]}/>
 <directionalLight position={ambience.sunPosition} color={ambience.sunColor} intensity={ambience.sunIntensity} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-s.size*.62} shadow-camera-right={s.size*.62} shadow-camera-top={s.size*.62} shadow-camera-bottom={-s.size*.62} shadow-camera-far={140} shadow-normalBias={.035} shadow-bias={-.0001}/>
 <mesh receiveShadow position={[0,-.26,0]}><boxGeometry args={[s.size,.5,s.size]}/><meshStandardMaterial color={ambience.groundDeep} roughness={1}/></mesh>
 <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.002,0]} onPointerMove={e=>{if(placement){setPoint(floorPoint(e));setHover(true)}}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();if(e.delta<5){if(placement)props.onPlace(floorPoint(e));else props.onSelect(null)}}}><planeGeometry args={[s.size,s.size]}/><meshStandardMaterial map={groundTexture??undefined} roughness={1}/></mesh>
 {s.grid&&<Grid args={[s.size,s.size]} position={[0,.01,0]} cellSize={s.gridSize} cellThickness={.5} cellColor={ambience.grid} sectionSize={s.gridSize*5} sectionThickness={1} sectionColor={ambience.gridSection} fadeDistance={100} fadeStrength={1} followCamera={false} infiniteGrid={false}/>}
 {project.objects.map(entity=><Placed key={entity.id} {...props} entity={entity}/>)}
 {placement&&hover&&<group position={point}><mesh position={[0,.04,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.7,.8,32]}/><meshBasicMaterial color="#e4f7b8" transparent opacity={.9}/></mesh><mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.5,1.5]}/><meshBasicMaterial color="#c0e4a4" transparent opacity={.25} depthWrite={false}/></mesh></group>}
 <CameraRig project={project} command={props.command} onCamera={props.onCamera}/>
 </>;
}
function hasWebGL(){try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true}catch{return false}}
export function Viewport(props:Props){const [available]=useState(hasWebGL);if(!available)return <CompatibleMap {...props}/>;return <SceneErrorBoundary><Canvas style={{position:'absolute',inset:0,width:'100%',height:'100%'}} shadows frameloop="demand" dpr={[1,1.5]} camera={{position:props.project.camera?.position??[23,20,27],fov:43,near:.1,far:300}} gl={{antialias:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1}}><Suspense fallback={null}><World {...props}/></Suspense></Canvas></SceneErrorBoundary>}

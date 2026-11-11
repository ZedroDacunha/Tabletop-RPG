import {Component,useEffect,useRef,useState,Suspense,type ReactNode} from 'react';
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
function World(props:Props){
 const {project,selected,placement}=props;const [point,setPoint]=useState<Vec3>([0,0,0]);const [hover,setHover]=useState(false);const s=project.settings;
 const daylight=s.atmosphere==='day';const night=s.atmosphere==='night';
 function floorPoint(e:ThreeEvent<PointerEvent|MouseEvent>):Vec3{let x=e.point.x,z=e.point.z;if(s.snap){x=Math.round(x/s.gridSize)*s.gridSize;z=Math.round(z/s.gridSize)*s.gridSize;}const limit=s.size/2;return [Math.max(-limit,Math.min(limit,x)),0,Math.max(-limit,Math.min(limit,z))];}
 return <>
 <color attach="background" args={[s.background]}/><fog attach="fog" args={[s.background,65,160]}/>
 <ambientLight intensity={night?.5:daylight?1.6:1.15}/><hemisphereLight args={[night?'#7e9ec1':'#dae6db','#4b503e',1]}/>
 <directionalLight position={[-12,22,9]} color={night?'#b3c9ef':daylight?'#fff0d4':'#ffcfa0'} intensity={night?1.4:2.5} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={.04} shadow-bias={-.0001}/>
 <mesh receiveShadow position={[0,-.26,0]}><boxGeometry args={[s.size,.5,s.size]}/><meshStandardMaterial color={night?'#34423b':'#65765b'} roughness={1}/></mesh>
 <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.002,0]} onPointerMove={e=>{if(placement){setPoint(floorPoint(e));setHover(true)}}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();if(e.delta<5){if(placement)props.onPlace(floorPoint(e));else props.onSelect(null)}}}><planeGeometry args={[s.size,s.size]}/><meshStandardMaterial color={night?'#384a3c':'#718264'} roughness={1}/></mesh>
 {s.grid&&<Grid args={[s.size,s.size]} position={[0,.01,0]} cellSize={s.gridSize} cellThickness={.5} cellColor="#99b18b" sectionSize={s.gridSize*5} sectionThickness={1} sectionColor="#acc399" fadeDistance={100} fadeStrength={1} followCamera={false} infiniteGrid={false}/>}
 {project.objects.map(entity=><Placed key={entity.id} {...props} entity={entity}/>)}
 {placement&&hover&&<group position={point}><mesh position={[0,.04,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.7,.8,32]}/><meshBasicMaterial color="#e4f7b8" transparent opacity={.9}/></mesh><mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.5,1.5]}/><meshBasicMaterial color="#c0e4a4" transparent opacity={.25} depthWrite={false}/></mesh></group>}
 <CameraRig project={project} command={props.command} onCamera={props.onCamera}/>
 </>;
}
function hasWebGL(){try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true}catch{return false}}
export function Viewport(props:Props){const [available]=useState(hasWebGL);if(!available)return <CompatibleMap {...props}/>;return <SceneErrorBoundary><Canvas style={{position:'absolute',inset:0,width:'100%',height:'100%'}} shadows frameloop="demand" dpr={[1,1.5]} camera={{position:props.project.camera?.position??[23,20,27],fov:43,near:.1,far:300}} gl={{antialias:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1}}><Suspense fallback={null}><World {...props}/></Suspense></Canvas></SceneErrorBoundary>}

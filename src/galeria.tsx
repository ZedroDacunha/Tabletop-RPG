// Página temporária usada apenas para inspecionar visualmente as peças nativas.
import {createRoot} from 'react-dom/client';
import {Canvas} from '@react-three/fiber';
import {BuiltinModel} from './scene/Models';
import {KINDS} from './features/projects/project';

const COLS=6;const SPACING=4.4;const rows=Math.ceil(KINDS.length/COLS);
function Galeria(){
 return <>
  <color attach="background" args={['#26312c']}/>
  <ambientLight intensity={.9}/>
  <hemisphereLight args={['#e2ece4','#4c5a45',1.05]}/>
  <directionalLight position={[14,22,12]} intensity={2.2} castShadow/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[COLS*SPACING+6,rows*SPACING+6]}/><meshStandardMaterial color="#6d7d5f" roughness={1}/></mesh>
  <group position={[-((COLS-1)*SPACING)/2,0,-((rows-1)*SPACING)/2]}>
   {KINDS.map((kind,i)=><group key={kind} position={[(i%COLS)*SPACING,0,Math.floor(i/COLS)*SPACING]}><BuiltinModel kind={kind}/></group>)}
  </group>
 </>;
}
createRoot(document.getElementById('root')!).render(
 <Canvas shadows dpr={1} camera={{position:[0,22,30],fov:42}}><Galeria/></Canvas>,
);

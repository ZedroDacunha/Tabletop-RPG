import {LoadingManager,Box3,Vector3,Group,Object3D} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {type Asset,uid} from '../projects/project';
export const MAX_MODEL_BYTES=25*1024*1024;
const cache=new Map<string,Promise<Object3D>>();
const toData=(buffer:ArrayBuffer)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Não foi possível ler o modelo.'));r.readAsDataURL(new Blob([buffer],{type:'model/gltf-binary'}));});
function normalize(scene:Object3D){scene.updateMatrixWorld(true);const box=new Box3().setFromObject(scene);if(box.isEmpty())throw new Error('O arquivo não contém uma geometria visível.');const size=box.getSize(new Vector3()),center=box.getCenter(new Vector3());const scale=3/Math.max(size.x,size.y,size.z,.001);const group=new Group();scene.position.sub(new Vector3(center.x,box.min.y,center.z));group.add(scene);group.scale.setScalar(scale);scene.traverse(obj=>{if('isMesh' in obj){obj.castShadow=true;obj.receiveShadow=true}});return group;}
export function loadAsset(asset:Asset):Promise<Object3D>{if(!cache.has(asset.data)){cache.set(asset.data,(async()=>{const payload=asset.data.slice(asset.data.indexOf(',')+1);const bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0));const manager=new LoadingManager();manager.setURLModifier(url=>{if(url.startsWith('blob:')||url.startsWith('data:'))return url;throw new Error('Este modelo solicita um recurso externo não incluído.');});const gltf=await new GLTFLoader(manager).parseAsync(bytes.buffer,'');return normalize(gltf.scene)})());}return cache.get(asset.data)!;}
export async function importModels(files:File[]):Promise<Asset[]>{
 const roots=files.filter(f=>/\.(glb|gltf)$/i.test(f.name));if(!roots.length)throw new Error('Escolha um arquivo .glb ou .gltf com suas texturas e arquivos .bin.');
 if(files.length>64||files.reduce((n,f)=>n+f.size,0)>60*1024*1024)throw new Error('Importe até 64 arquivos e 60 MB por vez.');
 if(roots.some(f=>f.size>MAX_MODEL_BYTES))throw new Error('Cada modelo deve ter no máximo 25 MB.');
 const map=new Map<string,string>(),urls:string[]=[];
 try{
 for(const f of files){if(map.has(f.name.toLowerCase()))throw new Error('Há arquivos com o mesmo nome. Importe cada modelo separadamente.');const u=URL.createObjectURL(f);urls.push(u);map.set(f.name.toLowerCase(),u);}
 const assets:Asset[]=[];
 for(const root of roots){const manager=new LoadingManager();manager.setURLModifier(uri=>{if(uri.startsWith('blob:')||uri.startsWith('data:'))return uri;const name=decodeURIComponent(uri.split('/').pop()||'').toLowerCase();const local=map.get(name);if(!local)throw new Error(`O modelo precisa de “${name}”. Selecione o modelo e todos os arquivos de textura/.bin juntos.`);return local;});
 const loader=new GLTFLoader(manager);const gltf=await loader.parseAsync(/\.gltf$/i.test(root.name)?await root.text():await root.arrayBuffer(),'');
 const binary=await new GLTFExporter().parseAsync(gltf.scene,{binary:true,onlyVisible:false});if(!(binary instanceof ArrayBuffer))throw new Error('Falha ao preparar o modelo.');if(binary.byteLength>MAX_MODEL_BYTES)throw new Error('O modelo com as texturas incorporadas ultrapassa 25 MB.');
 const asset={id:uid(),name:root.name.replace(/\.(glb|gltf)$/i,'').slice(0,100),data:await toData(binary),bytes:binary.byteLength};normalize(gltf.scene);assets.push(asset);
 }return assets;
 }catch(e){if(e instanceof Error&&/DRACOLoader|KTX2|Meshopt/.test(e.message))throw new Error('Este modelo usa uma compressão não suportada neste protótipo. Exporte um GLB sem Draco, Meshopt ou texturas KTX2.');throw e}finally{urls.forEach(u=>URL.revokeObjectURL(u))}
}

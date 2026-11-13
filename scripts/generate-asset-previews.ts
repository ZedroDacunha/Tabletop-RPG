/** Offline orthographic thumbnails from the exact 3D meshes. No GPU or external assets. */
import * as T from 'three';
import {TREE_KINDS,isTreeKind} from '../src/features/assets/treeKinds';
import {buildTreeModel} from '../src/scene/treeModels';
import {renderTreePreview} from './render-tree-preview';
import {writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {buildDetailedModel} from '../src/scene/detailedModels';
import {DETAILED_KINDS} from '../src/features/assets/detailedKinds';
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function chunk(type:string,data:Buffer){const name=Buffer.from(type);const body=Buffer.concat([name,data]);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);const result=Buffer.alloc(body.length+8);result.writeUInt32BE(data.length,0);body.copy(result,4);result.writeUInt32BE((crc^0xffffffff)>>>0,body.length+4);return result}
function png(rgba:Buffer,width:number,height:number){const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)rgba.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))])}
const previews:Record<string,string>={};
for(const kind of [...new Set([...DETAILED_KINDS,...TREE_KINDS])]){
 if(isTreeKind(kind)){previews[kind]='data:image/png;base64,'+renderTreePreview(buildTreeModel(kind)).toString('base64');continue;}
 const model=buildDetailedModel(kind);model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
 const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.copy(center).add(new T.Vector3(7,5,8));camera.lookAt(center);camera.updateMatrixWorld(true);
 const faces:{p:T.Vector3[];depth:number;color:string}[]=[];const light=new T.Vector3(-.4,1,.7).normalize();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 model.traverse(obj=>{if(!(obj instanceof T.Mesh))return;const material=obj.material as T.MeshStandardMaterial;const pos=obj.geometry.getAttribute('position');const idx=obj.geometry.index;const count=idx?.count??pos.count;
 for(let i=0;i<count;i+=3){const p=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(obj.matrixWorld));const normal=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();if(normal.dot(camera.position.clone().sub(p[0]))<0)continue;
 const brightness=.58+.42*Math.max(0,normal.dot(light));
 const color=material.color.clone().multiplyScalar(brightness);if(material.emissiveIntensity>0)color.lerp(material.emissive,.3);
 const projected=p.map(v=>v.applyMatrix4(camera.matrixWorldInverse));projected.forEach(v=>{minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y)});
 faces.push({p:projected,depth:projected.reduce((a,v)=>a+v.z,0)/3,color:'#'+color.getHexString()});
 }
 });
 const scale=Math.min(120/(maxX-minX),82/(maxY-minY));const ox=70-(minX+maxX)/2*scale,oy=91+minY*scale;
 // Orthographic CPU depth buffer: thin bars and overlapping roof tiles occlude correctly.
 const w=280,h=200,rgba=Buffer.alloc(w*h*4),depth=new Float64Array(w*h).fill(-Infinity);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(((x-140)/80)**2+((y-180)/10)**2<1)rgba[(y*w+x)*4+3]=28}
 for(const face of faces){const v=face.p.map(p=>({x:(ox+p.x*scale)*2,y:(oy-p.y*scale)*2,z:p.z}));const [a,b,c]=v;const area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.0001)continue;
 const left=Math.max(0,Math.floor(Math.min(...v.map(p=>p.x)))),right=Math.min(w-1,Math.ceil(Math.max(...v.map(p=>p.x))));const top=Math.max(0,Math.floor(Math.min(...v.map(p=>p.y)))),bottom=Math.min(h-1,Math.ceil(Math.max(...v.map(p=>p.y))));const rgb=[1,3,5].map(i=>parseInt(face.color.slice(i,i+2),16));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const px=x+.5,py=y+.5;const u=((b.y-c.y)*(px-c.x)+(c.x-b.x)*(py-c.y))/area,t=((c.y-a.y)*(px-c.x)+(a.x-c.x)*(py-c.y))/area,q=1-u-t;if(u<-.00001||t<-.00001||q<-.00001)continue;const z=u*a.z+t*b.z+q*c.z,index=y*w+x;if(z<depth[index])continue;depth[index]=z;rgba[index*4]=rgb[0];rgba[index*4+1]=rgb[1];rgba[index*4+2]=rgb[2];rgba[index*4+3]=255;}
 }
 previews[kind]='data:image/png;base64,'+png(rgba,w,h).toString('base64');
 model.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();(obj.material as T.Material).dispose()}});
}
writeFileSync(new URL('../src/features/assets/modelPreviews.json',import.meta.url),JSON.stringify(previews));
console.log(`Generated ${Object.keys(previews).length} geometry previews`);

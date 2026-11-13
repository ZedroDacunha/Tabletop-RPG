/** CPU reference renderer for textured tree thumbnails. Uses the runtime meshes, UVs,
 * cutout alpha and vertex colors; approximates lighting, without WebGL/bump/shadows. */
import * as T from 'three';
import {deflateSync} from 'node:zlib';
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function chunk(type:string,data:Buffer){const body=Buffer.concat([Buffer.from(type),data]);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);const out=Buffer.alloc(body.length+8);out.writeUInt32BE(data.length);body.copy(out,4);out.writeUInt32BE((crc^0xffffffff)>>>0,body.length+4);return out}
function png(data:Buffer,w:number,h:number){const head=Buffer.alloc(13);head.writeUInt32BE(w);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;const rows=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++)data.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))])}
const linear=(n:number)=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4;
const srgb=(n:number)=>Math.round(T.MathUtils.clamp(n<=.0031308?n*12.92:1.055*n**(1/2.4)-.055,0,1)*255);
function sample(map:T.DataTexture,u:number,v:number){
 const {data,width,height}=map.image;u=(u%1+1)%1;v=(v%1+1)%1;
 const x=u*width-.5,y=v*height-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const out=[0,0,0,0];
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(((iy+dy+height)%height)*width+(ix+dx+width)%width)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy);for(let c=0;c<4;c++)out[c]+=Number(data[i+c])/255*weight;}
 return out;
}
export function renderTreePreview(model:T.Group,w=280,h=200,view:[number,number,number]=[7,5,8]):Buffer{
 model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
 const camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.copy(center).add(new T.Vector3(...view));camera.lookAt(center);camera.updateMatrixWorld(true);
 type Face={p:T.Vector3[];uv:T.Vector2[];colors:T.Color[];brightness:number;material:T.MeshStandardMaterial};
 const faces:Face[]=[],light=new T.Vector3(-.4,1,.7).normalize();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 model.traverse(obj=>{if(!(obj instanceof T.Mesh))return;const material=obj.material as T.MeshStandardMaterial,pos=obj.geometry.getAttribute('position'),uv=obj.geometry.getAttribute('uv'),col=obj.geometry.getAttribute('color'),idx=obj.geometry.index;
 for(let i=0;i<(idx?.count??pos.count);i+=3){const indices=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);const p=indices.map(k=>new T.Vector3().fromBufferAttribute(pos,k).applyMatrix4(obj.matrixWorld));const normal=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();
 if(normal.dot(camera.position.clone().sub(p[0]))<0){if(material.side!==T.DoubleSide)continue;normal.negate();}
 const brightness=.56+.65*Math.max(0,normal.dot(light));
 const projected=p.map(v=>v.applyMatrix4(camera.matrixWorldInverse));projected.forEach(v=>{minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y)});
 faces.push({p:projected,uv:indices.map(k=>uv?new T.Vector2().fromBufferAttribute(uv,k):new T.Vector2()),colors:indices.map(k=>col?new T.Color(col.getX(k),col.getY(k),col.getZ(k)):new T.Color(1,1,1)),brightness,material});
 }});
 const scale=Math.min(w*.86/(maxX-minX),h*.84/(maxY-minY)),ox=w/2-(minX+maxX)/2*scale,oy=h*.92+minY*scale;
 const rgba=Buffer.alloc(w*h*4),depth=new Float64Array(w*h).fill(-Infinity);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x-w/2)/(w*.28))**2+((y-h*.9)/(h*.05))**2<1)rgba[(y*w+x)*4+3]=28;
 for(const face of faces){const v=face.p.map(p=>({x:ox+p.x*scale,y:oy-p.y*scale,z:p.z})),[a,b,c]=v,area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<.00001)continue;
 const left=Math.max(0,Math.floor(Math.min(...v.map(p=>p.x)))),right=Math.min(w-1,Math.ceil(Math.max(...v.map(p=>p.x)))),top=Math.max(0,Math.floor(Math.min(...v.map(p=>p.y)))),bottom=Math.min(h-1,Math.ceil(Math.max(...v.map(p=>p.y))));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const px=x+.5,py=y+.5,u=((b.y-c.y)*(px-c.x)+(c.x-b.x)*(py-c.y))/area,t=((c.y-a.y)*(px-c.x)+(a.x-c.x)*(py-c.y))/area,q=1-u-t;if(u<0||t<0||q<0)continue;const z=u*a.z+t*b.z+q*c.z,index=y*w+x;if(z<depth[index])continue;
 const tex=face.material.map instanceof T.DataTexture?sample(face.material.map,u*face.uv[0].x+t*face.uv[1].x+q*face.uv[2].x,u*face.uv[0].y+t*face.uv[1].y+q*face.uv[2].y):[1,1,1,1];if(tex[3]<face.material.alphaTest)continue;
 depth[index]=z;const color=face.colors[0].clone().multiplyScalar(u).add(face.colors[1].clone().multiplyScalar(t)).add(face.colors[2].clone().multiplyScalar(q)).multiply(face.material.color);
 for(let i=0;i<3;i++)rgba[index*4+i]=srgb(linear(tex[i])*[color.r,color.g,color.b][i]*face.brightness);rgba[index*4+3]=255;
 }}
 return png(rgba,w,h);
}

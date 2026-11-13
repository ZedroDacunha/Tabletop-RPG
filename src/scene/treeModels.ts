import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {TreeKind} from '../features/assets/treeKinds';

type V = [number, number, number];
const TAU = Math.PI * 2;
const vector = (a: V) => new T.Vector3(...a);
function random(seed: number) {
  return () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
}
/** Original procedural maps; deterministic and independent of DOM, downloads and canvas. */
function texture(w: number, h: number, pixel: (u: number, v: number) => number[], color = true) {
  const data = new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)data.set(pixel(x/w,y/h).map(n=>T.MathUtils.clamp(n,0,255)),(y*w+x)*4);
  const map=new T.DataTexture(data,w,h,T.RGBAFormat);
  map.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  return map;
}
function grainNoise(u:number,y:number,nx:number,ny:number){
  const x=u*nx,z=y*ny,ix=Math.floor(x),iz=Math.floor(z);
  const smooth=(a:number)=>a*a*(3-2*a),fx=smooth(x-ix),fz=smooth(z-iz);
  const hash=(a:number,b:number)=>{const n=Math.sin(((a%nx+nx)%nx)*127.1+((b%ny+ny)%ny)*311.7)*43758.5453;return n-Math.floor(n)};
  return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),fx),T.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),fx),fz);
}
function barkMaps(kind: TreeKind) {
  const pale=kind==='birch';
  const base=pale?[230,224,207]:kind==='deadtree'?[137,122,100]:[143,109,79];
  const relief=(u:number,y:number)=>{
    // Periodic around the trunk to avoid a vertical UV seam.
    const fine=Math.sin(TAU*(u*67+.1*Math.sin(y*TAU*11)));
    const knot=Math.sin(TAU*(u*5+.2*Math.sin(y*TAU*2)));
    if(pale){const band=Math.sin(y*TAU*23+Math.sin(u*TAU*7));return band>.88&&Math.sin(u*TAU*9+Math.floor(y*23)*2)>.1?.12:.79+.08*fine+.05*knot;}
    const noise=grainNoise(u,y,28,17),warp=grainNoise(u,y,9,5);
    const furrow=Math.sin(TAU*(u*15+.65*warp+.13*Math.sin(y*TAU*3)));
    const crack=Math.pow(Math.max(0,furrow),9);
    return .58+.18*noise+.07*fine+.05*knot-.30*crack;
  };
  return {
    map:texture(128,256,(u,y)=>[...base.map(c=>c*(.48+relief(u,y)*.7)),255]),
    bump:texture(128,256,(u,y)=>{const n=relief(u,y)*255;return[n,n,n,255]},false),
  };
}
function leafMap(kind: TreeKind) {
  const pine=kind==='pine',willow=kind==='willow';
  return texture(64,128,(u,y)=>{
    const x=(u-.5)*2,outline=Math.pow(Math.max(0,Math.sin(Math.PI*y)),willow?.8:.65);
    const lobes=kind==='oak'?.84+.16*Math.cos(y*Math.PI*10):1;
    let inside=Math.abs(x)<outline*lobes*.94;
    if(pine){const needle=Math.abs(Math.sin((y-Math.abs(x)*.25)*Math.PI*21));inside=(Math.abs(x)<.025||(needle<.60&&Math.abs(x)<outline*.95))&&y>.025&&y<.98;}
    const vein=Math.abs(x)<.025||Math.abs(Math.sin((y-Math.abs(x)*.32)*Math.PI*9))<.12;
    const tone=.8+.17*Math.sin(Math.PI*y)-Math.abs(x)*.14+(vein?.13:0);
    const base=pine?[91,132,90]:willow?[139,168,104]:kind==='birch'?[163,185,108]:[125,160,86];
    return[...base.map(c=>c*tone),inside?255:0];
  });
}

/** Curved branching and folded foliage, baked into one or two meshes per species.
 * The React renderer caches one model per species and clones only the object hierarchy.
 */
export function buildTreeModel(kind: TreeKind): T.Group {
  const rand=random({pine:137,oak:409,birch:617,deadtree:829,willow:1031}[kind]);
  const bark=barkMaps(kind);
  const wood=new T.MeshStandardMaterial({map:bark.map,bumpMap:bark.bump,bumpScale:kind==='birch'?.012:.045,roughness:.95,vertexColors:true});
  wood.name=`${kind}-bark`;
  const branches:T.BufferGeometry[]=[],leaves:T.BufferGeometry[]=[];
  function branch(points:V[],start:number,end:number,segments=7,sides=7){
    const curve=new T.CatmullRomCurve3(points.map(vector));
    const geo=new T.TubeGeometry(curve,segments,1,sides,false),length=curve.getLength();
    const pos=geo.getAttribute('position'),uv=geo.getAttribute('uv'),colors:number[]=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments,center=curve.getPointAt(t),radius=T.MathUtils.lerp(start,end,Math.pow(t,.82));
      for(let j=0;j<=sides;j++){
        const k=i*(sides+1)+j;
        const p=new T.Vector3().fromBufferAttribute(pos,k).sub(center).multiplyScalar(radius*(1+.055*Math.sin(j/sides*TAU*3+t*2))).add(center);
        // Roots touch the ground without floating or burying their lower rings.
        pos.setXYZ(k,p.x,Math.max(0,p.y),p.z);uv.setXY(k,j/sides,t*length*.65);
        const moss=kind!=='birch'&&kind!=='deadtree'?Math.max(0,1-p.y/.75)*.24:0;
        colors.push(1-moss,1-moss*.4,1-moss*1.8);
      }
    }
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    branches.push(geo.toNonIndexed());geo.dispose();
    for(const [t,radius] of [[0,start],[1,end]]){
      const cap=new T.CircleGeometry(radius,sides);
      cap.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),curve.getTangentAt(t).multiplyScalar(t===0?-1:1)));
      cap.translate(...curve.getPointAt(t).toArray());
      const cp=cap.getAttribute('position');for(let i=0;i<cp.count;i++)cp.setY(i,Math.max(0,cp.getY(i)));
      cap.setAttribute('color',new T.Float32BufferAttribute(Array(cp.count*3).fill(1),3));
      branches.push(cap.toNonIndexed());cap.dispose();
    }
  }
  function leaf(p:V,length:number,width:number,rotation:V){
    // Central ridge folds the blade: leaves have volume at oblique camera angles.
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute([-width/2,0,0,0,0,.012,width/2,0,0,-width/2,length,0,0,length,.035,width/2,length,0],3));
    geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,.5,0,1,0,0,1,.5,1,1,1],2));
    geo.setIndex([0,1,3,1,4,3,1,2,4,2,5,4]);
    const tone=.78+rand()*.36;
    geo.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:6},()=>[tone,tone,tone*(.92+rand()*.08)]).flat(),3));
    geo.computeVertexNormals();geo.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation)));
    geo.translate(...p);leaves.push(geo.toNonIndexed());geo.dispose();
  }
  function cluster(p:V,radius:number,count:number,size:number){
    for(let i=0;i<count;i++){
      const a=rand()*TAU,y=rand()*2-1,r=Math.cbrt(rand())*radius,ring=Math.sqrt(1-y*y);
      leaf([p[0]+Math.cos(a)*ring*r,p[1]+y*r*.65,p[2]+Math.sin(a)*ring*r],size*(.75+rand()*.5),size*(kind==='birch'?.65:.72),[(rand()-.5)*2.4,a,(rand()-.5)*2.5]);
    }
  }
  const roots=kind==='birch'?5:7;
  for(let i=0;i<roots;i++){
    const a=i*TAU/roots+.2+(rand()-.5)*.5,r=(kind==='birch'?.44:.65)+rand()*.17;
    branch([[0,.22,0],[Math.cos(a)*r*.45,.11,Math.sin(a)*r*.45],[Math.cos(a)*r,.025,Math.sin(a)*r]],kind==='birch'?.10:.16,.018,4,7);
  }
  if(kind==='pine'){
    branch([[0,.03,0],[.04,1.4,-.04],[-.07,2.9,.02],[.02,4.35,0]],.22,.015,16,10);
    for(let tier=0;tier<7;tier++){
      const y=1.1+tier*.44,reach=1.18-tier*.135;
      for(let j=0;j<7;j++){
        const a=j*TAU/7+tier*1.61+(rand()-.5)*.22,dx=Math.cos(a),dz=Math.sin(a);
        branch([[0,y,0],[dx*reach*.45,y-.08,dz*reach*.45],[dx*reach,y+.2,dz*reach]],.045*(1-tier*.09),.006,5,5);
        for(let k=1;k<=7;k++)for(const side of [-1,1]){
          const t=k/8,spread=(1-t)*.55;
          leaf([dx*reach*t,y+.03+t*.12,dz*reach*t],.48*(1-tier*.055),.38*(1-tier*.06),[Math.PI/2+side*.22,-a+Math.PI/2+side*spread,side*.25]);
        }
      }
    }
    cluster([0,4.03,0],.18,20,.34);
  }else if(kind==='deadtree'){
    branch([[0,.04,0],[-.12,1.1,.04],[.08,2.2,-.08],[-.28,3.15,.06],[-.16,4.05,.01]],.30,.045,16,10);
    for(let i=0;i<7;i++){
      const a=i*2.4,h=1.1+i*.34,reach=.7+(i%3)*.19;
      const mid:V=[Math.cos(a)*reach,h+.5,Math.sin(a)*reach],end:V=[mid[0]*1.15,h+1.1,mid[2]*1.15];
      branch([[0,h,0],[mid[0]*.45,h+.13,mid[2]*.45],mid,end],.13-i*.009,.022,8,7);
      branch([mid,[mid[0]*1.5,h+.66,mid[2]*1.3],[mid[0]*1.68,h+.85,mid[2]*1.1]],.046,.009,5,5);
    }
  }else if(kind==='birch'){
    branch([[0,.02,0],[.06,1.4,0],[-.16,2.8,.08],[.14,4.65,-.03]],.20,.025,16,10);
    for(let i=0;i<13;i++){
      const a=i*2.4,h=1.75+i*.18,reach=.98-i/13*.45,tip:V=[Math.cos(a)*reach,h+.68,Math.sin(a)*reach];
      branch([[-.03,h,0],[tip[0]*.4,h+.22,tip[2]*.4],tip],.065-i*.003,.008,7,6);
      for(const side of [-1,1]){
        const end:V=[tip[0]+Math.cos(a+side)*.3,tip[1]+.2,tip[2]+Math.sin(a+side)*.3];
        branch([[tip[0]*.65,h+.45,tip[2]*.65],tip,end],.025,.005,4,5);cluster(end,.38,38,.28);
      }
    }
    cluster([.12,4.48,0],.32,65,.25);
  }else{
    const willow=kind==='willow';
    branch([[0,.03,0],[-.09,.8,.08],[.16,1.65,0],[.04,2.5,.12],[.12,3.32,.05]],willow?.35:.34,.055,14,11);
    for(let i=0;i<9;i++){
      const a=i*2.4,h=1.35+i%3*.26,reach=1.02+rand()*.43;
      const fork:V=[Math.cos(a)*reach*.6,h+.85,Math.sin(a)*reach*.6],tip:V=[Math.cos(a)*reach,2.9+i%3*.23,Math.sin(a)*reach];
      branch([[.02,h,0],fork,tip],.16-i%3*.018,.018,9,8);
      for(let j=0;j<3;j++){
        const angle=a+(j-1)*.65,end:V=[tip[0]+Math.cos(angle)*.36,tip[1]+.24+j%2*.25,tip[2]+Math.sin(angle)*.36];
        branch([fork,tip,end],.055,.009,5,6);
        if(willow){
          cluster(end,.37,22,.24);
          for(let k=0;k<2;k++){
            const dx=Math.cos(angle+k*.6)*(.15+k*.08),dz=Math.sin(angle+k*.6)*(.15+k*.08),drop=1.25+rand()*.85;
            const curve=new T.CatmullRomCurve3([vector(end),vector([end[0]+dx,end[1]-.25,end[2]+dz]),vector([end[0]+dx*1.3,end[1]-drop,end[2]+dz*1.3])]);
            branch([end,curve.getPoint(.4).toArray() as V,curve.getPoint(1).toArray() as V],.014,.003,6,4);
            for(let n=1;n<=10;n++){const p=curve.getPoint(n/11);for(const side of [-1,1])leaf(p.toArray() as V,.27+rand()*.10,.075,[.15,angle+side*.6,Math.PI+side*.5]);}
          }
        }else cluster(end,.54+j%2*.07,60,.34);
      }
    }
    if(!willow)cluster([.12,3.55,0],.57,110,.34);
  }
  const group=new T.Group();group.name=`tree-${kind}`;
  function add(parts:T.BufferGeometry[],material:T.MeshStandardMaterial){
    if(!parts.length)return;
    const geometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;
    // Three.js 0.180 derives shadow materials from map + alphaTest, also on clones.
    group.add(mesh);
  }
  add(branches,wood);
  if(leaves.length){const mat=new T.MeshStandardMaterial({map:leafMap(kind),alphaTest:kind==='pine'?.16:.45,side:T.DoubleSide,roughness:.86,vertexColors:true});mat.name=`${kind}-leaves`;add(leaves,mat);}
  const bottom=new T.Box3().setFromObject(group).min.y;
  for(const child of group.children){const geometry=(child as T.Mesh).geometry;geometry.translate(0,-bottom,0);geometry.computeBoundingBox();geometry.computeBoundingSphere();}
  return group;
}

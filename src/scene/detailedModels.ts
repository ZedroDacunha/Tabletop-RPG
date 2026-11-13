import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {buildTreeModel} from './treeModels';
import type {DetailedKind} from '../features/assets/detailedKinds';

type V=[number,number,number];
const wood='#866044',lightWood='#b18b5d',darkWood='#513c2e',iron='#394348',brass='#bb9454',stone='#939c91',cloth='#718b78';
/** Hand-built geometry. Detail is baked and merged by material before rendering. */
export function buildDetailedModel(kind:DetailedKind):T.Group {
 if(kind==='willow')return buildTreeModel('willow');
 const root=new T.Group();const materials=new Map<string,T.MeshStandardMaterial>();
 const mat=(color:string,metal=0,emissive=false)=>{const key=`${color}/${metal}/${emissive}`;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.4:.88,metalness:metal,flatShading:true,...(emissive?{emissive:color,emissiveIntensity:1.6}:{}),side:T.DoubleSide}));return materials.get(key)!};
 const mesh=(g:T.BufferGeometry,p:V,c:string,r:V=[0,0,0],s:V=[1,1,1],metal=0,emissive=false)=>{const m=new T.Mesh(g,mat(c,metal,emissive));m.position.set(...p);m.rotation.set(...r);m.scale.set(...s);root.add(m);return m};
 const box=(p:V,s:V,c=wood,r:V=[0,0,0],metal=0)=>mesh(new T.BoxGeometry(...s),p,c,r,[1,1,1],metal);
 const cyl=(p:V,top:number,bottom:number,h:number,c=wood,r:V=[0,0,0],n=12,metal=0)=>mesh(new T.CylinderGeometry(top,bottom,h,n),p,c,r,[1,1,1],metal);
 const orb=(p:V,s:V,c:string)=>mesh(new T.IcosahedronGeometry(1,1),p,c,[0,0,0],s);
 const ring=(p:V,radius:number,tube:number,c=iron,r:V=[Math.PI/2,0,0])=>mesh(new T.TorusGeometry(radius,tube,5,16),p,c,r,[1,1,1],c===iron?.65:0);
 const beam=(a:V,b:V,width:number,c=wood)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5);const m=mesh(new T.CylinderGeometry(width*.8,width,av.distanceTo(bv),7),mid.toArray() as V,c);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize())};
 const legs=(xs:number[],zs:number[],h:number,c=darkWood)=>xs.forEach(x=>zs.forEach(z=>box([x,h/2,z],[.12,h,.12],c)));
 const planks=(p:V,width:number,depth:number,count:number,c=wood)=>{for(let i=0;i<count;i++)box([p[0]-width/2+(i+.5)*width/count,p[1],p[2]],[width/count-.025,.1,depth],i%2?c:lightWood)};
 const studs=(xs:number[],ys:number[],z:number)=>xs.forEach(x=>ys.forEach(y=>orb([x,y,z],[.035,.035,.025],brass)));
 const flame=(p:V,size=.3)=>{mesh(new T.ConeGeometry(size,size*3,7),[p[0],p[1]+size,p[2]],'#e88e3d',[0,0,0],[1,1,1],0,true);mesh(new T.ConeGeometry(size*.6,size*2,5),[p[0],p[1]+size*.6,p[2]+.02],'#ffe1a0',[0,0,0],[1,1,1],0,true)};
 const pot=(x:number,z:number,scale=1,c='#9f6650')=>{const points=[[.12,0],[.28,.08],[.36,.35],[.27,.55],[.18,.62],[.19,.69]].map(([a,b])=>new T.Vector2(a*scale,b*scale));mesh(new T.LatheGeometry(points,14),[x,0,z],c);cyl([x,.64*scale,z],.15*scale,.15*scale,.015,darkWood);ring([x,.69*scale,z],.19*scale,.025*scale,c)};
 const foliage=(x:number,y:number,z:number,scale:number,c:string)=>orb([x,y,z],[scale,scale*.7,scale*.85],c);
 switch(kind){
 case 'fern':
  for(let i=0;i<9;i++){const a=i*2.4,len=.7+(i%3)*.13;const end:V=[Math.cos(a)*len,.25+i%2*.15,Math.sin(a)*len];beam([0,.03,0],end,.018,'#73924f');for(let j=1;j<5;j++){const t=j/5;for(const side of [-1,1]){const off=(1-t)*.24*side;const x=end[0]*t+Math.cos(a+Math.PI/2)*off,z=end[2]*t+Math.sin(a+Math.PI/2)*off;mesh(new T.OctahedronGeometry(1),[x,.1+end[1]*t,z],i%2?'#5f894c':'#8eab64',[.2,a,0],[.08,.025,.2*(1-t)+.05]);}}}break;
 case 'flowers':
  for(let i=0;i<11;i++){const a=i*2.4,r=.12*Math.sqrt(i),x=Math.cos(a)*r,z=Math.sin(a)*r,h=.3+(i%4)*.09;beam([x,0,z],[x,h,z],.013,'#527c47');orb([x+.07,h*.5,z],[.12,.035,.05],'#779a60');for(let j=0;j<5;j++){const b=j*1.257;orb([x+Math.cos(b)*.065,h,z+Math.sin(b)*.065],[.075,.035,.055],i%2?'#d6b3d0':'#e7cc83')}orb([x,h+.025,z],[.035,.025,.035],'#d29d45')}break;
 case 'stump':
  cyl([0,.36,0],.45,.61,.72,darkWood,[0,0,0],10);cyl([0,.728,0],.42,.42,.018,'#c49d68',[0,0,0],20);
  for(const r of [.13,.25,.36])ring([0,.743,0],r,.012,'#927147');
  for(let i=0;i<9;i++){const a=i*.698;beam([Math.cos(a)*.4,.4,Math.sin(a)*.4],[Math.cos(a)*.85,.06,Math.sin(a)*.85],.12,wood)}beam([.3,.4,0],[.8,.9,0],.13,darkWood);break;
 case 'boulder':
  for(let i=0;i<5;i++){const x=(i%3-1)*.65,z=(Math.floor(i/3)-.5)*.7;orb([x,.38+(i%2)*.3,z],[.75,.55+(i%2)*.3,.65],i%2?'#778880':'#a2aaa0');foliage(x+.1,.85+(i%2)*.5,z,.36,'#6d8558')}break;
 case 'reeds':
  for(let i=0;i<10;i++){const a=i*2.4,x=Math.cos(a)*.13*Math.sqrt(i),z=Math.sin(a)*.13*Math.sqrt(i),h=.8+(i%4)*.2;cyl([x,h/2,z],.018,.024,h,'#8a9b58', [0,0,.07]);cyl([x-.04,h,z],.055,.055,.3,'#7e593d');beam([x,.08,z],[x+.3,.65,z+.18],.025,'#678351')}break;
 case 'cottage':{
  box([0,.14,0],[3.5,.28,3],stone);box([0,1.45,0],[3.2,2.6,2.7],'#c4b99b');
  for(const x of [-1.5,0,1.5])for(const z of [-1.38,1.38])box([x,1.5,z],[.16,2.7,.13],darkWood);
  for(const y of [.4,2.5])for(const z of [-1.4,1.4])box([0,y,z],[3.3,.14,.14],darkWood);
  const shape=new T.Shape();shape.moveTo(-1.6,0);shape.lineTo(1.6,0);shape.lineTo(0,1.3);shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth:2.7,bevelEnabled:false}),[0,2.75,-1.35],'#c4b99b');
  for(const side of [-1,1]){for(let row=0;row<4;row++)for(let col=0;col<8;col++){const x=side*(.22+row*.46);box([x,4.03-Math.abs(x)*.81,-1.58+col*.45],[.61,.09,.47],(row+col)%3?'#657d78':'#81948a',[0,0,-side*.68]);}for(const z of [-1.4,1.4])box([side*.75,1.45,z],[.12,2.2,.1],wood,[0,0,side*.6])}
  for(const x of [-.8,.8]){box([x,1.5,1.43],[.64,.74,.08],darkWood);box([x,1.5,1.48],[.5,.6,.03],'#8ca9a2');box([x,1.5,1.51],[.06,.7,.04],lightWood);box([x,1.5,1.51],[.6,.06,.04],lightWood);box([x,1.06,1.48],[.8,.12,.3],wood)}
  box([0,.91,-1.43],[.78,1.55,.1],darkWood);for(let i=0;i<5;i++)box([-.3+i*.15,.91,-1.5],[.13,1.5,.06],wood);orb([.22,.9,-1.55],[.06,.06,.06],brass);box([.95,3.9,-.5],[.48,1.35,.5],stone);box([.95,4.62,-.5],[.6,.14,.62],'#666f68');break;}
 case 'gate':
  for(const x of [-1.05,1.05]){box([x,1.3,0],[.34,2.6,.4],darkWood);cyl([x,2.7,0],0,.25,.3,brass)}box([0,2.52,0],[2.5,.2,.45],wood);
  for(let i=0;i<9;i++)box([-.88+i*.22,1.2,0],[.205,2.25,.15],i%2?wood:lightWood);
  for(const y of [.48,1.8])box([0,y,.1],[1.95,.13,.06],iron);studs([-.8,-.4,0,.4,.8],[.48,1.8],.15);ring([.23,1.1,.16],.11,.025,iron,[0,0,0]);break;
 case 'stonewall':
  box([0,.12,0],[3.2,.24,.9],'#707b70');for(let y=0;y<5;y++)for(let x=0;x<5;x++)box([-1.22+x*.61+(y%2?.12:0),.43+y*.38,0],[.58,.35,.65],(x+y)%3?'#929f91':'#abb4a2');
  for(let i=0;i<6;i++)box([-1.3+i*.52,2.2,0],[.5,.17,.82],'#bac0ae');for(let i=0;i<7;i++)foliage(-1.1+i*.3,.26, .38,.15,'#6b8157');break;
 case 'woodfloor':
  box([0,.06,0],[2.55,.12,2.55],darkWood);planks([0,.16,0],2.5,2.5,8);for(let i=0;i<8;i++)for(const z of [-1.1,1.1])orb([-1.1+i*.312,.22,z],[.025,.012,.025],iron);break;
 case 'palisade':
  for(let i=0;i<9;i++){const x=-1.35+i*.34;cyl([x,1,0],.16,.19,2,i%2?wood:darkWood,[0,0,0],7);cyl([x,2.2,0],0,.16,.4,lightWood,[0,0,0],7)}for(const y of [.45,1.5])box([0,y,.2],[3.15,.13,.11],wood);break;
 case 'dock':
  planks([0,.5,0],2,3.7,7);for(const x of [-.9,.9])for(const z of [-1.55,1.55]){cyl([x,.6,z],.13,.16,1.2,darkWood);for(const y of [.82,.91,1])ring([x,y,z],.15,.025,'#c4ac7c');}box([0,.3,0],[1.8,.17,3.7],darkWood);break;
 case 'table':
  legs([-.9,.9],[-.42,.42],1);planks([0,1.05,0],2.3,1.2,7);box([0,.3,0],[1.9,.12,.12],darkWood);for(const x of [-.9,.9])box([x,.85,0],[.12,.13,1.05],wood);studs([-.9,.9],[.9],.53);break;
 case 'chair':
  legs([-.3,.3],[-.3,.3],.6);planks([0,.64,0],.85,.8,4);for(const x of [-.34,.34])box([x,1.08,-.32],[.1,.85,.1],darkWood);for(let i=0;i<3;i++)box([-.23+i*.23,1.14,-.33],[.18,.52,.09],wood);box([0,1.47,-.33],[.84,.12,.14],lightWood);break;
 case 'bench':
  legs([-.85,.85],[-.22,.22],.55);planks([0,.6,0],2.2,.7,6);for(const x of [-.85,.85])box([x,.3,0],[.16,.12,.7],wood);box([0,.25,0],[1.9,.13,.1],darkWood);break;
 case 'bed':
  legs([-.62,.62],[-1,1],.46);box([0,.44,0],[1.5,.2,2.3],wood);box([0,.62,0],[1.35,.22,2.15],'#ddd1b2');box([0,.77,.35],[1.37,.1,1.44],cloth);box([0,.8,-.73],[.9,.2,.43],'#eadfc9');
  for(const x of [-.65,.65])box([x,.91,-1.06],[.13,1,.14],darkWood);box([0,1.13,-1.06],[1.4,.42,.12],wood);for(let i=0;i<7;i++)box([-.6+i*.2,.83,.37],[.018,.025,1.35],'#b9baa0');break;
 case 'bookshelf':
  box([0,1.2,-.28],[1.65,2.4,.09],darkWood);for(const x of [-.82,.82])box([x,1.2,0],[.13,2.4,.65],wood);for(const y of [.12,.85,1.58,2.35])box([0,y,0],[1.8,.13,.72],lightWood);
  for(let y=0;y<3;y++)for(let i=0;i<8;i++){const x=-.64+i*.18,h=.4+(i%3)*.07;box([x,.24+y*.73+h/2,.03],[.14,h,.4],['#7b4e45','#5f7d72','#b39c67','#6a6781'][i%4]);for(const yy of [.32+y*.73,.52+y*.73])box([x,yy,.24],[.12,.025,.015],brass)}break;
 case 'counter':
  box([0,.52,0],[2.5,1.04,.95],darkWood);for(let i=0;i<10;i++)box([-1.15+i*.255,.53,.49],[.23,.9,.06],i%2?wood:lightWood);planks([0,1.09,0],2.8,1.18,8);for(const x of [-1.15,1.15])box([x,.53,.55],[.14,1.02,.1],darkWood);break;
 case 'bedroll':
  box([0,.09,0],[.85,.18,1.8],'#a99b7e');box([0,.2,.2],[.89,.06,1.35],'#667c6d');cyl([0,.29,-.75],.24,.24,.88,'#809483',[0,0,Math.PI/2],16);for(const x of [-.27,.27])ring([x,.29,-.75],.247,.035,darkWood,[0,Math.PI/2,0]);break;
 case 'cookingpot':
  for(let i=0;i<3;i++){const a=i*2.094;beam([Math.cos(a)*.85,.03,Math.sin(a)*.85],[0,1.65,0],.06,darkWood)}
  mesh(new T.SphereGeometry(.46,16,10,0,Math.PI*2,0,Math.PI/2),[0,.8,0],iron,[Math.PI,0,0]);ring([0,.8,0],.46,.04);cyl([0,.78,0],.4,.4,.02,'#755c36');ring([0,1,0],.44,.025,iron,[0,0,0]);beam([0,1.4,0],[0,1.64,0],.02,iron);for(let i=0;i<5;i++){const a=i*1.26;orb([Math.cos(a)*.6,.12,Math.sin(a)*.6],[.2,.15,.2],stone)}flame([0,.14,0],.17);break;
 case 'supplystack':
  for(const [x,y,z] of [[-.45,.4,0],[.45,.3,.2],[-.15,1,.03]]){box([x,y,z],[.78,.7,.8],wood);for(const dx of [-.28,.28])box([x+dx,y,z+.42],[.09,.74,.06],lightWood);box([x,y,z+.46],[.1,.95,.04],lightWood,[0,0,.7]);}orb([.8,.35,-.3],[.4,.45,.4],'#b4a081');cyl([.8,.8,-.3],.08,.12,.1,'#827052');break;
 case 'torch':
  cyl([0,.8,0],.05,.08,1.6,darkWood);cyl([0,.12,0],.22,.3,.24,iron);for(const y of [1.35,1.48,1.61])ring([0,y,0],.12,.035,iron);flame([0,1.7,0],.18);break;
 case 'brazier':
  for(let i=0;i<3;i++){const a=i*2.094;beam([Math.cos(a)*.38,0,Math.sin(a)*.38],[Math.cos(a)*.25,.75,Math.sin(a)*.25],.06,iron)}
  cyl([0,.75,0],.47,.27,.35,iron,[0,0,0],12,.65);ring([0,.94,0],.48,.04,brass);for(let i=0;i<6;i++){const a=i*1.047;orb([Math.cos(a)*.26,.96,Math.sin(a)*.26],[.12,.09,.12],'#342e28')}flame([0,1,0],.24);break;
 case 'candles':
  cyl([0,.06,0],.28,.35,.12,brass,[0,0,0],12,.6);cyl([0,.45,0],.045,.08,.8,brass);for(const x of [-.38,0,.38]){beam([0,.55,0],[x,.83,0],.035,brass);cyl([x,.85,0],.13,.08,.08,brass);cyl([x,1.04,0],.065,.07,.32,'#e5d9b5');flame([x,1.23,0],.04)}break;
 case 'cage':
  box([0,.1,0],[1.65,.2,1.65],darkWood);for(const x of [-.75,.75])for(const z of [-.75,.75])box([x,1,z],[.1,1.8,.1],iron);
  for(let i=0;i<7;i++){const n=-.65+i*.217;for(const z of [-.75,.75])cyl([n,1,z],.026,.026,1.8,iron);for(const x of [-.75,.75])cyl([x,1,n],.026,.026,1.8,iron);box([n,1.94,0],[.04,.04,1.5],iron)}
  for(const y of [.25,1.8]){for(const z of [-.75,.75])box([0,y,z],[1.55,.08,.08],iron);for(const x of [-.75,.75])box([x,y,0],[.08,.08,1.55],iron)}box([.15,1,.8],[.22,.25,.09],brass);ring([0,2.1,0],.15,.04,iron,[0,0,0]);break;
 case 'sarcophagus':
  box([0,.12,0],[1.45,.24,2.5],'#747f76');box([0,.58,0],[1.2,.72,2.3],stone);box([0,.99,0],[1.42,.16,2.5],'#bbc0ac');box([0,1.1,0],[1.08,.08,2.13],'#a1ad9a');
  orb([0,1.2,-.58],[.2,.12,.23],'#c8c9b4');box([0,1.18,.1],[.4,.1,1],'#c1c6b0');for(const x of [-.25,.25])box([x,1.2,-.03],[.1,.1,.5],'#bcc4b0',[0,x*2,0]);for(const z of [-.9,0,.9])box([.61,.6,z],[.03,.45,.13],'#707e74');break;
 case 'spikes':
  box([0,.07,0],[1.8,.14,1.8],darkWood);for(let x=0;x<4;x++)for(let z=0;z<4;z++){cyl([-.62+x*.42,.4,-.62+z*.42],0,.09,.65,iron,[0,0,0],6,.7);orb([-.62+x*.42,.15,-.62+z*.42],[.12,.035,.12],brass)}break;
 case 'gravestone':
  box([0,.1,0],[1.1,.2,.65],'#748275');box([0,.7,0],[.78,1.1,.25],stone);cyl([0,1.26,0],.39,.39,.25,stone,[Math.PI/2,0,0],20);box([0,.9,.14],[.07,.48,.025],'#626f66');box([0,1.02,.14],[.34,.07,.025],'#626f66');for(const y of [.55,.45])box([0,y,.14],[.4,.022,.025],'#7c887c');foliage(-.38,.2,.15,.22,'#788953');break;
 case 'marketstall':
  legs([-1.2,1.2],[-.5,.5],2.35);box([0,.95,0],[2.5,.15,1.3],wood);for(let i=0;i<10;i++){const x=-1.2+i*.265;box([x,.53,.59],[.24,.85,.06],wood);box([x,2.35,0],[.26,.08,1.65],i%2?'#c6b28c':'#688477',[.15,0,0]);box([x,2.18,.8],[.26,.27,.04],i%2?'#c6b28c':'#688477');}for(let i=0;i<12;i++)orb([-.75+(i%4)*.17,1.12, -.1+Math.floor(i/4)*.16],[.1,.09,.1],i%3?'#b68747':'#9a5546');pot(.65,0,.8);break;
 case 'weaponrack':
  legs([-.8,.8],[-.24,.24],1.7);for(const y of [.6,1.4])box([0,y,0],[1.9,.12,.13],wood);
  for(let i=0;i<4;i++){const x=-.6+i*.4;box([x,.91,.18],[.07,1.3,.04],'#b2bfbd',[0,0,.08],.7);box([x,1.54,.18],[.27,.06,.08],brass);cyl([x,1.69,.18],.04,.04,.22,darkWood)}break;
 case 'pots':pot(-.35,0,1.3);pot(.4,.25,.8,'#b78662');pot(.2,-.4,.6,'#677f75');break;
 case 'signpost':
  cyl([0,1.15,0],.07,.12,2.3,darkWood);box([.12,1.85,0],[1.6,.4,.12],wood,[0,0,.05]);box([-.15,1.29,0],[1.25,.34,.12],lightWood,[0,0,-.08]);
  for(const y of [1.25,1.85]){orb([0,y,.08],[.04,.04,.025],iron);box([.25,y,.075],[.4,.035,.025],darkWood);box([.45,y+.05,.075],[.16,.035,.025],darkWood,[0,0,-.6]);}orb([0,.1,0],[.38,.14,.32],stone);break;
 }
 root.updateMatrixWorld(true);
 // Merge per material: repeated timber, leaves and masonry cost one draw call per finish.
 const groups=new Map<T.Material,T.BufferGeometry[]>();
 root.traverse(o=>{if(o instanceof T.Mesh){let geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geometry.index){const expanded=geometry.toNonIndexed();geometry.dispose();geometry=expanded}geometry.deleteAttribute('uv');const m=o.material as T.Material;if(!groups.has(m))groups.set(m,[]);groups.get(m)!.push(geometry)}});
 const result=new T.Group();result.name=kind;
 groups.forEach((geometries,material)=>{const merged=mergeGeometries(geometries,false);if(!merged)throw new Error(`Falha ao montar ${kind}`);merged.computeBoundingBox();merged.computeBoundingSphere();const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;result.add(m);geometries.forEach(g=>g.dispose())});
 root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose()});
 return result;
}

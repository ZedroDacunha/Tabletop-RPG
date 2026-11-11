import {useEffect,useRef} from 'react';
import {AssetArt} from '../editor/AssetArt';
import {downloadFile} from '../features/projects/storage';
import type {ViewportProps} from './Viewport';

/** Editable schematic for devices without WebGL. Never presented as the 3D renderer. */
export function CompatibleMap({project,selected,placement,onSelect,onPlace,command,onError}:ViewportProps){
 const ref=useRef<SVGSVGElement>(null);const s=project.settings;const unit=650/s.size;
 const point=(x:number,z:number)=>[500+(x-z)*unit,420+(x+z)*unit*.5];
 const corners=[[-s.size/2,-s.size/2],[s.size/2,-s.size/2],[s.size/2,s.size/2],[-s.size/2,s.size/2]].map(([x,z])=>point(x,z).join(',')).join(' ');
 const lines=Array.from({length:Math.floor(s.size/s.gridSize)+1},(_,i)=>-s.size/2+i*s.gridSize);
 useEffect(()=>{if(!command.id)return;if(command.type==='image'&&ref.current){downloadFile(new Blob([new XMLSerializer().serializeToString(ref.current)],{type:'image/svg+xml'}),`${project.name}.svg`)}else onError('A navegação da câmera 3D requer WebGL. No modo compatível, edite as peças pelo painel de propriedades.');},[command.id]);
 return <div className="compatible-map">
  <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" aria-label="Mapa esquemático em modo de compatibilidade" onClick={e=>{
   if(!placement){onSelect(null);return}const svg=ref.current,ctm=svg?.getScreenCTM();if(!svg||!ctm)return;
   const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const local=pt.matrixTransform(ctm.inverse());
   let x=((local.x-500)/unit+2*(local.y-420)/unit)/2,z=(2*(local.y-420)/unit-(local.x-500)/unit)/2;
   if(Math.abs(x)>s.size/2||Math.abs(z)>s.size/2)return;if(s.snap){x=Math.round(x/s.gridSize)*s.gridSize;z=Math.round(z/s.gridSize)*s.gridSize;}onPlace([x,0,z]);
  }}>
   <defs><radialGradient id="map-ground"><stop stopColor="#728063"/><stop offset="1" stopColor="#4d614b"/></radialGradient></defs>
   <rect width="1000" height="800" fill={s.background}/>
   <polygon points={corners} transform="translate(0 12)" fill="#354737"/>
   <polygon points={corners} fill="url(#map-ground)" stroke="#8ca377" strokeWidth="1"/>
   {s.grid&&<g stroke="#b3c49a" strokeWidth=".6" opacity=".3">{lines.map(n=>{const a=point(n,-s.size/2),b=point(n,s.size/2),c=point(-s.size/2,n),d=point(s.size/2,n);return <g key={n}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/><line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]}/></g>})}</g>}
   {[...project.objects].filter(o=>o.visible).sort((a,b)=>(a.kind==='floor'?-1000:0)+a.position[0]+a.position[2]-((b.kind==='floor'?-1000:0)+b.position[0]+b.position[2])).map(o=>{
    const [x,y]=point(o.position[0],o.position[2]);const w=unit*4*Math.min(o.scale[0],5),h=unit*3*Math.min(o.scale[1],5);
    return <g key={o.id} role="button" aria-label={`Selecionar ${o.name}`} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(o.id)}}} onClick={e=>{if(!placement){e.stopPropagation();onSelect(o.id)}}} style={{cursor:placement?'crosshair':'pointer'}}>
     <title>{o.name}{o.kind==='model'?' (representação do modelo importado)':''}</title>
     {selected===o.id&&<ellipse cx={x} cy={y} rx={unit*1.7} ry={unit*.8} fill="#d3edaf22" stroke="#e1f9bc" strokeWidth="2"/>}
     <svg x={x-w/2} y={y-h*.8-o.position[1]*unit} width={w} height={h} viewBox="0 0 140 100" overflow="visible"><AssetArt kind={o.kind}/></svg>
    </g>
   })}
  </svg>
  <div className="compatibility-note"><strong>Modo compatível 2D</strong><span>WebGL indisponível neste navegador. Ative a aceleração gráfica para explorar em 3D.</span></div>
 </div>
}

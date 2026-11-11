import {catalog} from '../features/assets/catalog';
import type {ProjectSummary} from '../features/projects/library';

const COLORS:Record<string,string>=Object.fromEntries(catalog.map(item=>[item.kind,item.color]));

export function MapThumb({summary}:{summary:ProjectSummary}){
 const half=Math.max(1,summary.size/2);
 return <svg className="map-thumb" viewBox="-1 -1 2 2" aria-hidden="true" focusable="false">
  <rect x="-1" y="-1" width="2" height="2" rx=".18" fill={summary.background}/>
  <rect x="-.86" y="-.86" width="1.72" height="1.72" rx=".1" fill="#7f9767" opacity=".26"/>
  <g>{summary.dots.map((dot,index)=><circle key={index} cx={dot.x/half} cy={dot.z/half} r={.075} fill={COLORS[dot.kind]??'#9eafa9'} stroke="#1b241a" strokeWidth=".012"/>)}</g>
 </svg>;
}

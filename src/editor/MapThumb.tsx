import {catalog} from '../features/assets/catalog';
import type {ProjectSummary} from '../features/projects/library';

const COLORS:Record<string,string>=Object.fromEntries(catalog.map(item=>[item.kind,item.color]));

export function MapThumb({summary}:{summary:ProjectSummary}){
 const half=Math.max(1,summary.size/2);
 return <svg className="map-thumb" viewBox="-1 -1 2 2" aria-hidden="true" focusable="false">
  <rect x="-1" y="-1" width="2" height="2" rx=".18" fill={summary.background}/>
  <g opacity=".9">{summary.dots.map((dot,index)=><circle key={index} cx={dot.x/half} cy={dot.z/half} r={.055} fill={COLORS[dot.kind]??'#9eafa9'}/>)}</g>
 </svg>;
}

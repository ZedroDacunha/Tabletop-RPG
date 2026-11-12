import type {Vec3} from '../projects/project';

export type Viewpoint={id:string;name:string;position:Vec3;target:Vec3;travel?:number};
export const MAX_VIEWS=24;
export const VIEW_NAME_MAX=60;
export const DEFAULT_TRAVEL=1.2;
export const MAX_TRAVEL=6;
export const TRAVEL_OPTIONS=[0,0.5,1,1.5,2,3] as const;
export function clampTravel(value:number):number{
 if(!Number.isFinite(value))return DEFAULT_TRAVEL;
 return Math.min(MAX_TRAVEL,Math.max(0,Math.round(value*10)/10));
}
export function travelOf(view:Viewpoint|undefined):number{
 return clampTravel(view?.travel??DEFAULT_TRAVEL);
}
export function travelLabel(seconds:number):string{
 const value=clampTravel(seconds);
 return `${value.toFixed(1).replace('.0','').replace('.',',')} s`;
}

export function makeViewpoint(name:string,position:Vec3,target:Vec3,id:()=>string=()=>crypto.randomUUID()):Viewpoint{
 const clean=name.trim().slice(0,VIEW_NAME_MAX);
 return {id:id(),name:clean||'Vista',position:[...position] as Vec3,target:[...target] as Vec3};
}
export function nextViewIndex(current:number,length:number,step:1|-1):number{
 if(length<=0)return 0;
 return ((current+step)%length+length)%length;
}
export function defaultViewName(views:Viewpoint[]|undefined):string{
 const count=(views??[]).length+1;
 return `Vista ${count}`;
}

export function easeInOut(progress:number):number{
 const t=Math.min(1,Math.max(0,Number.isFinite(progress)?progress:1));
 return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
}
export function travelProgress(startedAt:number,now:number,seconds:number):number{
 if(!(seconds>0))return 1;
 const elapsed=Number.isFinite(now-startedAt)?now-startedAt:seconds*1000;
 return Math.min(1,Math.max(0,elapsed/(seconds*1000)));
}

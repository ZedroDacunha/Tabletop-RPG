import type {Vec3} from '../projects/project';

export type Viewpoint={id:string;name:string;position:Vec3;target:Vec3};
export const MAX_VIEWS=24;
export const VIEW_NAME_MAX=60;

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

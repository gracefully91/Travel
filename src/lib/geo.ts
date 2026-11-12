import metadata from '../../data/processed/metadata.json';
export const ORIGIN=metadata.origin;
export type Point=[number,number];
export function toLocal(lat:number,lon:number):Point{return [(lon-ORIGIN.lon)*Math.PI/180*6378137*Math.cos(ORIGIN.lat*Math.PI/180),(lat-ORIGIN.lat)*Math.PI/180*6378137]}
export function toGeo([x,z]:Point){return {lat:ORIGIN.lat+z/6378137*180/Math.PI,lon:ORIGIN.lon+x/(6378137*Math.cos(ORIGIN.lat*Math.PI/180))*180/Math.PI}}
export function pathLength(p:Point[]){return p.slice(1).reduce((s,b,i)=>s+Math.hypot(b[0]-p[i][0],b[1]-p[i][1]),0)}
export function samplePath(p:Point[],distance:number){for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=len||i===p.length-1){const t=Math.min(1,distance/len);return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[0]-a[0],b[1]-a[1])}}distance-=len}return {x:p[0][0],z:p[0][1],angle:0}}

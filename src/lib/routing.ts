import {map,roadWidth,type Feature} from './osm';
import type {Point} from './geo';
const key=(p:Point)=>p.map(v=>v.toFixed(4)).join(',');
export type RoadEdge={from:Point,to:Point,road:Feature,reverse:boolean,cost:number};
export function roadDirections(tags:Record<string,string>):number[]{
 const one=tags['oneway:motor_vehicle']??tags.oneway;
 if(one==='-1'||one==='reverse')return [-1];
 if(['yes','1','true'].includes(one))return [1];
 if(!['no','0','false'].includes(one)&&tags.junction==='roundabout')return [1];
 return [1,-1];
}
// Use the saved OSM direction without station-specific reversals.
export function effectiveRoadDirections(road:Feature):number[]{return roadDirections(road.tags)}
export function directedEdges(roads:Feature[]=map.roads):RoadEdge[]{return roads.filter(r=>!['footway','path','steps','pedestrian','cycleway'].includes(r.tags.highway)&&r.tags.tunnel!=='yes'&&!['no','private'].includes(r.tags.motor_vehicle??r.tags.vehicle??r.tags.access)).flatMap(road=>road.points.slice(1).flatMap((b,i)=>effectiveRoadDirections(road).map(d=>{const a=road.points[i];return {from:d===1?a:b,to:d===1?b:a,road,reverse:d===-1,cost:Math.hypot(b[0]-a[0],b[1]-a[1])}})))}
// Search includes the incoming edge so a bidirectional junction cannot trigger an instant U-turn.
export function roadLoop(first:Feature):Point[]{
 const graph=new Map<string,RoadEdge[]>();for(const e of directedEdges())graph.set(key(e.from),[...(graph.get(key(e.from))||[]),e]);
 const initial=effectiveRoadDirections(first)[0]===-1?[...first.points].reverse():first.points;
 const start=key(initial.at(-1)!),end=key(initial[0]),initialPrev=key(initial.at(-2)!);
 const state=(node:string,previous:string)=>`${node}|${previous}`;
 const firstState=state(start,initialPrev),dist=new Map([[firstState,0]]),prev=new Map<string,{state:string,p:Point}>(),pending=new Set([firstState]);let final='';
 while(pending.size){const u=[...pending].sort((a,b)=>dist.get(a)!-dist.get(b)!)[0];pending.delete(u);const [node,previous]=u.split('|');if(node===end&&previous!==key(initial[1])){final=u;break}for(const e of graph.get(node)||[]){const next=key(e.to);if(next===previous)continue;const v=state(next,node),d=dist.get(u)!+e.cost;if(d<(dist.get(v)??Infinity)){dist.set(v,d);prev.set(v,{state:u,p:e.to});pending.add(v)}}}
 if(!final)return [];const tail:Point[]=[];while(final!==firstState){const v=prev.get(final)!;tail.unshift(v.p);final=v.state}return [...initial,...tail];
}
export function edgeFor(a:Point,b:Point,edges=directedEdges()){return edges.find(e=>key(e.from)===key(a)&&key(e.to)===key(b))}
export function laneOffset(road:Feature){if(effectiveRoadDirections(road).length===1||road.tags.lanes==='1')return 0;const lanes=Math.max(2,Number(road.tags.lanes)||2);return roadWidth(road)/2-roadWidth(road)/lanes/2}
// X=east, Z=north: the geographic right of heading (dx,dz) is (dz,-dx).
export function drivingPath(centerline:Point[]):Point[]{
 if(centerline.length<3)return centerline;
 const edges=directedEdges();const segments=centerline.slice(1).map((b,i)=>{const a=centerline[i],e=edgeFor(a,b,edges);if(!e)throw Error('Vehicle route contains a prohibited or disconnected edge');const distance=Math.hypot(b[0]-a[0],b[1]-a[1]),offset=laneOffset(e.road);const dx=(b[1]-a[1])/distance*offset,dz=-(b[0]-a[0])/distance*offset;return {a:[a[0]+dx,a[1]+dz] as Point,b:[b[0]+dx,b[1]+dz] as Point}});
 const joined=segments.flatMap((s,i):Point[]=>{const previous=segments[(i+segments.length-1)%segments.length],len=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]),t=Math.min(.2,2.5/len);return [[(previous.b[0]+s.a[0])/2,(previous.b[1]+s.a[1])/2],[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t],[s.b[0]+(s.a[0]-s.b[0])*t,s.b[1]+(s.a[1]-s.b[1])*t]]}).filter((p,i,all)=>i===0||Math.hypot(p[0]-all[i-1][0],p[1]-all[i-1][1])>.0001);
 // Round short corners inside the road corridor. The vehicle uses this exact path's tangent.
 const smooth:Point[]=[];joined.forEach((p,i)=>{const a=joined[(i+joined.length-1)%joined.length],b=joined[(i+1)%joined.length];const before=Math.hypot(p[0]-a[0],p[1]-a[1]),after=Math.hypot(b[0]-p[0],b[1]-p[1]);const radius=Math.min(1.5,before*.2,after*.2);const entry:Point=[p[0]+(a[0]-p[0])*radius/before,p[1]+(a[1]-p[1])*radius/before],exit:Point=[p[0]+(b[0]-p[0])*radius/after,p[1]+(b[1]-p[1])*radius/after];for(let j=0;j<=4;j++){const t=j/4,u=1-t;smooth.push([u*u*entry[0]+2*u*t*p[0]+t*t*exit[0],u*u*entry[1]+2*u*t*p[1]+t*t*exit[1]])}});smooth.push(smooth[0]);return smooth;
}

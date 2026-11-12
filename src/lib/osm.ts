import roads from '../../data/processed/roads.json';
import buildings from '../../data/processed/buildings.json';
import railways from '../../data/processed/railways.json';
import platforms from '../../data/processed/platforms.json';
import areas from '../../data/processed/areas.json';
import metadata from '../../data/processed/metadata.json';
import {pathLength,type Point} from './geo';
export type Feature={id:number,tags:Record<string,string>,points:Point[],geometry:{lat:number,lon:number}[]};
export const map={roads,buildings,railways,platforms,areas} as unknown as Record<'roads'|'buildings'|'railways'|'platforms'|'areas',Feature[]>;
export {metadata};
// All three stops are explicitly demo stops sampled from an OSM footway, not surveyed entrances.
const foot=map.roads.find(r=>r.id===548366613)!;
const a=foot.points[1],b=foot.points[0];
const mix=(t:number):Point=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
export const route:Point[]=[mix(0),mix(.48),mix(1)];
export const stops=[{name:'역 앞 출발 지점',desc:'진부역에서 시작하는 작은 여행',point:route[0]},{name:'역 앞 보행 공간',desc:'잠시 걸으며 둘러보는 진부역',point:route[1]},{name:'주차장 방향',desc:'보행로를 따라 만나는 다음 풍경',point:route[2]}];
export const routeDistance=pathLength(route);
export const roadWidth=(r:Feature)=>Number(r.tags.width)|| (r.tags.highway==='footway'?2.5:r.tags.service==='parking_aisle'?4.5:r.tags.lanes?Number(r.tags.lanes)*3.2:r.tags.highway==='service'?5.5:7);

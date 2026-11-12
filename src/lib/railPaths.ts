import {map} from './osm';
import type {Point} from './geo';
import type {RailDirection} from './railSchedule';
import {railGeometryProfile} from './trainJourney';
import {STATION_MAP_HALF_EXTENT} from './sceneBounds';
// User-requested visualization: reverse the saved OSM rail directions, not the source data.
// These are the two central through tracks; outer service=siding ways are never selected.
export const railTracks={
 gangneung:{name:'central-east',stationWayId:971722969,sourceWayIds:[971722966,545414818,971722969,545488738,545488735]},
 seoul:{name:'central-west',stationWayId:545488739,sourceWayIds:[545414812,545488734,545488739,971722970,971722967]}
};
export function railPath(direction:RailDirection):Point[]{
 const points:Point[]=[];
 for(const id of [...railTracks[direction].sourceWayIds].reverse()){
  const rail=map.railways.find(r=>r.id===id);if(!rail)throw Error('Missing OSM rail way '+id);
  if(rail.tags.service==='siding')throw Error('Train cannot use an outer siding');
  const segment=[...rail.points].reverse();
  if(points.length&&Math.hypot(points.at(-1)![0]-segment[0][0],points.at(-1)![1]-segment[0][1])>.2)throw Error('Disconnected OSM rail way '+id);
  points.push(...(points.length?segment.slice(1):segment));
 }
 return points;
}
export function railProfile(points:Point[]){return railGeometryProfile(points,STATION_MAP_HALF_EXTENT)}

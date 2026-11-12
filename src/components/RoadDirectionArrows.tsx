import {map} from '../lib/osm';
import {effectiveRoadDirections} from '../lib/routing';
import {samplePath,pathLength} from '../lib/geo';
import {Polygon} from './Geometry';
const arrow:[number,number][]=[[-.3,-1],[.3,-1],[.3,.1],[.85,.1],[0,1.25],[-.85,.1],[-.3,.1],[-.3,-1]];
export function RoadDirectionArrows(){return <>{map.roads.filter(r=>r.tags.tunnel!=='yes'&&!['footway','path','steps','pedestrian','cycleway'].includes(r.tags.highway)&&effectiveRoadDirections(r).length===1).flatMap(r=>{const direction=effectiveRoadDirections(r)[0],points=direction===-1?[...r.points].reverse():r.points;return Array.from({length:Math.floor(pathLength(points)/25)},(_,i)=>{const p=samplePath(points,12+i*25);return <group key={`${r.id}-${i}`} position={[p.x,.16,p.z]} rotation-y={p.angle}><Polygon points={arrow} height={.015} color="#dedfcb"/></group>})})}</>}

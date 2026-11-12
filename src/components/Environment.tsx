import {RoadDirectionArrows} from './RoadDirectionArrows';
import {map,roadWidth} from '../lib/osm';
import {pathLength,samplePath} from '../lib/geo';
import {DioramaBase,Strip,Polygon,Box} from './Geometry';
export function Terrain(){return <><DioramaBase size={500} depth={6} color="#d8d7c5" sideColor="#b5b7a3"/>{map.areas.map(a=><Polygon key={a.id} points={a.points} height={a.tags.amenity==='parking'?.06:a.tags.landuse==='railway'?.04:.02} castShadow={false} color={a.tags.amenity==='parking'?'#a3a59b':a.tags.landuse==='railway'?'#bcbcaf':'#a7b58d'}/>)}</>}
export function Roads(){return <><RoadDirectionArrows/>{map.roads.filter(r=>r.tags.tunnel!=='yes').map(r=>{const foot=r.tags.highway==='footway',cross=r.tags.footway==='crossing',w=roadWidth(r);return <group key={r.id}><Strip points={r.points} width={w+.65} color={foot?'#c5c3b1':'#c4c4b8'} y={foot?.12:.08}/><Strip points={r.points} width={w} color={foot?'#e1dcc8':'#747b77'} y={foot?.14:.1}/>{!foot&&r.tags.highway!=='service'&&<Strip points={r.points} width={.14} color="#d8cf9b" y={.115}/ >}{cross&&Array.from({length:Math.floor(pathLength(r.points)/1.5)},(_,i)=>{const p=samplePath(r.points,i*1.5);return <Box key={i} position={[p.x,.19,p.z]} size={[2.5,.035,.55]} rotation={p.angle} color="#f1edda"/>})}</group>})}</>}
export function ProceduralBuildings(){return <>{map.buildings.filter(b=>b.tags.building!=='train_station').map(b=><Polygon key={b.id} points={b.points} height={Number(b.tags.height)||Number(b.tags['building:levels'])*3.2||7} color="#eee8d7"/>)}</>}
export {Railway} from "./Railway";

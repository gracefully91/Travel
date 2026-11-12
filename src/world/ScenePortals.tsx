import {ArrowUpRight,Signpost} from 'lucide-react';
import connections from '../../data/processed/scene-connections.json';
import {WorldLabel} from '../components/WorldLabel';
export function ScenePortals({sceneId,onNavigate}:{sceneId:string;onNavigate:(id:string)=>void}){
 return <>{connections.filter(c=>c.from===sceneId).map(c=><group key={c.to} name={'portal-'+c.to} position={[c.point[0],0,c.point[1]]}>
  <mesh position-y={1.8} castShadow><cylinderGeometry args={[.12,.16,3.4,8]}/><meshStandardMaterial color="#78866c" roughness={.8}/></mesh>
  <mesh rotation-x={-Math.PI/2} position-y={.22}><ringGeometry args={[1.3,2,24]}/><meshBasicMaterial color="#8d9b6e"/></mesh>
  <WorldLabel position={[0,5,0]}><button className="scene-portal" aria-label={c.to==='jinbu-town'?'진부 시내 3D로 이동':'진부역 3D로 이동'} title={`${c.roadName} · 실제 연결 도로 위의 앱 이동 표지`} onClick={()=>onNavigate(c.to)}><Signpost size={17}/><span><strong>{c.to==='jinbu-town'?'진부 시내로':'진부역으로'}</strong><small>{c.to==='jinbu-town'?'진부 시내 구역 · 다음 3D 맵':'KTX 역 · 다음 3D 맵'}</small></span><ArrowUpRight size={16}/></button></WorldLabel>
 </group>)}</>
}

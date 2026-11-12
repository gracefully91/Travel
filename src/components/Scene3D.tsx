import {Suspense,useEffect,useRef,useState,useCallback} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,Line} from '@react-three/drei';
import {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {Terrain,Roads,ProceduralBuildings,Railway} from './Environment';
import {ScheduledTrains,TrainBoundary,trainMotion} from './ScheduledTrains';
import {StationModel} from './StationModel';
import {AnimatedPeople,AnimatedVehicles,Trees,motionState} from './LivingCity';
import {WorldLabel as Html} from './WorldLabel';
import {ScenePortals} from '../world/ScenePortals';
import {SceneReady} from '../world/SceneReady';
import {STATION_MAP_HALF_EXTENT} from '../lib/sceneBounds';
import {route,stops} from '../lib/osm';
export type CameraCommand={id:number,type:'home'|'all'|'stop'|'in'|'out'|'north',point?:[number,number]};
// Data keeps +Z=north. Reflect the geographic group once so world -Z is north.
const INITIAL_TARGET:[number,number,number]=[-12,0,-12];
const INITIAL_CAMERA={position:[-122,125,-177] as [number,number,number],fov:43,near:2,far:1800};
function CameraRig({command,onHeading}:{command:CameraCommand,onHeading:(n:number)=>void}){
 const ref=useRef<Controls>(null!),goal=useRef<{position:THREE.Vector3,target:THREE.Vector3}|null>(null);
 const {camera,gl}=useThree();
 useEffect(()=>{ref.current?.target.set(...INITIAL_TARGET)},[]);
 useEffect(()=>{
  if(!ref.current)return;
  const c=ref.current;
  // Flush drag inertia once before assigning a camera destination.
  c.enableDamping=false;c.update();
  let target=new THREE.Vector3(-12,0,-12),offset=new THREE.Vector3(-110,125,-165);
  if(command.type==='all'){target=new THREE.Vector3(-25,0,-15);offset=new THREE.Vector3(-220,235,-270)}
  if(command.type==='stop'){target=new THREE.Vector3(command.point![0],0,-command.point![1]);offset=new THREE.Vector3(-55,65,-80)}
  if(command.type==='in'||command.type==='out'){target=c.target.clone();offset=camera.position.clone().sub(target).multiplyScalar(command.type==='in'?.76:1.3);offset.clampLength(28,600)}
  if(command.type==='north'){target=c.target.clone();offset=new THREE.Vector3(0,135,170)}
  goal.current={target,position:target.clone().add(offset)};
 },[command,camera]);
 // Tween first; Drei updates controls at -1; DOM labels project at 0.
 // This gives the scene and labels the same camera for each rendered frame.
 useFrame((_,dt)=>{
  const destination=goal.current,c=ref.current;
  if(!destination||!c)return;
  const alpha=1-Math.exp(-Math.min(dt,.1)*4);
  camera.position.lerp(destination.position,alpha);c.target.lerp(destination.target,alpha);
  if(camera.position.distanceTo(destination.position)<.01&&c.target.distanceTo(destination.target)<.01){
   camera.position.copy(destination.position);c.target.copy(destination.target);
   goal.current=null;c.enableDamping=true;
  }
 },-2);
 useFrame(()=>{
  if(ref.current)onHeading(ref.current.getAzimuthalAngle());
  Object.assign(window,{__miniature:{camera:camera.position.toArray(),target:ref.current?.target.toArray(),calls:gl.info.render.calls,triangles:gl.info.render.triangles,motion:{...motionState},trains:trainMotion}});
 });
 return <OrbitControls ref={ref} makeDefault minDistance={28} maxDistance={600} maxPolarAngle={Math.PI/2-.1} minPolarAngle={.2} screenSpacePanning={false} enableDamping dampingFactor={.08} onStart={()=>{goal.current=null;if(ref.current)ref.current.enableDamping=true}} mouseButtons={{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN}} touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}/>
}
export default function Scene3D({onTrainError,onNavigate,command,playing,moving,resetKey,trainTrigger,onSelect,onStatus,selected,showRoute,onStop,onHeading,active=true,onSceneReady}:{onTrainError:(message:string)=>void;onNavigate:(id:string)=>void;command:CameraCommand,playing:boolean,moving:boolean,resetKey:number,trainTrigger:number,onSelect:()=>void,onStatus:(s:string)=>void,selected:boolean,showRoute:boolean,onStop:(i:number)=>void,onHeading:(n:number)=>void,active?:boolean,onSceneReady?:()=>void}){
 const [assetReady,setAssetReady]=useState(false);const reportStatus=useCallback((s:string)=>{onStatus(s);setAssetReady(true)},[onStatus]);
 return <Canvas frameloop={active?'always':'never'} shadows dpr={[1,1.6]} camera={INITIAL_CAMERA} gl={{antialias:true,alpha:true}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;gl.clippingPlanes=[new THREE.Plane(new THREE.Vector3(-1,0,0),STATION_MAP_HALF_EXTENT),new THREE.Plane(new THREE.Vector3(1,0,0),STATION_MAP_HALF_EXTENT),new THREE.Plane(new THREE.Vector3(0,0,-1),STATION_MAP_HALF_EXTENT),new THREE.Plane(new THREE.Vector3(0,0,1),STATION_MAP_HALF_EXTENT)]}}><ambientLight intensity={1.3}/><hemisphereLight args={['#fff7e4','#b7c5aa',1.2]}/><directionalLight position={[-80,160,70]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-250} shadow-camera-right={250} shadow-camera-top={250} shadow-camera-bottom={-250} shadow-camera-far={500} shadow-normalBias={.12} shadow-bias={-.0002}/><Suspense fallback={null}><SceneReady ready={assetReady} onReady={onSceneReady}/><group name="geographic-frame" scale={[1,1,-1]}><ScenePortals sceneId="jinbu-station" onNavigate={onNavigate}/><Terrain/><Roads/><ProceduralBuildings/><Railway/><Trees/><StationModel onSelect={onSelect} onStatus={reportStatus} selected={selected}/><AnimatedPeople playing={playing} moving={moving} resetKey={resetKey}/><AnimatedVehicles playing={playing}/><TrainBoundary onError={onTrainError}><Suspense fallback={null}><ScheduledTrains playing={playing} trigger={trainTrigger}/></Suspense></TrainBoundary>{showRoute&&<><Line points={route.map(([x,z])=>[x,.4,z])} color="#7d914e" lineWidth={4} dashed dashSize={1} gapSize={.7}/>{stops.map((s,i)=><group key={i} position={[s.point[0],.3,s.point[1]]}><mesh rotation-x={-Math.PI/2}><ringGeometry args={[1.1,1.6,32]}/><meshBasicMaterial color="#70854b"/></mesh><Html position-y={3} center zIndexRange={[9,0]}><button className="stop-pin" aria-label={s.name} onClick={()=>onStop(i)}>{i+1}</button></Html></group>)}</>}</group><CameraRig command={command} onHeading={onHeading}/></Suspense></Canvas>
}

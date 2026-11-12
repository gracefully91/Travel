import {Component,useEffect,useMemo,useRef,type ReactNode,type ErrorInfo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import timetable from '../data/railTimetable';
import {activeRailEvent,type RailDirection} from '../lib/railSchedule';
import {railPath,railProfile,railTracks} from '../lib/railPaths';
import {createTrainJourney,trainJourneyState,type TrainJourney,type TrainPhase} from '../lib/trainJourney';
import {samplePath} from '../lib/geo';
import {TrainModel,useTrainModel,trainAlignment} from './TrainModel';
import {motionState} from './LivingCity';
type TrainState={visible:boolean;x:number;z:number;distance:number;kind:string;serviceId:string;phase:TrainPhase;elapsed:number;dwellRemaining:number;track:number;journey:TrainJourney|null};
const initialState=():TrainState=>({visible:false,x:0,z:0,distance:0,kind:'none',serviceId:'',phase:'hidden',elapsed:-1,dwellRemaining:0,track:0,journey:null});
export const trainMotion={model:null as null|Record<string,unknown>,gangneung:initialState(),seoul:initialState()};
function TrainActor({model,direction,playing,trigger}:{model:THREE.Group;direction:RailDirection;playing:boolean;trigger:number}){
 const ref=useRef<THREE.Group>(null!),lastTrigger=useRef(0),demoElapsed=useRef<number|null>(null),lastFrame=useRef<number|null>(null);
 const path=useMemo(()=>railPath(direction),[direction]),profile=useMemo(()=>railProfile(path),[path]),journey=useMemo(()=>createTrainJourney(profile,Number(model.userData.length)),[profile,model]);
 const lastQuery=useRef(-Infinity),event=useRef<ReturnType<typeof activeRailEvent>>(undefined);
 useEffect(()=>{lastFrame.current=null},[playing]);
 useFrame(()=>{
  const stamp=performance.now();let delta=lastFrame.current===null?0:(stamp-lastFrame.current)/1000;lastFrame.current=stamp;
  if(direction==='gangneung'&&lastTrigger.current!==trigger){lastTrigger.current=trigger;demoElapsed.current=0;delta=0;lastQuery.current=-Infinity}
  if(!playing)return;
  const now=Date.now();let elapsed=-1,kind='schedule',serviceId='';
  if(demoElapsed.current!==null){demoElapsed.current+=delta;elapsed=demoElapsed.current;kind='demo';motionState.train=elapsed;if(elapsed>=journey.totalSeconds){demoElapsed.current=null;lastQuery.current=-Infinity}}
  else{
   if(Math.abs(now-lastQuery.current)>=250){event.current=activeRailEvent(timetable,now,direction,journey.approachSeconds,journey.dwellSeconds+journey.departureSeconds);lastQuery.current=now}
   const current=event.current;elapsed=current?journey.approachSeconds+(now-current.at)/1000:-1;serviceId=current?.id??'';
  }
  const state=trainJourneyState(journey,elapsed),visible=state.phase!=='hidden'&&state.phase!=='complete';ref.current.visible=visible;
  if(visible){const p=samplePath(path,state.distance);ref.current.position.set(p.x,trainAlignment.railTop,p.z);ref.current.rotation.y=p.angle;Object.assign(trainMotion[direction],{x:p.x,z:p.z})}
  Object.assign(trainMotion[direction],{...state,visible,elapsed,kind:visible?kind:'none',serviceId,track:railTracks[direction].stationWayId,journey});
 });
 return <group ref={ref} visible={false} name={'ktx-'+direction}><TrainModel model={model}/></group>
}
export function ScheduledTrains({playing,trigger}:{playing:boolean;trigger:number}){
 const model=useTrainModel();trainMotion.model=model.userData;
 return <><TrainActor model={model} direction="gangneung" playing={playing} trigger={trigger}/><TrainActor model={model} direction="seoul" playing={playing} trigger={0}/></>
}
export class TrainBoundary extends Component<{children:ReactNode;onError:(message:string)=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error:Error,_info:ErrorInfo){this.props.onError('KTX 모델 로드 실패');console.error('KTX asset failed',error)}
 render(){return this.state.failed?null:this.props.children}
}

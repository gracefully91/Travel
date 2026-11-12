import {Component,Suspense,lazy,useEffect,useRef,useState,type ErrorInfo,type ReactNode} from 'react';
import WorldOverview from './world/WorldOverview';
import {MapLoading} from './world/MapLoading';
import {worldPlaces,type WorldPlace,type RegionId} from './world/registry';
import './world/world.css';
const StationExperience=lazy(()=>import('./StationExperience'));
const BasicScene=lazy(()=>import('./world/BasicScene'));
const TravelPlanner=lazy(()=>import('./planner/TravelPlanner'));
type Flight={place:WorldPlace;token:number;error:string};
class SceneBoundary extends Component<{children:ReactNode;onError:(s:string)=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(_e:Error,_info:ErrorInfo){this.props.onError('3D 맵을 표시하지 못했습니다. 브라우저의 WebGL 지원 또는 저장된 에셋을 확인해 주세요.')}render(){return this.state.failed?null:this.props.children}}
export default function App(){const [view,setView]=useState<'overview'|'scene'>('overview'),[region,setRegion]=useState<RegionId>('jinbu'),[selected,setSelected]=useState('jinbu-station'),[active,setActive]=useState<WorldPlace|null>(null),[last,setLast]=useState<WorldPlace|null>(null),[flight,setFlight]=useState<Flight|null>(null),[planner,setPlanner]=useState(false),[sceneToken,setSceneToken]=useState(0);const serial=useRef(0);
 const showWorld=()=>{serial.current++;setFlight(null);setView('overview');setActive(null)};
 const chooseRegion=(id:RegionId)=>{setRegion(id);setSelected(worldPlaces.find(p=>p.region===id)!.id)};
 const enter=(place:WorldPlace)=>{if(!place.scene||place.status==='planned')return;const token=++serial.current;setSelected(place.id);setRegion(place.region);setActive(place);setSceneToken(token);setFlight({place,token,error:''});setView('scene')};
 const arrived=(token:number)=>{if(serial.current!==token)return;setLast(active);setFlight(null)};
 const failed=(message:string,token:number)=>{if(serial.current!==token)return;setFlight(f=>f?{...f,error:message}:null)};
 useEffect(()=>{if(!flight||flight.error)return;const token=flight.token;const timer=setTimeout(()=>failed('3D 맵 준비가 오래 걸리고 있습니다. 구역 지도로 돌아가 다시 열어 주세요.',token),45000);return()=>clearTimeout(timer)},[flight?.token,flight?.error]);
 useEffect(()=>{const onEscape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&flight)showWorld()};document.addEventListener('keydown',onEscape);return()=>document.removeEventListener('keydown',onEscape)},[flight]);
 const token=sceneToken;const navigate=(id:string)=>{const next=worldPlaces.find(p=>p.id===id);if(next)enter(next)};
 return <main className={'explorer-root '+(view==='overview'?'showing-overview':'showing-scene')}>{view==='overview'?<WorldOverview regionId={region} selectedId={selected} onRegion={chooseRegion} onSelect={p=>setSelected(p.id)} onEnter={enter} onPlan={()=>setPlanner(true)} lastVisited={last}/>:active&&<SceneBoundary key={`${active.id}-${token}`} onError={m=>failed(m,token)}><Suspense fallback={null}>{active.scene==='station'?<StationExperience onNavigate={navigate} onWorld={showWorld} onReady={()=>arrived(token)}/>:<BasicScene onNavigate={navigate} place={active} onWorld={showWorld} onReady={()=>arrived(token)} onError={m=>failed(m,token)}/>}</Suspense></SceneBoundary>}
 {flight&&<MapLoading place={flight.place} error={flight.error} onCancel={showWorld}/>}{planner&&<div className="world-planner-layer"><header className="world-planner-header"><strong>Pyeongchang <span>in Miniature</span></strong><button onClick={()=>setPlanner(false)}>구역 지도로 돌아가기 ↗</button></header><Suspense fallback={<div className="region-state">일정 화면을 준비하고 있습니다…</div>}><TravelPlanner onClose={()=>setPlanner(false)}/></Suspense></div>}
 </main>
}

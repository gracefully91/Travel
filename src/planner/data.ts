import catalogue from '../../data/planner/places.json';
import carSnapshot from '../../data/planner/network-car.json';
import walkSnapshot from '../../data/planner/network-walk.json';
import type {GeoPlace,TravelMatrix,Mode} from './types';

export const cataloguePlaces=catalogue.places as GeoPlace[];
export const station=catalogue.station as GeoPlace;
export const terminal=catalogue.terminal as GeoPlace;
export const timeString=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(Math.floor(minutes%60)).padStart(2,'0')}`;
export const parseTime=(text:string)=>{const [h,m]=text.split(':').map(Number);return h*60+m};
export function koreaToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}

type StaticRoute={number:string;routeId:string;companyId:string;name:string;from:string;to:string;source:string;verifiedAt:string;stops:{id:string;name:string;lat:number;lon:number;sequence:number;boardable:boolean}[];schedules:Record<string,{timeTable:{plbDate:string}[];firstLast:unknown[]}>};
type StaticTransport={checkedAt:string;bus:{routes:StaticRoute[]}};
let staticTransport:Promise<StaticTransport>|undefined;
const isStaticDeploy=import.meta.env.BASE_URL!=='/';
async function loadStaticTransport(){return staticTransport??=fetch(`${import.meta.env.BASE_URL}data/transport-snapshot.json`).then(async r=>{if(!r.ok)throw Error('저장된 교통자료를 읽지 못했습니다');return r.json() as Promise<StaticTransport>})}
function snapshotMatrix(places:GeoPlace[],mode:Mode):{matrix:TravelMatrix;source:string;snapshot:true}{
 const snapshot=mode==='walk'||mode==='transit'?walkSnapshot:carSnapshot;
 const indices=places.map(p=>snapshot.places.findIndex((s:{lat:number;lon:number})=>Math.abs(s.lat-p.lat)<1e-7&&Math.abs(s.lon-p.lon)<1e-7));
 const matrix:TravelMatrix={};
 places.forEach((p,i)=>{matrix[p.id]={};places.forEach((q,j)=>{const row=indices[i],column=indices[j],seconds=snapshot.durations[row]?.[column],meters=snapshot.distances[row]?.[column];matrix[p.id][q.id]=row>=0&&column>=0&&seconds!=null&&meters!=null?{minutes:Math.ceil(seconds/60),meters,source:`OSM 경로 스냅샷 · ${snapshot.acquiredAt.slice(0,10)}`}:null})});
 return {matrix,source:`저장된 ${mode==='walk'?'도보':'자동차'} 경로 스냅샷 · 실시간 정체 미반영`,snapshot:true};
}

export async function api(action:string,params:Record<string,string>={}){
 if(isStaticDeploy){
  if(action==='status')return {trainConnected:false,trafficConnected:false,busTimetableConnected:false,transitDatabase:true,railCacheAvailable:false,roadSource:'저장된 OSM 경로 스냅샷',busSource:'https://bus.pc.go.kr/'};
  if(action==='transit'){
   const data=await loadStaticTransport(),date=params.date||koreaToday(),count=Math.max(1,Math.min(7,Number(params.days)||1));
   const stopMap=new Map<string,StaticRoute['stops'][number]>();data.bus.routes.flatMap(r=>r.stops).forEach(s=>stopMap.set(s.id,s));const stops=[...stopMap.values()];
   const days=Array.from({length:count},(_,i)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);return {date:d.toISOString().slice(0,10),trips:[],serviceCount:0,connectionCount:0,staleServices:data.bus.routes.filter(r=>Object.values(r.schedules).some(s=>s.timeTable.length>0)).length,source:'공식 BIS 저장 자료 · 유효성이 확인된 버스 운행편 없음',externalRequests:0}});
   return {routes:data.bus.routes.map(r=>({id:r.routeId,number:r.number,name:`${r.from} ↔ ${r.to}`,source:r.source,verifiedAt:r.verifiedAt})),stops:stops.map(s=>({...s,source:'https://bus.pc.go.kr/'})),serviceCount:0,days,source:'저장된 공식 BIS 노선·정류장 자료',externalRequests:0};
  }
  if(action==='table'){
   const points=JSON.parse(params.points||'[]') as [number,number][];
   const mode=params.mode==='walk'?'walk':'car',snapshot=mode==='walk'?walkSnapshot:carSnapshot;
   const indices=points.map(([lon,lat])=>snapshot.places.findIndex((p:{lat:number;lon:number})=>Math.abs(p.lon-lon)<1e-7&&Math.abs(p.lat-lat)<1e-7));
   if(indices.some(i=>i<0))return {durations:[],distances:[],source:'저장된 경로 자료가 없는 장소',cachedSnapshot:true};
   return {durations:indices.map(i=>indices.map(j=>snapshot.durations[i][j])),distances:indices.map(i=>indices.map(j=>snapshot.distances[i][j])),source:'저장된 OSM 경로 스냅샷',cachedSnapshot:true};
  }
  if(action==='path')return {routes:[],source:'경로선 스냅샷 없음 · 지점 연결선으로 표시'};
  if(action==='search')return {items:[],offline:true};
  if(action==='rail')return {items:[],unavailable:true,reason:'실시간·조회형 열차 API 없이 저장된 진부역 시간표만 제공합니다.'};
  throw Error('정적 교통자료에서 지원하지 않는 요청입니다: '+action);
 }
 const res=await fetch('/api/travel/'+action+'?'+new URLSearchParams(params));
 if(!res.ok)throw Error('데이터 연결 실패 · 잠시 후 다시 시도해 주세요');
 const d=await res.json();if(d.error)throw Error(d.error);return d;
}

export async function loadMatrix(places:GeoPlace[],mode:Mode):Promise<{matrix:TravelMatrix,source:string,snapshot:boolean}>{
 if(isStaticDeploy)return snapshotMatrix(places,mode);
 const d=await api('table',{mode:mode==='walk'?'walk':'car',points:JSON.stringify(places.map(p=>[p.lon,p.lat]))});
 const matrix:TravelMatrix={};places.forEach((p,i)=>{matrix[p.id]={};places.forEach((q,j)=>{const seconds=d.durations[i]?.[j],meters=d.distances[i]?.[j];matrix[p.id][q.id]=seconds!=null&&meters!=null?{minutes:Math.ceil(seconds/60),meters,source:d.source}:null})});
 return {matrix,source:d.source,snapshot:d.cachedSnapshot};
}

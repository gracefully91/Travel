import catalogue from '../../data/planner/places.json';
import type {GeoPlace,TravelMatrix,Mode} from './types';
export const cataloguePlaces=catalogue.places as GeoPlace[];
export const station=catalogue.station as GeoPlace;
export const terminal=catalogue.terminal as GeoPlace;
export const timeString=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(Math.floor(minutes%60)).padStart(2,'0')}`;
export const parseTime=(text:string)=>{const [h,m]=text.split(':').map(Number);return h*60+m};
export function koreaToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export async function api(action:string,params:Record<string,string>={}){const res=await fetch('/api/travel/'+action+'?'+new URLSearchParams(params));if(!res.ok)throw Error('데이터 연결 실패 · 잠시 후 다시 시도해 주세요');const d=await res.json();if(d.error)throw Error(d.error);return d}
export async function loadMatrix(places:GeoPlace[],mode:Mode):Promise<{matrix:TravelMatrix,source:string,snapshot:boolean}>{const d=await api('table',{mode:mode==='walk'?'walk':'car',points:JSON.stringify(places.map(p=>[p.lon,p.lat]))});const matrix:TravelMatrix={};places.forEach((p,i)=>{matrix[p.id]={};places.forEach((q,j)=>{const seconds=d.durations[i]?.[j],meters=d.distances[i]?.[j];matrix[p.id][q.id]=seconds!=null&&meters!=null?{minutes:Math.ceil(seconds/60),meters,source:d.source}:null})});return {matrix,source:d.source,snapshot:d.cachedSnapshot}}

import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const checkedAt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const routes=[
 {number:'21',id:'42805060'},
 {number:'224',id:'42601014'},
 {number:'225',id:'42601013'},
 {number:'226',id:'42601012'},
 {number:'240',id:'42601023'},
 {number:'420',id:'42601062'},
 {number:'440',id:'42601058'},
 {number:'441',id:'42601059'},
];
const rawRoutes=[];
for(const route of routes){
 const mapUrl=`https://bus.pc.go.kr/search/route/map?routeId=${route.id}`;
 const mapResponse=await fetch(mapUrl,{signal:AbortSignal.timeout(20000)});
 if(!mapResponse.ok)throw Error(`평창군 BIS 노선 자료 조회 실패 (${route.number}): ${mapResponse.status}`);
 const map=await mapResponse.json();
 const scheduleId=map.routeSchedule?.[0];
 if(scheduleId?.routeId!==route.id||scheduleId?.routeNm!==route.number||!scheduleId.companyId)throw Error(`노선 정보가 예상한 노선과 일치하지 않습니다: ${route.number}`);
 const schedules={};
 for(const scheduleType of ['week','vacation','sat','sun']){
  const url=new URL('https://bus.pc.go.kr/search/route/timeTable');
  url.searchParams.set('cityName','pyeongchang');url.searchParams.set('compId',scheduleId.companyId);url.searchParams.set('routeId',route.id);url.searchParams.set('routeNm',route.number);url.searchParams.set('scheduleType',scheduleType);
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error(`평창군 BIS 시간표 조회 실패 (${route.number}/${scheduleType}): ${response.status}`);
  schedules[scheduleType]=await response.json();
 }
 rawRoutes.push({number:route.number,routeId:route.id,mapUrl,map,schedules});
}
const raw={checkedAt,source:'https://bus.pc.go.kr/search?type=route',scheduleEndpoint:'https://bus.pc.go.kr/search/route/timeTable',rawRoutes};
mkdirSync('data/raw/transit-updates',{recursive:true});
writeFileSync(`data/raw/transit-updates/${checkedAt}-official-routes-${Date.now()}.json`,JSON.stringify(raw,null,2));

const taxi=JSON.parse(readFileSync('data/planner/provenance.json','utf8')).taxi;
const rail=JSON.parse(readFileSync('data/processed/jinbu-train-timetable.json','utf8'));
const routing={car:JSON.parse(readFileSync('data/planner/network-car.json','utf8')),walk:JSON.parse(readFileSync('data/planner/network-walk.json','utf8'))};
const staticData={checkedAt,bus:{source:raw.source,scheduleSource:raw.scheduleEndpoint,routes:rawRoutes.map(({number,routeId,mapUrl,map,schedules})=>({
 number,routeId,companyId:map.routeSchedule[0].companyId,name:map.routeSchedule[0].routeNm,from:map.routeSchedule[0].stStaNm,to:map.routeSchedule[0].edStaNm,
 source:mapUrl,verifiedAt:checkedAt,stops:map.list.map((s,index)=>({id:`bus:${s.stationId2}`,name:s.stationNm,lat:Number(s.vertexY),lon:Number(s.vertexX),sequence:Number(s.stationOrder)||index+1,boardable:!s.stationNm.includes('미정차'),routeTimes:s.routeTime??[]})),geometry:map.draw.map(p=>[Number(p.vertexX),Number(p.vertexY)]).filter(p=>p.every(Number.isFinite)),schedules
}))},rail,taxi,routing};
mkdirSync('public/data',{recursive:true});
writeFileSync('public/data/transport-snapshot.json',JSON.stringify(staticData,null,2));
console.log(JSON.stringify({checkedAt,routes:staticData.bus.routes.length,stops:staticData.bus.routes.reduce((n,r)=>n+r.stops.length,0),busDepartureCount:staticData.bus.routes.reduce((n,r)=>n+Object.values(r.schedules).reduce((m,s)=>m+(s.timeTable?.length??0),0),0),railServices:rail.services.length,output:'public/data/transport-snapshot.json'}));

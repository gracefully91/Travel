import {transitStore} from '../server/transit-store.ts';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const store=transitStore();const [action,file]=process.argv.slice(2);
try{
 if(action==='import'){if(!file)throw Error('운행편 JSON 경로를 지정하세요');const d=JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,''));console.log({importedServices:store.importServices(d.services)})}
 else if(action==='date')console.log(JSON.stringify(store.forDate(file),null,2));
 else if(action==='stops')console.log(JSON.stringify(store.catalogue().stops,null,2));
 else if(action==='sync-routes'){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());for(const [id,num] of [['42601014','224'],['42601013','225'],['42601012','226']]){const r=await fetch('https://bus.pc.go.kr/search/route/map?routeId='+id,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('공식 노선 조회 실패: '+id);const snapshot=await r.json();store.seedRoute(snapshot,id,num,date,true);mkdirSync('data/raw/transit-updates',{recursive:true});writeFileSync(`data/raw/transit-updates/${date}-${num}.json`,JSON.stringify(snapshot,null,2));console.log({updated:num,checkedAt:date})}}
 else{const d=store.catalogue();console.log(JSON.stringify({routes:d.routes,stopCount:d.stops.length,boardableStopCount:d.stops.filter(s=>s.boardable).length,serviceCount:d.serviceCount},null,2))}
}finally{store.close()}

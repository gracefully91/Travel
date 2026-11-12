import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {plannerApi} from '../server/planner-api.ts';
const snapshot=JSON.parse(fs.readFileSync('data/planner/network-car.json','utf8'));
function handler(){let middleware;plannerApi('').configureServer({middlewares:{use(fn){middleware=fn}}});return middleware}
async function invoke(points){let body;const res={statusCode:200,setHeader(){},end(text){body=JSON.parse(text)}};await handler()({method:'GET',url:'/api/travel/table?mode=car&points='+encodeURIComponent(JSON.stringify(points))},res,()=>{});return {status:res.statusCode,body}}
test('Road lookup outage reuses a real saved matrix for known coordinates',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Simulated network outage')};try{const points=snapshot.places.slice(0,2).map(p=>[p.lon,p.lat]);const r=await invoke(points);assert.equal(r.status,200);assert.equal(r.body.cachedSnapshot,true);assert.equal(r.body.distances[0][1],snapshot.distances[0][1])}finally{globalThis.fetch=original}});
test('Unknown coordinates never get an invented fallback road distance',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Simulated network outage')};try{const r=await invoke([[128.5,37.5],[128.51,37.51]]);assert.equal(r.status,502);assert.equal(r.body.distances,undefined)}finally{globalThis.fetch=original}});

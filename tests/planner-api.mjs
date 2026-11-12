import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:5173/api/travel/';const checks=[];const call=async(path,init)=>{const r=await fetch(base+path,init);return {status:r.status,data:await r.json()}};
const status=await call('status');assert.equal(status.status,200);assert.equal(status.data.trainConnected,false);checks.push('Missing train key is reported without exposure');
const rail=await call('rail?operation=trains');assert.equal(rail.data.unavailable,true);assert.equal(rail.data.items,undefined);checks.push('No invented train times without credentials');
const bad=await call('table?points='+encodeURIComponent(JSON.stringify([[999,0],[128,37]])));assert.equal(bad.status,502);checks.push('Invalid coordinates rejected');
const method=await call('status',{method:'POST'});assert.equal(method.status,405);checks.push('Unsupported methods rejected');
const search=await call('search?q='+encodeURIComponent('용평리조트'));assert.equal(search.status,200);assert.ok(search.data.items.length>0);assert.ok(search.data.items.every(p=>p.source.startsWith('https://www.openstreetmap.org/')&&Number.isFinite(p.lat)));checks.push('Real resort search returns sourced coordinates');
console.log(JSON.stringify({checks,hotel:search.data.items.map(p=>({name:p.name,lat:p.lat,lon:p.lon,source:p.source}))},null,2));fs.writeFileSync('artifacts/planner-api-report.json',JSON.stringify({checks,testedAt:new Date().toISOString()},null,2));

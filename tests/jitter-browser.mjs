import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1072,height:626}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
async function trace(){return page.evaluate(async()=>{const samples=[];await new Promise(resolve=>{const tick=()=>{samples.push({camera:window.__miniature.camera,target:window.__miniature.target,height:document.querySelector('canvas').clientHeight});if(samples.length<30)requestAnimationFrame(tick);else resolve()};requestAnimationFrame(tick)});return samples})}
function span(samples,key){return Math.max(...[0,1,2].map(i=>Math.max(...samples.map(s=>s[key][i]))-Math.min(...samples.map(s=>s[key][i]))))}
try{
 await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'이곳의 3D 맵 들어가기',exact:true}).click();
 
 await page.locator('.map-loading').waitFor({state:'hidden',timeout:45000});
 await page.getByRole('button',{name:'애니메이션 일시정지',exact:true}).click();
 await page.waitForTimeout(2500);
 let samples=await trace();check('Idle camera and target stay stationary across 30 frames',span(samples,'camera')<1e-9&&span(samples,'target')<1e-9);
 check('Canvas height stays constant',new Set(samples.map(s=>s.height)).size===1);
 await page.mouse.move(780,320);await page.mouse.down();await page.mouse.move(920,430,{steps:20});await page.mouse.up();await page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>++n>=160?resolve():requestAnimationFrame(tick);requestAnimationFrame(tick)}));
 samples=await trace();console.log('drag span',span(samples,'camera'));check('Drag damping settles without oscillation',span(samples,'camera')<.01);
 await page.screenshot({path:'artifacts/jitter-fixed.png'});
 await page.getByRole('button',{name:'진부역으로 복귀',exact:true}).click();await page.waitForTimeout(5000);
 samples=await trace();check('Home camera tween reaches its exact destination',samples.every(s=>Math.hypot(...s.camera.map((v,i)=>v-[-122,125,-177][i]))<1e-8));
 const diagnostics=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('@react-three_fiber'));const {_roots}=await import(url);const state=_roots.get(document.querySelector('canvas')).store.getState();return {near:state.camera.near,far:state.camera.far,controlsDamping:state.controls.enableDamping}});
 check('Damping restored after automatic movement',diagnostics.controlsDamping);
 const a=await page.locator('canvas').screenshot();await page.waitForTimeout(250);const b=await page.locator('canvas').screenshot();check('Paused settled map produces identical rendered pixels',a.equals(b));
 check('No browser exceptions',errors.length===0);
 fs.writeFileSync('artifacts/jitter-report.json',JSON.stringify({checks,errors,diagnostics,cameraSpan:span(samples,'camera'),browser:'Headless Edge / software WebGL'},null,2));console.log(JSON.stringify({checks,diagnostics,errors},null,2));
}finally{await browser.close()}


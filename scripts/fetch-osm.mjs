import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const bbox='128.5705,37.6396,128.5784,37.6459';
const official=`https://www.openstreetmap.org/api/0.6/map?bbox=${bbox}`;
const query='[out:json][timeout:60];nwr(around:350,37.6427328,128.5744564);out geom;';
let success=false,endpoint='';
try{const r=await fetch(official,{headers:{'User-Agent':'JinbuMiniatureMVP/1.0'},signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(String(r.status));const xml=await r.text();if(!xml.includes('<osm'))throw Error('Invalid OSM response');fs.writeFileSync('data/raw/jinbu-osm.xml',xml);execFileSync('python',['scripts/parse-osm.py'],{stdio:'inherit'});success=true;endpoint=official}catch(e){console.warn('OSM map API:',e.message)}
if(!success)for(const host of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){try{const r=await fetch(host+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(75000)});if(!r.ok)throw Error(String(r.status));const d=await r.json();if(!d.elements?.length)throw Error('Empty map');fs.writeFileSync('data/raw/jinbu-osm.json',JSON.stringify(d,null,2));endpoint=host;success=true;break}catch(e){console.warn('Overpass:',e.message)}}
if(!success)throw Error('Could not refresh map. Existing snapshot has been retained.');
execFileSync(process.execPath,['scripts/process-osm.mjs'],{stdio:'inherit'});
const metadata=JSON.parse(fs.readFileSync('data/processed/metadata.json','utf8'));Object.assign(metadata,{source:endpoint,acquiredAt:new Date().toISOString()});for(const f of ['data/processed/metadata.json','data/raw/source.json'])fs.writeFileSync(f,JSON.stringify(metadata,null,2));
console.log('Updated map snapshot from',endpoint);

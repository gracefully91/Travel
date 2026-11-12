import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const bbox=[128.55686,37.58458,128.82637,37.70094],dir='data/raw/regions/resorts-tiles';
fs.mkdirSync(dir,{recursive:true});
const tiles=[];
for(let y=0;y<3;y++)for(let x=0;x<3;x++){
 const b=[bbox[0]+(bbox[2]-bbox[0])*x/3,bbox[1]+(bbox[3]-bbox[1])*y/3,bbox[0]+(bbox[2]-bbox[0])*(x+1)/3,bbox[1]+(bbox[3]-bbox[1])*(y+1)/3];
 const url='https://www.openstreetmap.org/api/0.6/map?bbox='+b.join(',');
 const response=await fetch(url,{headers:{'User-Agent':'PyeongchangMiniature/1.0'},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('OSM tile '+x+','+y+': '+response.status+' '+await response.text());
 const xml=await response.text();if(!xml.includes('<osm'))throw Error('Invalid XML');
 const file=`${dir}/${x}-${y}.osm`;fs.writeFileSync(file,xml);tiles.push({file,bbox:b,url,acquiredAt:new Date().toISOString()});console.log('tile',x,y,xml.length);
}
for(const ext of ['.osm','-source.json']){const backup='data/raw/regions/resorts-before-user-outline'+ext;if(!fs.existsSync(backup))fs.copyFileSync('data/raw/regions/resorts'+ext,backup)}
fs.writeFileSync(dir+'/source.json',JSON.stringify({bbox,tiles,license:'OpenStreetMap contributors - ODbL 1.0'},null,2));
execFileSync('python',['-c',"import xml.etree.ElementTree as E,json;from pathlib import Path;m=json.loads(Path('data/raw/regions/resorts-tiles/source.json').read_text());out=E.Element('osm',version='0.6',generator='PyeongchangMiniature tile merge');seen=set();[(out.append(e),seen.add((e.tag,e.get('id')))) for t in m['tiles'] for e in E.parse(t['file']).getroot() if e.tag in ['node','way','relation'] and (e.tag,e.get('id')) not in seen];E.ElementTree(out).write('data/raw/regions/resorts.osm',encoding='utf-8',xml_declaration=True)"]);
fs.writeFileSync('data/raw/regions/resorts-source.json',JSON.stringify({id:'resorts',bbox,url:'https://www.openstreetmap.org/api/0.6/map',acquiredAt:new Date().toISOString(),tilesSource:dir+'/source.json',license:'OpenStreetMap contributors - ODbL 1.0'},null,2));

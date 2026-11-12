// Offline tooling only: npm install --prefix artifacts/geo-tools --no-save --package-lock=false proj4
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),proj4=require('../artifacts/geo-tools/node_modules/proj4');
const raw=fs.readFileSync('data/raw/regions/barangjae-official-map.jsonp','utf8');
const data=JSON.parse(decodeURIComponent(JSON.parse(raw.slice(raw.indexOf('(')+1,raw.lastIndexOf(')')))));
const [lon,lat]=proj4('+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs','WGS84',[data.placeX/2.5,data.placeY/2.5]);
const file='data/processed/barangjae-place.json',previous=JSON.parse(fs.readFileSync(file,'utf8'));
fs.writeFileSync(file,JSON.stringify({...previous,lat,lon,address:data.address,input:{coordinateSystem:'WCONGNAMUL',x:data.placeX,y:data.placeY}},null,2));
console.log('Official address marker:',lat,lon);

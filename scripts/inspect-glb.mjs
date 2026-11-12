import fs from 'node:fs';
const b=fs.readFileSync('public/models/jinbu-station.glb'); const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
fs.writeFileSync('data/raw/glb-structure.json',JSON.stringify(j,null,2));
console.log(JSON.stringify({asset:j.asset,scenes:j.scenes,nodes:j.nodes,meshes:j.meshes?.map(m=>({name:m.name,primitives:m.primitives})),materials:j.materials,accessors:j.accessors?.map(a=>({type:a.type,count:a.count,min:a.min,max:a.max}))},null,2));

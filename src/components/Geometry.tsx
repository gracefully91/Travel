import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '../lib/geo';
export function Strip({points,width,color,y=.04,depthWrite=true,receiveShadow=true,renderOrder=0}:{points:Point[],width:number,color:string,y?:number;depthWrite?:boolean;receiveShadow?:boolean;renderOrder?:number}){
 const geometry=useMemo(()=>{const vertices:number[]=[],indices:number[]=[];points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;const nx=-dz/len*width/2,nz=dx/len*width/2;vertices.push(p[0]+nx,y,p[1]+nz,p[0]-nx,y,p[1]-nz);if(i<points.length-1){const k=i*2;indices.push(k,k+2,k+1,k+2,k+3,k+1)}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g},[points,width,y]);
 return <mesh geometry={geometry} receiveShadow={receiveShadow} renderOrder={renderOrder}><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={.95} depthWrite={depthWrite}/></mesh>
}
export function Polygon({points,height=.1,color,y=0,castShadow=true,receiveShadow=true,depthWrite=true,renderOrder=0}:{points:Point[],height?:number,color:string,y?:number,castShadow?:boolean;receiveShadow?:boolean;depthWrite?:boolean;renderOrder?:number}){
 const geometry=useMemo(()=>{const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});g.rotateX(-Math.PI/2);g.computeVertexNormals();return g},[points,height]);return <mesh geometry={geometry} position-y={y} castShadow={castShadow} receiveShadow={receiveShadow} renderOrder={renderOrder}><meshStandardMaterial color={color} roughness={.86} depthWrite={depthWrite}/></mesh>
}
export function Box({position,size,color,rotation=0}:{position:[number,number,number],size:[number,number,number],color:string,rotation?:number}){return <mesh position={position} rotation-y={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.7}/></mesh>}

// One ground surface: a second plane above a closed box causes depth conflicts.
export function DioramaBase({size,depth,color,sideColor}:{size:number;depth:number;color:string;sideColor:string}){
 return <mesh position={[0,-depth/2,0]} receiveShadow><boxGeometry args={[size,depth,size]}/>{Array.from({length:6},(_,i)=><meshStandardMaterial key={i} attach={`material-${i}`} color={i===2?color:sideColor} roughness={1}/>)}</mesh>
}

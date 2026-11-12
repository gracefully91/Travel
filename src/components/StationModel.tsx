import { useEffect,useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import {WorldLabel as Html} from './WorldLabel';
import {StationSign} from './StationSign';
import {metadata,map} from '../lib/osm';
import {Box,Polygon} from './Geometry';
// Model-specific adjustment is intentionally separate from georeferencing.
export const stationAlignment={rotationY:metadata.station.rotationY,offset:[0,0,0] as [number,number,number],heightScale:1,hiddenMeshNames:[] as string[]};
export function StationModel({onSelect,onStatus,selected}:{onSelect:()=>void,onStatus:(s:string)=>void,selected:boolean}){
 const [object,setObject]=useState<THREE.Group|null>(null);
 useEffect(()=>{let active=true;let root:THREE.Group|undefined;const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);loader.load(import.meta.env.BASE_URL+'models/jinbu-station.glb',g=>{root=g.scene;root.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.computeVertexNormals();n.castShadow=n.receiveShadow=true;const materials=Array.isArray(n.material)?n.material:[n.material];for(const material of materials)if(material instanceof THREE.MeshStandardMaterial){
 // Keep the authored PBR textures, but reduce metal response because this local scene has no HDR environment map.
 material.metalness=Math.min(material.metalness,.08);material.roughness=Math.max(material.roughness,.72);material.needsUpdate=true;
 }if(stationAlignment.hiddenMeshNames.includes(n.name))n.visible=false}});const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());root.position.set(-center.x,-box.min.y,-center.z);const normalized=new THREE.Group();normalized.add(root);normalized.scale.set(metadata.station.length/size.x,metadata.station.length/size.x*stationAlignment.heightScale,metadata.station.width/size.z);if(active){setObject(normalized);onStatus('GLB 로드 완료')}} ,undefined,()=>{if(active)onStatus('GLB 로드 실패 · 에셋 압축 형식을 확인하세요')});return()=>{active=false;root?.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();const materials=Array.isArray(n.material)?n.material:[n.material];materials.forEach(m=>m.dispose())}})}},[onStatus]);
 return <group onClick={e=>{e.stopPropagation();onSelect()}} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}>
 {selected&&<Polygon points={map.buildings.find(b=>b.tags.building==='train_station')!.points} height={.12} color="#8b9c74"/>}
 <group rotation-y={stationAlignment.rotationY} position={stationAlignment.offset}>{object?<primitive object={object}/>:<><Box position={[0,5,0]} size={[71,10,28]} color="#e1e0d5"/><Box position={[0,10.2,0]} size={[74,1,30]} color="#b0b9b7"/></>}
 {/* Thin glazing and mullions supplement the untextured, single-material source. */}
 <StationSign/>
 </group><Html position={[-11,22,13]} center distanceFactor={180} zIndexRange={[10,0]}><button className={'map-label '+(selected?'chosen':'')} onClick={onSelect}><span className="rail-icon">▥</span> 진부(오대산)역 <span className="label-pill">KTX</span></button></Html></group>
}

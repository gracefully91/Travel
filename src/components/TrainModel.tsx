import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
export const trainAlignment={asset:import.meta.env.BASE_URL+'models/transportation/KTX-Sancheon.glb',decoder:import.meta.env.BASE_URL+'decoders/draco/',rotationY:-Math.PI/2,width:2.91,railTop:.48};
export function useTrainModel(){
 const {scene}=useGLTF(trainAlignment.asset,trainAlignment.decoder);
 return useMemo(()=>{
  scene.updateMatrixWorld(true);const measured=new Set<THREE.BufferGeometry>();scene.traverse(n=>{if(n instanceof THREE.Mesh&&!measured.has(n.geometry)){n.geometry.computeBoundingBox();measured.add(n.geometry)}});const bounds=new THREE.Box3().setFromObject(scene),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const groups=new Map<string,{geometry:THREE.BufferGeometry;material:THREE.Material|THREE.Material[];matrices:THREE.Matrix4[]}>();let skipped=0;
  scene.traverse(object=>{
   if(!(object instanceof THREE.Mesh))return;
   const geometry=object.geometry;const partSize=geometry.boundingBox!.getSize(new THREE.Vector3());
   // Dense sub-50cm internal fittings cost millions of triangles at miniature scale.
   if(geometry.attributes.position.count>20000&&Math.max(partSize.x,partSize.y,partSize.z)<.5){skipped++;return}
   const material=object.material,key=geometry.uuid+'/'+(Array.isArray(material)?material.map(m=>m.uuid).join(','):material.uuid);
   if(!groups.has(key))groups.set(key,{geometry,material,matrices:[]});groups.get(key)!.matrices.push(object.matrixWorld.clone());
  });
  const root=new THREE.Group(),normalized=new THREE.Group(),scale=trainAlignment.width/size.z;
  normalized.rotation.y=trainAlignment.rotationY;normalized.scale.setScalar(scale);root.add(normalized);
  const centerMatrix=new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z);let triangles=0;
  for(const {geometry,material,matrices} of groups.values()){
   const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,centerMatrix.clone().multiply(matrix)));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();normalized.add(mesh);triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*matrices.length;
  }
  root.name='ktx-sancheon-model';root.userData={source:trainAlignment.asset,sourceSize:size.toArray(),length:size.x*scale,width:size.z*scale,height:size.y*scale,drawGroups:groups.size,triangles,omittedDenseFittings:skipped};return root;
 },[scene]);
}
export function TrainModel({model}:{model:THREE.Group}){const copy=useMemo(()=>model.clone(true),[model]);return <primitive object={copy} dispose={null}/>}

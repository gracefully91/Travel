import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
export function SceneReady({ready=true,onReady}:{ready?:boolean;onReady?:()=>void}){const sent=useRef(false),raf=useRef(0),gl=useThree(s=>s.gl);useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);useFrame(()=>{if(ready&&!sent.current&&gl.info.render.calls>0){sent.current=true;raf.current=requestAnimationFrame(()=>onReady?.())}});return null}

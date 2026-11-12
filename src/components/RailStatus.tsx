import {useEffect,useState} from 'react';
import {trainMotion} from './ScheduledTrains';
import timetable from '../data/railTimetable';
import {directionName,koreaClock,nextRailEvent} from '../lib/railSchedule';
export function RailStatus({modelError}:{modelError?:string}){
 const [now,setNow]=useState(Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 const stopped=(['gangneung','seoul'] as const).find(d=>trainMotion[d].visible&&trainMotion[d].phase==='stopped');
 const clock=koreaClock(now),next=nextRailEvent(timetable,now),stale=clock.date>timetable.reviewAfter;
 return <div className="rail-status" role="status"><span className="live-dot"/><span>{modelError|| (stopped?`${trainMotion[stopped].kind==='demo'?'데모 · ':''}진부역 정차 중 ${Math.ceil(trainMotion[stopped].dwellRemaining)}초 · ${directionName(stopped)}`:stale?'시간표 갱신 필요 · 자동 운행 중지':next?`다음 열차 ${next.service.time.slice(0,5)} · ${directionName(next.service.direction)}`:'오늘 예정된 정차 열차 없음')}<small>{modelError?'모델 파일 또는 Draco 디코더를 확인하세요':`열차 시간표 반영 / 실제 위치·지연 미반영`}</small></span><a href={timetable.boardUrl} target="_blank" rel="noreferrer" aria-label="코레일 원본 시간표">시간표 ↗</a></div>
}



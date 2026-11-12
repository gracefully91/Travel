import type {Point} from './geo';
export const TRAIN_SPEED=17;
export const TRAIN_DWELL_SECONDS=60;
export type TrainPhase='hidden'|'approaching'|'stopped'|'departing'|'complete';
export type RailGeometryProfile={length:number;stationDistance:number;entryDistance:number;exitDistance:number};
export function railGeometryProfile(points:Point[],halfExtent:number):RailGeometryProfile{
 let length=0,stationDistance=0,closest=Infinity,entryDistance=Infinity,exitDistance=-Infinity;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len===0)continue;
  const t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dz)/(len*len))),distance=Math.hypot(a[0]+t*dx,a[1]+t*dz);
  if(distance<closest){closest=distance;stationDistance=length+len*t}
  let low=0,high=1;
  for(const [value,delta] of [[a[0],dx],[a[1],dz]]){
   if(Math.abs(delta)<1e-10){if(Math.abs(value)>halfExtent){low=1;high=0;break}}
   else{const t0=(-halfExtent-value)/delta,t1=(halfExtent-value)/delta;low=Math.max(low,Math.min(t0,t1));high=Math.min(high,Math.max(t0,t1))}
  }
  if(low<=high){entryDistance=Math.min(entryDistance,length+low*len);exitDistance=Math.max(exitDistance,length+high*len)}
  length+=len;
 }
 if(!(entryDistance<stationDistance&&stationDistance<exitDistance))throw Error('Station stop must lie inside the mapped rail corridor');
 return {length,stationDistance,entryDistance,exitDistance};
}
export function createTrainJourney(profile:RailGeometryProfile,trainLength:number){
 const startDistance=profile.entryDistance-trainLength/2-2,endDistance=profile.exitDistance+trainLength/2+2,stopDistance=profile.stationDistance;
 if(startDistance<0||endDistance>profile.length)throw Error('Rail source must extend beyond the map by at least half the train length');
 const approachLength=stopDistance-startDistance,departureLength=endDistance-stopDistance;
 const brakeDistance=Math.min(45,approachLength*.4),accelerationDistance=Math.min(45,departureLength*.4);
 const cruiseSeconds=(approachLength-brakeDistance)/TRAIN_SPEED,brakeSeconds=2*brakeDistance/TRAIN_SPEED,accelerationSeconds=2*accelerationDistance/TRAIN_SPEED;
 const approachSeconds=cruiseSeconds+brakeSeconds,departureSeconds=accelerationSeconds+(departureLength-accelerationDistance)/TRAIN_SPEED;
 return {startDistance,endDistance,stopDistance,brakeDistance,accelerationDistance,cruiseSeconds,brakeSeconds,accelerationSeconds,approachSeconds,dwellSeconds:TRAIN_DWELL_SECONDS,departureSeconds,totalSeconds:approachSeconds+TRAIN_DWELL_SECONDS+departureSeconds};
}
export type TrainJourney=ReturnType<typeof createTrainJourney>;
export function trainJourneyState(j:TrainJourney,elapsed:number):{phase:TrainPhase;distance:number;dwellRemaining:number}{
 if(elapsed<0)return {phase:'hidden',distance:j.startDistance,dwellRemaining:0};
 if(elapsed<j.approachSeconds){
  const t=Math.max(0,Math.min(1,(elapsed-j.cruiseSeconds)/j.brakeSeconds));
  const distance=elapsed<j.cruiseSeconds?j.startDistance+elapsed*TRAIN_SPEED:j.stopDistance-j.brakeDistance+j.brakeDistance*(2*t-t*t);
  return {phase:'approaching',distance,dwellRemaining:0};
 }
 const afterArrival=elapsed-j.approachSeconds;
 if(afterArrival<j.dwellSeconds)return {phase:'stopped',distance:j.stopDistance,dwellRemaining:j.dwellSeconds-afterArrival};
 if(elapsed>=j.totalSeconds)return {phase:'complete',distance:j.endDistance,dwellRemaining:0};
 const departureTime=afterArrival-j.dwellSeconds,t=Math.min(1,departureTime/j.accelerationSeconds);
 const distance=departureTime<j.accelerationSeconds?j.stopDistance+j.accelerationDistance*t*t:j.stopDistance+j.accelerationDistance+(departureTime-j.accelerationSeconds)*TRAIN_SPEED;
 return {phase:'departing',distance,dwellRemaining:0};
}

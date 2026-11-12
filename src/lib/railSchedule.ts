export type RailDirection='gangneung'|'seoul';
export type RailService={id:string;trainNumber:string;trainType:string;direction:RailDirection;stationSecond:number;time:string;weekdays:number[];operationNote:string;sourceCell:string};
export type RailTimetable={effectiveFrom:string;verifiedAt:string;reviewAfter:string;sourceUrl:string;services:RailService[]};
export const directionName=(d:RailDirection)=>d==='gangneung'?'강릉·동해 방면':'서울·청량리 방면';
export function koreaClock(now=Date.now()){
 const date=new Date(now+9*3600000);return {date:date.toISOString().slice(0,10),weekday:date.getUTCDay(),second:date.getUTCHours()*3600+date.getUTCMinutes()*60+date.getUTCSeconds()};
}
export function servicesForDate(table:RailTimetable,date:string){
 if(date<table.effectiveFrom||date>table.reviewAfter)return [];
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();return table.services.filter(s=>s.weekdays.includes(weekday));
}
export function railEvents(table:RailTimetable,now=Date.now()){
 const day=koreaClock(now).date;const midnight=Date.parse(day+'T00:00:00+09:00');
 return [-1,0,1].flatMap(offset=>{const base=midnight+offset*86400000,date=koreaClock(base).date;return servicesForDate(table,date).map(service=>({id:date+'/'+service.id,service,at:base+service.stationSecond*1000}))}).sort((a,b)=>a.at-b.at);
}
// Window is derived from the track length and visual speed, not a real GPS position.
export function activeRailEvent(table:RailTimetable,now:number,direction:RailDirection,beforeSeconds:number,afterSeconds:number){
 if(koreaClock(now).date>table.reviewAfter)return undefined;
 return railEvents(table,now).filter(e=>e.service.direction===direction&&now>=e.at-beforeSeconds*1000&&now<=e.at+afterSeconds*1000).sort((a,b)=>Math.abs(a.at-now)-Math.abs(b.at-now))[0];
}
export function nextRailEvent(table:RailTimetable,now=Date.now()){return railEvents(table,now).find(e=>e.at>now)}

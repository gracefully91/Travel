import snapshot from '../../data/processed/jinbu-train-timetable.json';
import type {RailService} from '../lib/railSchedule';
const services:RailService[]=snapshot.services.map(s=>{
 if(s.direction!=='gangneung'&&s.direction!=='seoul')throw Error('Unknown timetable direction: '+s.direction);
 return {...s,direction:s.direction};
});
export default {...snapshot,services};

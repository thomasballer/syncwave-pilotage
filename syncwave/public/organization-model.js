import {PEOPLE,isDate} from './model.js?v=20261027.8';

const DAY=86400000;
const dateAt=value=>new Date(value+'T00:00:00Z');
const iso=date=>date.toISOString().slice(0,10);
const sum=values=>values.reduce((total,value)=>total+value,0);

export function projectWeeks(start,end){
 if(!isDate(start)||!isDate(end)||start>end||dateAt(start).getUTCDay()!==1||dateAt(end).getUTCDay()!==5)throw Error('Le projet doit commencer un lundi et finir un vendredi.');
 const weeks=[];
 for(let time=dateAt(start).getTime();time<=dateAt(end).getTime();time+=7*DAY){
  weeks.push({id:'W'+(weeks.length+1),index:weeks.length,start:iso(new Date(time)),end:iso(new Date(Math.min(time+6*DAY,dateAt(end).getTime())))});
 }
 return weeks;
}

function allocateWeeks(weights,target,limit,step){
 const weightTotal=sum(weights),ideal=weights.map(weight=>weight/weightTotal*target);
 const planned=ideal.map(value=>Math.min(limit,Math.floor(value/step)*step));
 let remaining=target-sum(planned);
 while(remaining>0){
  let selected=-1;
  for(let i=0;i<planned.length;i++)if(planned[i]+step<=limit&&(selected===-1||ideal[i]-planned[i]>ideal[selected]-planned[selected]))selected=i;
  if(selected===-1)throw Error('La cible de charge dépasse le plafond hebdomadaire.');
  planned[selected]+=step;remaining-=step;
 }
 return planned;
}

export function buildOrganizationPlan(config){
 const weeks=projectWeeks(config.start,config.end),capacity=config.weeklyLimitMinutes,step=config.roundingMinutes,ratio=config.targetPlannedRatio,peak=config.maxWeeklyPlannedRatio;
 if(!Number.isInteger(capacity)||capacity<=0||!Number.isInteger(step)||step<=0||capacity%step||!Number.isFinite(ratio)||ratio<=0||ratio>=1||!Number.isFinite(peak)||peak<ratio||peak>1)throw Error('Paramètres de charge invalides.');
 const members=PEOPLE.map(name=>{
  const profile=config.profiles?.[name];
  if(!profile||profile.weights?.length!==weeks.length||profile.focus?.length!==weeks.length||profile.weights.some(value=>!Number.isFinite(value)||value<=0)||profile.focus.some(value=>typeof value!=='string'||!value.trim()))throw Error('Profil hebdomadaire incomplet : '+name);
  const memberCapacity=profile.weeklyLimitMinutes??capacity;
  if(!Number.isInteger(memberCapacity)||memberCapacity<=0||memberCapacity>capacity||memberCapacity%step)throw Error('Plafond individuel invalide : '+name);
  const totalCapacity=weeks.length*memberCapacity,target=Math.round(totalCapacity*ratio/step)*step,limit=Math.floor(memberCapacity*peak/step)*step;
  const minutes=allocateWeeks(profile.weights,target,limit,step);
  const allocations=weeks.map((week,index)=>({...week,capacity:memberCapacity,planned:minutes[index],margin:memberCapacity-minutes[index],focus:profile.focus[index]}));
  return {name,weeklyLimitMinutes:memberCapacity,weeks:allocations,capacity:totalCapacity,planned:sum(minutes),margin:totalCapacity-sum(minutes),plannedRatio:sum(minutes)/totalCapacity,minWeek:Math.min(...minutes),maxWeek:Math.max(...minutes)};
 });
 return {version:config.version,asOf:config.asOf,start:config.start,end:config.end,weeklyLimitMinutes:capacity,targetPlannedRatio:ratio,roundingMinutes:step,weeks,members,weeklyTeamCapacity:sum(members.map(member=>member.weeklyLimitMinutes)),capacity:sum(members.map(member=>member.capacity)),planned:sum(members.map(member=>member.planned)),margin:sum(members.map(member=>member.margin))};
}

export function weekForDate(weeks,date){return weeks.find(week=>date>=week.start&&date<=week.end)||null;}
export function weekTotals(plan,index){
 if(!plan.weeks[index])throw Error('Semaine inconnue.');
 const cells=plan.members.map(member=>member.weeks[index]);
 return {planned:sum(cells.map(cell=>cell.planned)),margin:sum(cells.map(cell=>cell.margin)),capacity:sum(cells.map(cell=>cell.capacity))};
}
export function formatMinutes(minutes){
 if(!Number.isInteger(minutes)||minutes<0)throw Error('Durée invalide.');
 const hours=Math.floor(minutes/60),rest=minutes%60;
 return hours?(hours+' h'+(rest?' '+String(rest).padStart(2,'0'):'')):(rest+' min');
}

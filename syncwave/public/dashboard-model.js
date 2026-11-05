import {isDone,isDate} from './model.js?v=20261105.1';
const plusDays=(date,days)=>new Date(Date.parse(date+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
export function dashboardState(items,date){
 if(!isDate(date))throw Error('Date du tableau de bord invalide.');
 const open=items.filter(d=>!isDone(d)),done=items.filter(isDone),until=plusDays(date,7);
 const overdue=open.filter(d=>d.date<date).sort((a,b)=>a.date.localeCompare(b.date));
 const upcoming=open.filter(d=>d.date>=date&&d.date<=until).sort((a,b)=>a.date.localeCompare(b.date)||Number(Boolean(b.focus))-Number(Boolean(a.focus))||a.id.localeCompare(b.id));
 const current=open.filter(d=>['En cours','Bloqué'].includes(d.status)).sort((a,b)=>Number(b.status==='Bloqué')-Number(a.status==='Bloqué')||a.date.localeCompare(b.date));
 return {date,until,done:done.length,total:items.length,started:open.filter(d=>d.status==='En cours').length,blocked:open.filter(d=>d.status==='Bloqué').length,overdue,upcoming,current,recent:done.sort((a,b)=>b.completedDate.localeCompare(a.completedDate)).slice(0,5)};
}
export function validateAnnouncement(input){
 const title=String(input?.title||'').trim(),message=String(input?.message||'').trim(),date=input?.date,priority=input?.priority;
 if(!title||title.length>100||!message||message.length>1000||!isDate(date)||!['info','important','urgent'].includes(priority))throw Error('Renseignez un titre, un message, une date et une priorité valides.');
 return {id:String(input.id||''),title,message,date,priority,archived:Boolean(input.archived)};
}

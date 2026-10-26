function renderFocus(){const rows=data.filter(d=>d.focus).sort((a,b)=>a.date.localeCompare(b.date));$('#focusObjectives').innerHTML='<div class="focus-grid">'+rows.map(d=>`<button class="focus-item" data-id="${d.id}"><span><strong>${esc(d.title)}</strong><small>${esc(assignments(d).join(' + ')||'Non assigné')} · ${esc(d.status)}</small></span><time>${fmt(d.date)}</time></button>`).join('')+'</div>';}
const dayMs=86400000,stamp=d=>Date.parse(d+'T00:00:00Z'),referenceDate=stamp('2026-10-26'),collapsedGroups=new Set();
let ganttMode='summary';
const shortDate=d=>new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(d+'T12:00:00Z'));
function renderGantt(){
 if(!data.length)return;
 const mode=$('#ganttRange').value,group=$('#ganttGroup').value,person=$('#ganttPerson').value,status=$('#ganttStatus').value,compare=$('#ganttCompare').checked;
 const start=mode==='full'?Math.min(stamp('2026-09-14'),...data.map(d=>stamp(d.actualStart||d.completedDate||d.start||d.date))):referenceDate;
 const end=mode==='fortnight'?stamp('2026-11-06'):Math.max(stamp('2026-12-11'),...data.map(d=>stamp(d.date)));
 const days=Math.round((end-start)/dayMs)+1,daily=mode==='fortnight';
 const stateMatch=d=>status==='all'||(status==='completed'?validated(d):status==='started'?d.status==='En cours':!validated(d)&&d.status!=='En cours');
 const sourceItems=data.filter(d=>(group==='all'||d.g===Number(group))&&(person==='all'||assignments(d).includes(person))&&stateMatch(d));
 const visible=d=>{
  const planned=(d.start?stamp(d.start):stamp(d.date))<=end&&stamp(d.date)>=start;
  const actual=d.completedDate&&stamp(d.completedDate)>=start&&stamp(d.completedDate)<=end;
  return validated(d)?actual||(compare&&planned):planned;
 };
 const entries=sourceItems.filter(visible),summary=ganttMode==='summary';
 $('#ganttSummary').classList.toggle('selected',summary);$('#ganttDetails').classList.toggle('selected',!summary);
 $('#ganttSummary').setAttribute('aria-pressed',summary);$('#ganttDetails').setAttribute('aria-pressed',!summary);
 $('#ganttExpand').hidden=summary;$('#ganttCompareLabel').hidden=summary;
 $('#ganttInfo').textContent=`${entries.length} sur cette période · ${sourceItems.length} au total · ${shortDate(new Date(start).toISOString().slice(0,10))} – ${shortDate(new Date(end).toISOString().slice(0,10))} 2026`;
 $('#ganttLegend').innerHTML=summary?'<span><i class="gg-key window"></i>Fenêtre des échéances</span><span><i class="gg-key completed"></i>Réalisation connue</span><span><i class="gg-key reference"></i>26 octobre</span>':'<span><i class="gg-key planned"></i>Période prévue</span><span><i class="gg-key completed"></i>Terminé</span><span><i class="gg-key deadline"></i>Échéance sans durée définie</span>';
 $('#ganttNote').textContent=summary?'Chaque bande relie la première et la dernière échéance du livrable. Elle ne représente pas une durée de travail. Cliquez sur une bande pour voir les objectifs.':compare?'Le prévu apparaît en contour, le réalisé en vert et le travail engagé avant le 26 octobre en violet. Un début inconnu reste un point, sans durée inventée.':'Les dates sont écrites à gauche. Une période apparaît seulement si son début est défini ; sinon, une étiquette marque l’échéance. Cliquez sur un objectif pour ouvrir sa fiche.';
 const position=t=>(t-start)/dayMs/days*100;
 const weekTicks=[];for(let t=start;t<=end;t+=(daily?1:7)*dayMs)weekTicks.push({start:t,end:Math.min(end,t+((daily?1:7)-1)*dayMs)});
 const months=[];for(let t=start;t<=end;){const date=new Date(t),next=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);months.push({start:t,end:Math.min(end,next-dayMs),label:new Intl.DateTimeFormat('fr-FR',{month:(Math.min(end,next-dayMs)-t)/dayMs+1<20?'short':'long'}).format(date)});t=next;}
 const lines=weekTicks.map(t=>`<span class="gg-gridline" style="left:${position(t.start)}%"></span>`).join('');
 const ref=referenceDate>=start&&referenceDate<=end?`<span class="gg-ref-line" style="left:${position(referenceDate)+50/days}%"></span>`:'';
 function background(){return lines+ref;}
 function period(a,b,classes,inner,id,tooltip){if(b<start||a>end)return '';const left=position(Math.max(a,start)),width=(Math.min(b,end)-Math.max(a,start)+dayMs)/dayMs/days*100;return `<button class="gg-period ${classes}" data-id="${id}" style="left:${left}%;width:${width}%" title="${esc(tooltip)}" aria-label="${esc(tooltip)}">${width>10?inner:''}</button>`;}
 function point(date,d,completed=false){const t=stamp(date);if(t<start||t>end)return '';const left=position(t)+50/days,edge=left<9?'edge-left':left>91?'edge-right':'';const title=`${d.title} · ${completed?'terminé le':'échéance du'} ${fmt(date)}`;return `<button class="gg-point ${completed?'completed':''} ${edge}" data-id="${d.id}" style="left:${left}%" title="${esc(title)}" aria-label="${esc(title)}"><span class="gg-point-mark">${completed?'●':'◆'}</span><span class="gg-point-date">${shortDate(date)}</span></button>`;}
 let html=`<div class="gg-board ${summary?'is-summary':'is-detail'}"><div class="gg-header"><div class="gg-label-head">${summary?'Livrable et avancement':'Objectif et personnes'}</div><div class="gg-time-head"><div class="gg-months">${months.map(m=>`<span style="left:${position(m.start)}%;width:${(m.end-m.start+dayMs)/dayMs/days*100}%">${m.label}</span>`).join('')}</div><div class="gg-ticks">${weekTicks.map(t=>`<span style="left:${position(t.start)}%;width:${(t.end-t.start+dayMs)/dayMs/days*100}%"><strong>${new Date(t.start).getUTCDate()}</strong>${daily?'<small>'+new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(new Date(t.start))+'</small>':'<small>'+new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(new Date(t.start))+'</small>'}</span>`).join('')}</div></div></div>`;
 for(let i=0;i<groups.length;i++){
  const items=entries.filter(d=>d.g===i).sort((a,b)=>(a.completedDate||a.date).localeCompare(b.completedDate||b.date));
  const groupSource=sourceItems.filter(d=>d.g===i);if(!groupSource.length)continue;
  const done=groupSource.filter(validated).length,prior=groupSource.filter(d=>validated(d)&&stamp(d.completedDate)<start).length;
  if(summary){
   const upcoming=items.filter(d=>!validated(d)),completed=items.filter(validated),dates=upcoming.map(d=>stamp(d.date));
   let track=background();
   if(dates.length){const a=Math.min(...dates),b=Math.max(...dates),left=position(a),width=(b-a+dayMs)/dayMs/days*100;track+=`<button class="gg-window" data-gantt-drill="${i}" style="left:${left}%;width:${width}%" aria-label="Voir les objectifs de ${esc(groups[i].name)}"><span>${upcoming.length} à terminer</span><b>↗</b></button>`;}
   const buckets=new Map();for(const d of completed){const bucket=Math.floor((stamp(d.completedDate)-start)/dayMs/(daily?1:7));if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(d);}
   for(const bucket of buckets.values()){const d=bucket[0],left=position(stamp(d.completedDate))+50/days;track+=`<button class="gg-summary-done" data-gantt-drill="${i}" style="left:${left}%" title="${esc(bucket.map(d=>d.title+' · '+fmt(d.completedDate)).join('\n'))}" aria-label="${bucket.length} réalisation${bucket.length>1?'s':''} pour ${groups[i].name}">✓${bucket.length>1?bucket.length:''}</button>`;}
   if(!dates.length&&!completed.length)track+='<span class="gg-no-event">Aucune échéance sur cette période</span>';
   const range=dates.length?`${shortDate(new Date(Math.min(...dates)).toISOString().slice(0,10))} – ${shortDate(new Date(Math.max(...dates)).toISOString().slice(0,10))}`:'Réalisations historiques';
   html+=`<div class="gg-row gg-summary-row" style="--color:${groups[i].color}"><button class="gg-row-label" data-gantt-drill="${i}"><span class="gg-group-name"><i></i>${groups[i].name}</span><strong>${done}/${groupSource.length} terminés <span>· ${esc(range)}</span></strong><small>${prior?prior+' réalisation'+(prior>1?'s':'')+' avant cette période':'Voir les objectifs et leurs dates'} ↗</small></button><div class="gg-row-track">${track}</div></div>`;
  }else{
   if(!items.length)continue;html+=`<button class="gg-section-row" data-collapse="${i}" aria-expanded="${!collapsedGroups.has(i)}" style="--color:${groups[i].color}"><span>${collapsedGroups.has(i)?'▸':'▾'} ${groups[i].name}</span><small>${items.length} objectif${items.length>1?'s':''}</small></button>`;
   if(collapsedGroups.has(i))continue;
   for(const d of items){
    let track=background();const complete=validated(d),actualEnd=d.completedDate||'2026-10-26';
    if(complete){
     if(compare){if(d.start)track+=period(stamp(d.start),stamp(d.date),'is-baseline','',d.id,'Prévu : '+d.title+' · '+fmt(d.date));else track+=`<span class="gg-baseline-marker" style="left:${position(stamp(d.date))+50/days}%" title="Échéance prévue ${fmt(d.date)}">◇</span>`;}
     track+=d.actualStart?period(stamp(d.actualStart),stamp(d.completedDate),'is-done','✓ '+shortDate(d.completedDate),d.id,`${d.title} · réalisé du ${fmt(d.actualStart)} au ${fmt(d.completedDate)}`):point(d.completedDate,d,true);
    }else{
     track+=d.start?period(stamp(d.start),stamp(d.date),'is-planned',shortDate(d.start)+' – '+shortDate(d.date),d.id,`${d.title} · prévu du ${fmt(d.start)} au ${fmt(d.date)}`):point(d.date,d);
     if(compare&&d.actualStart)track+=period(stamp(d.actualStart),stamp(actualEnd),'is-underway','En cours',d.id,`${d.title} · début connu ${fmt(d.actualStart)} · état au 26 octobre`);
    }
    if(!track.replace(lines,'').replace(ref,''))track+='<span class="gg-no-event">Hors de la période affichée</span>';
    const dateLabel=complete?'Terminé le '+fmt(d.completedDate):(d.start?shortDate(d.start)+' → ':'Échéance : ')+fmt(d.date);
    html+=`<div class="gg-row gg-objective-row" style="--color:${groups[i].color}"><div class="gg-row-label"><button data-id="${d.id}">${esc(d.title)}</button><span class="gg-person-line">${esc(assignments(d).join(' + ')||'Non assigné')}</span><div class="gg-row-meta"><span class="gg-status ${complete?'done':d.status==='En cours'?'started':''}">${esc(d.status)}</span><time>${esc(dateLabel)}</time></div></div><div class="gg-row-track">${track}</div></div>`;
   }
  }
 }
 html+='</div>';$('#ganttChart').innerHTML=sourceItems.length?html:'<div class="gg-empty">Aucun objectif pour ces filtres.</div>';
}
$('#ganttGroup').insertAdjacentHTML('beforeend',groups.map((g,i)=>`<option value="${i}">${g.name}</option>`).join(''));$('#ganttPerson').insertAdjacentHTML('beforeend',people.map(p=>`<option>${p}</option>`).join(''));
['#ganttRange','#ganttGroup','#ganttPerson','#ganttStatus','#ganttCompare'].forEach(s=>$(s).addEventListener('change',renderGantt));
$('#ganttSummary').onclick=()=>{ganttMode='summary';renderGantt();};$('#ganttDetails').onclick=()=>{ganttMode='details';renderGantt();};
$('#ganttCompleted').onclick=()=>{$('#ganttGroup').value='all';$('#ganttPerson').value='all';$('#ganttRange').value='full';$('#ganttStatus').value='completed';ganttMode='details';collapsedGroups.clear();renderGantt();};
$('#ganttExpand').onclick=()=>{collapsedGroups.clear();renderGantt();};
$('#ganttWide').onclick=()=>{const wide=document.body.classList.toggle('gg-wide');$('#ganttWide').textContent=wide?'Réduire ↙':'Agrandir ↗';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('gg-wide')&&!document.querySelector('dialog[open]')){document.body.classList.remove('gg-wide');$('#ganttWide').textContent='Agrandir ↗';}});
document.addEventListener('click',e=>{const drill=e.target.closest('[data-gantt-drill]');if(drill){$('#ganttGroup').value=drill.dataset.ganttDrill;ganttMode='details';collapsedGroups.clear();renderGantt();if(document.body.classList.contains('gg-wide'))$('#gantt').scrollTop=0;else $('#gantt').scrollIntoView({block:'start',behavior:'smooth'});}const collapse=e.target.closest('[data-collapse]');if(collapse){const i=Number(collapse.dataset.collapse);collapsedGroups.has(i)?collapsedGroups.delete(i):collapsedGroups.add(i);renderGantt();}});

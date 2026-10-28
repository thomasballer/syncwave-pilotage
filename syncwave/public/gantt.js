function renderFocus(){const rows=data.filter(d=>d.focus).sort((a,b)=>a.date.localeCompare(b.date));$('#focusObjectives').innerHTML='<div class="focus-grid">'+rows.map(d=>`<button class="focus-item" data-id="${d.id}"><span><strong>${esc(d.title)}</strong><small>${esc(assignments(d).join(' + ')||'Non assigné')} · ${esc(d.status)}</small></span><time>${validated(d)?completionPrefix(d):''}${fmt(d.completedDate||d.date)}</time></button>`).join('')+'</div>';}
const dayMs=86400000,stamp=d=>Date.parse(d+'T00:00:00Z'),referenceDate=stamp('2026-10-26'),collapsedGroups=new Set();
let ganttMode='details',selectedGanttId='P9',ganttChainOnly=false,ganttModel,ganttFrame=0,ganttObserver,ganttCenterPending=false;
const shortDate=d=>new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(d+'T12:00:00Z'));
function scheduleGanttLinks(){
 cancelAnimationFrame(ganttFrame);ganttFrame=requestAnimationFrame(drawGanttLinks);
}
function drawGanttLinks(){
 const svg=$('#ganttLinks'),body=$('#ganttBody');
 if(!svg||!body||!body.offsetWidth||!ganttModel)return;
 const bounds=svg.getBoundingClientRect(),anchors=new Map();
 body.querySelectorAll('[data-gantt-row]').forEach(row=>{
  const anchor=row.querySelector('[data-gantt-anchor]');if(!anchor)return;
  const box=anchor.getBoundingClientRect();
  anchors.set(row.dataset.ganttRow,{x:box.right-bounds.left,y:box.top+box.height/2-bounds.top});
 });
 const graph=ganttModel.ganttConnections(data,anchors.keys(),selectedGanttId,$('#ganttFlow').value);
 svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
 svg.innerHTML='<defs><marker id="gg-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#b69bcb"/></marker><marker id="gg-arrow-focus" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#f79ed7"/></marker></defs>'+graph.links.sort((a,b)=>Number(a.focused)-Number(b.focused)).map((link,index)=>`<path data-gantt-from="${link.from}" data-gantt-to="${link.to}" class="gg-link ${link.focused?'is-focused':''}" d="${ganttModel.validationPath(anchors.get(link.from),anchors.get(link.to),index,bounds.width)}" marker-end="url(#gg-arrow${link.focused?'-focus':''})"/>`).join('');
 const hidden=graph.hidden.length,mode=$('#ganttFlow').value;
 $('#ganttLinkStatus').textContent=mode==='none'?'Flèches masquées.':`${graph.links.length} lien${graph.links.length>1?'s':''} visible${graph.links.length>1?'s':''}${hidden?` · ${hidden} lien${hidden>1?'s':''} vers des prérequis hors de la période, filtrés ou repliés`:''}.`;
 $('#ganttReveal').hidden=!hidden;$('#ganttCenter').disabled=!anchors.has(selectedGanttId);
 if(ganttCenterPending){ganttCenterPending=false;centerGanttSelection();}
}
function centerGanttSelection(){
 const row=document.querySelector('[data-gantt-row="'+selectedGanttId+'"]'),anchor=row?.querySelector('[data-gantt-anchor]'),scroller=$('#ganttScroll');
 if(!anchor||!scroller)return;
 const box=anchor.getBoundingClientRect(),container=scroller.getBoundingClientRect(),labelWidth=row.querySelector('.gg-row-label').getBoundingClientRect().width;
 scroller.scrollLeft=Math.max(0,scroller.scrollLeft+box.right-container.left-labelWidth-(scroller.clientWidth-labelWidth)*0.65);
 scroller.scrollTop=Math.max(0,scroller.scrollTop+row.getBoundingClientRect().top-container.top-$('#ganttChart .gg-header').offsetHeight-100);
}
function selectGantt(id,center=false){
 if(!data.some(d=>d.id===id))return;
 selectedGanttId=id;ganttCenterPending=center;collapsedGroups.clear();renderGantt();
}
function revealGanttChain(){
 ganttMode='details';ganttChainOnly=true;ganttCenterPending=true;collapsedGroups.clear();
 $('#ganttGroup').value='all';$('#ganttPerson').value='all';$('#ganttStatus').value='all';$('#ganttRange').value='full';
 if($('#ganttFlow').value==='none')$('#ganttFlow').value='focus';
 renderGantt();
}
function renderGanttFocus(){
 const selected=data.find(d=>d.id===selectedGanttId);if(!selected)return;
 const before=workflowModel.directPrerequisites(data,selected.id),after=workflowModel.directSuccessors(data,selected.id),chain=ganttModel.ganttChain(data,selected.id);
 const chip=(d,kind)=>`<button data-gantt-select="${d.id}" title="${esc(d.title)}" class="${validated(d)?'is-done':''}"><b>${d.id}</b> ${esc(d.title)}<span>${kind==='before'?(validated(d)?'✓':'À valider'):'→'}</span></button>`;
 $('#ganttTarget').innerHTML=data.map(d=>`<option value="${d.id}">${d.id} · ${esc(d.title)}</option>`).join('');$('#ganttTarget').value=selected.id;
 $('#ganttFocusTitle').textContent=selected.id+' · '+selected.title;
 $('#ganttFocusMeta').textContent=`${groups[selected.g].name} · ${validated(selected)?completionPrefix(selected):'Échéance : '}${fmt(selected.completedDate||selected.date)} · ${chain.size-1} prérequis dans la chaîne`;
 $('#ganttBefore').innerHTML=before.length?before.map(d=>chip(d,'before')).join(''):'<span class="gg-no-dependency">Aucun prérequis</span>';
 $('#ganttAfter').innerHTML=after.length?after.map(d=>chip(d,'after')).join(''):'<span class="gg-no-dependency">Dernière étape de sa chaîne</span>';
 $('#ganttIsolate').textContent=ganttChainOnly?'Revenir à tout le planning':'Isoler cette chaîne';
 $('#ganttIsolate').setAttribute('aria-pressed',String(ganttChainOnly));
 $('#ganttFocusOpen').dataset.id=selected.id;
}
function renderGantt(){
 if(!data.length||!ganttModel)return;
 const mode=$('#ganttRange').value,group=$('#ganttGroup').value,person=$('#ganttPerson').value,status=$('#ganttStatus').value,compare=$('#ganttCompare').checked,zoom=$('#ganttZoom').value;
 const start=mode==='full'?Math.min(stamp('2026-09-14'),...data.map(d=>stamp(d.actualStart||d.completedDate||d.start||d.date))):referenceDate;
 const end=mode==='fortnight'?stamp('2026-11-06'):Math.max(stamp('2026-12-11'),...data.map(d=>stamp(d.date)));
 const days=Math.round((end-start)/dayMs)+1,daily=zoom==='days'||mode==='fortnight';
 const chain=ganttModel.ganttChain(data,selectedGanttId);
 const stateMatch=d=>status==='all'||(status==='completed'?validated(d):status==='started'?d.status==='En cours':!validated(d)&&d.status!=='En cours');
 const sourceItems=data.filter(d=>(!ganttChainOnly||chain.has(d.id))&&(group==='all'||d.g===Number(group))&&(person==='all'||assignments(d).includes(person))&&stateMatch(d));
 const visible=d=>{
  const planned=(d.start?stamp(d.start):stamp(d.date))<=end&&stamp(d.date)>=start;
  const actual=d.completedDate&&stamp(d.completedDate)>=start&&stamp(d.completedDate)<=end;
  return validated(d)?actual||(compare&&planned):planned;
 };
 const entries=sourceItems.filter(visible),summary=ganttMode==='summary';
 $('#ganttSummary').classList.toggle('selected',summary);$('#ganttDetails').classList.toggle('selected',!summary);
 $('#ganttSummary').setAttribute('aria-pressed',summary);$('#ganttDetails').setAttribute('aria-pressed',!summary);
 $('#ganttExpand').hidden=summary;$('#ganttCompareLabel').hidden=summary;$('#ganttDependencyPanel').hidden=summary;$('#ganttFlowLabel').hidden=summary;
 $('#ganttInfo').textContent=`${entries.length} objectifs affichés · ${ganttChainOnly?'chaîne sélectionnée · ':''}${shortDate(new Date(start).toISOString().slice(0,10))} – ${shortDate(new Date(end).toISOString().slice(0,10))} 2026`;
 $('#ganttLegend').innerHTML=summary?'<span><i class="gg-key window"></i>Fenêtre des échéances</span><span><i class="gg-key completed"></i>Réalisation connue</span>':'<span><i class="gg-key planned"></i>Période prévue</span><span><i class="gg-key completed"></i>Terminé</span><span><i class="gg-key deadline"></i>Échéance sans début défini</span><span><i class="gg-key arrow"></i>Ordre de validation</span><span><i class="gg-key today"></i>Aujourd’hui</span>';
 $('#ganttNote').textContent=summary?'Chaque bande relie la première et la dernière échéance du livrable ; elle ne représente pas une durée de travail. Les flèches se consultent dans la vue « Objectifs et dépendances ».':'Les flèches relient les validations : le prérequis doit être terminé pour valider le résultat suivant. La préparation peut avancer en parallèle. Une barre n’est tracée que si le début est renseigné ; sinon, le losange marque uniquement l’échéance. Cliquez sur une barre ou un losange pour suivre sa chaîne, sur le titre à gauche pour ouvrir la fiche.';
 if(!summary)renderGanttFocus();
 const position=t=>(t-start)/dayMs/days*100,iso=t=>new Date(t).toISOString().slice(0,10);
 const weekTicks=[];for(let t=start;t<=end;t+=(daily?1:7)*dayMs)weekTicks.push({start:t,end:Math.min(end,t+((daily?1:7)-1)*dayMs)});
 const months=[];for(let t=start;t<=end;){const date=new Date(t),next=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);months.push({start:t,end:Math.min(end,next-dayMs),label:new Intl.DateTimeFormat('fr-FR',{month:(Math.min(end,next-dayMs)-t)/dayMs+1<20?'short':'long'}).format(date)});t=next;}
 const lines=weekTicks.map(t=>`<span class="gg-gridline" style="left:${position(t.start)}%"></span>`).join('');
 const weekends=[];for(let t=start;t<=end;t+=dayMs)if([0,6].includes(new Date(t).getUTCDay()))weekends.push(`<span class="gg-weekend" style="left:${position(t)}%;width:${100/days}%"></span>`);
 const todayStamp=stamp(today()),todayLeft=position(todayStamp)+50/days;
 const ref=todayStamp>=start&&todayStamp<=end?`<span class="gg-ref-line is-today" style="left:${todayLeft}%"></span>`:'';
 function background(){return weekends.join('')+lines+ref;}
 function period(a,b,classes,inner,d,tooltip,anchor=false){if(b<start||a>end)return '';const left=position(Math.max(a,start)),width=(Math.min(b,end)-Math.max(a,start)+dayMs)/dayMs/days*100;return `<button class="gg-period ${classes}" data-gantt-select="${d.id}" ${anchor&&b<=end&&b>=start?'data-gantt-anchor':''} style="left:${left}%;width:${width}%" title="${esc(tooltip)}" aria-label="Suivre la chaîne : ${esc(tooltip)}">${width>5?inner:''}</button>`;}
 function point(date,d,completed=false){const t=stamp(date);if(t<start||t>end)return '';const left=position(t)+50/days,edge=left<9?'edge-left':left>91?'edge-right':'';const title=`${d.id} · ${d.title} · ${completed?completionPrefix(d).trim():'échéance du'} ${fmt(date)}`;return `<button class="gg-point ${completed?'completed':''} ${edge}" data-gantt-select="${d.id}" style="left:${left}%" title="${esc(title)}" aria-label="Suivre la chaîne : ${esc(title)}"><span class="gg-point-mark" data-gantt-anchor>${completed?'●':'◆'}</span><span class="gg-point-date">${shortDate(date)}</span></button>`;}
 const minWidth=summary?850:Math.max(mode==='fortnight'?760:960,310+days*(zoom==='days'?38:zoom==='compact'?13:22)+48);
 let html=`<div class="gg-board ${summary?'is-summary':'is-detail'}" style="min-width:${minWidth}px"><div class="gg-header"><div class="gg-label-head">${summary?'Livrable et avancement':'Objectif · responsable · échéance'}</div><div class="gg-time-head"><div class="gg-time-scale"><div class="gg-months">${months.map(m=>`<span style="left:${position(m.start)}%;width:${(m.end-m.start+dayMs)/dayMs/days*100}%">${m.label}</span>`).join('')}</div><div class="gg-ticks">${weekTicks.map(t=>`<span style="left:${position(t.start)}%;width:${(t.end-t.start+dayMs)/dayMs/days*100}%"><strong>${new Date(t.start).getUTCDate()}</strong><small>${new Intl.DateTimeFormat('fr-FR',{[daily?'weekday':'month']:'short'}).format(new Date(t.start))}</small></span>`).join('')}</div>${ref?`<span class="gg-today-label" style="left:${todayLeft}%">${shortDate(today())}</span>`:''}</div></div></div><div class="gg-body" id="ganttBody">`;
 let drawnRows=0;
 for(let i=0;i<groups.length;i++){
  const items=entries.filter(d=>d.g===i).sort((a,b)=>(a.completedDate||a.date).localeCompare(b.completedDate||b.date)||a.id.localeCompare(b.id));
  const groupSource=sourceItems.filter(d=>d.g===i);if(!groupSource.length)continue;
  const done=groupSource.filter(validated).length,prior=groupSource.filter(d=>validated(d)&&stamp(d.completedDate)<start).length;
  if(summary){
   const upcoming=items.filter(d=>!validated(d)),completed=items.filter(validated),dates=upcoming.map(d=>stamp(d.date));let track=background();
   if(dates.length){const a=Math.min(...dates),b=Math.max(...dates),left=position(a),width=(b-a+dayMs)/dayMs/days*100;track+=`<button class="gg-window" data-gantt-drill="${i}" style="left:${left}%;width:${width}%" aria-label="Voir les objectifs de ${esc(groups[i].name)}"><span>${upcoming.length} à terminer</span><b>↗</b></button>`;}
   const buckets=new Map();for(const d of completed){const bucket=Math.floor((stamp(d.completedDate)-start)/dayMs/(daily?1:7));if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(d);}
   for(const bucket of buckets.values()){const d=bucket[0],left=position(stamp(d.completedDate))+50/days;track+=`<button class="gg-summary-done" data-gantt-drill="${i}" style="left:${left}%" title="${esc(bucket.map(d=>d.title+' · '+fmt(d.completedDate)).join('\n'))}" aria-label="${bucket.length} réalisations pour ${groups[i].name}">✓${bucket.length>1?bucket.length:''}</button>`;}
   if(!dates.length&&!completed.length)track+='<span class="gg-no-event">Aucune échéance sur cette période</span>';
   const range=dates.length?`${shortDate(iso(Math.min(...dates)))} – ${shortDate(iso(Math.max(...dates)))}`:'Réalisations historiques';
   html+=`<div class="gg-row gg-summary-row" style="--color:${groups[i].color}"><button class="gg-row-label" data-gantt-drill="${i}"><span class="gg-group-name"><i></i>${groups[i].name}</span><strong>${done}/${groupSource.length} terminés <span>· ${esc(range)}</span></strong><small>${prior?prior+' réalisations avant cette période':'Voir les objectifs et leurs dates'} ↗</small></button><div class="gg-row-track"><div class="gg-track-scale">${track}</div></div></div>`;
  }else{
   if(!items.length)continue;html+=`<button class="gg-section-row" data-collapse="${i}" aria-expanded="${!collapsedGroups.has(i)}" style="--color:${groups[i].color}"><span>${collapsedGroups.has(i)?'▸':'▾'} ${groups[i].name}</span><small>${items.length} objectifs · ${items.filter(validated).length} terminés</small></button>`;
   if(collapsedGroups.has(i))continue;
   for(const d of items){
    drawnRows++;let marks='',complete=validated(d);const dependencies=workflowModel.depsOf(d);
    if(complete){
     if(compare){if(d.start)marks+=period(stamp(d.start),stamp(d.date),'is-baseline','',d,'Prévu : '+d.title+' · '+fmt(d.date));else if(stamp(d.date)>=start&&stamp(d.date)<=end)marks+=`<span class="gg-baseline-marker" style="left:${position(stamp(d.date))+50/days}%" title="Échéance prévue ${fmt(d.date)}">◇</span>`;}
     marks+=d.actualStart?period(stamp(d.actualStart),stamp(d.completedDate),'is-done','✓ '+shortDate(d.completedDate),d,`${d.id} · ${d.title} · réalisé du ${fmt(d.actualStart)} au ${fmt(d.completedDate)}`,true):point(d.completedDate,d,true);
    }else{
     marks+=d.start?period(stamp(d.start),stamp(d.date),'is-planned',shortDate(d.start)+' – '+shortDate(d.date),d,`${d.id} · ${d.title} · prévu du ${fmt(d.start)} au ${fmt(d.date)}`,true):point(d.date,d);
     if(compare&&d.actualStart)marks+=period(stamp(d.actualStart),stamp('2026-10-26'),'is-underway','En cours',d,`${d.title} · début connu ${fmt(d.actualStart)} · état au 26 octobre`);
    }
    const dateLabel=complete?completionPrefix(d)+fmt(d.completedDate):(d.start?shortDate(d.start)+' → ':'Échéance : ')+fmt(d.date);
    html+=`<div class="gg-row gg-objective-row ${d.id===selectedGanttId?'is-selected':chain.has(d.id)?'in-chain':''}" data-gantt-row="${d.id}" style="--color:${groups[i].color}"><div class="gg-row-label"><button class="gg-task-title" data-id="${d.id}"><b>${d.id}</b><span>${esc(d.title)}</span></button><span class="gg-person-line">${esc(assignments(d).join(' + ')||'Non assigné')}</span><div class="gg-row-meta"><span class="gg-status ${complete?'done':d.status==='En cours'?'started':''}">${esc(d.status)}</span><time>${esc(dateLabel)}</time></div><button class="gg-dependency-hint" data-gantt-select="${d.id}" aria-label="Suivre les dépendances de ${d.id}">${dependencies.length?'Prérequis : '+dependencies.join(' · '):'Aucun prérequis'} <span>↗</span></button></div><div class="gg-row-track"><div class="gg-track-scale">${background()+marks||'<span class="gg-no-event">Hors période</span>'}</div></div></div>`;
   }
  }
 }
 if(!summary)html+='<svg id="ganttLinks" class="gg-links" aria-hidden="true"></svg>';
 html+='</div></div>';
 if(!summary&&!drawnRows)html='<div class="gg-empty">Aucun objectif visible. Élargissez les filtres ou affichez toute la chaîne.</div>';
 $('#ganttChart').innerHTML=sourceItems.length?html:'<div class="gg-empty">Aucun objectif pour ces filtres.</div>';
 if(ganttObserver)ganttObserver.disconnect();
 if(!summary&&$('#ganttBody')){ganttObserver??=new ResizeObserver(scheduleGanttLinks);ganttObserver.observe($('#ganttBody'));scheduleGanttLinks();}
 else if(!summary){$('#ganttLinkStatus').textContent='Aucun lien visible avec ces filtres.';$('#ganttReveal').hidden=false;}
}
$('#ganttGroup').insertAdjacentHTML('beforeend',groups.map((g,i)=>`<option value="${i}">${g.name}</option>`).join(''));$('#ganttPerson').insertAdjacentHTML('beforeend',people.map(p=>`<option>${p}</option>`).join(''));
['#ganttRange','#ganttGroup','#ganttPerson','#ganttStatus','#ganttCompare','#ganttFlow'].forEach(s=>$(s).addEventListener('change',renderGantt));
$('#ganttRange').addEventListener('change',()=>{$('#ganttScroll').scrollLeft=0;$('#ganttScroll').scrollTop=0;});
$('#ganttZoom').addEventListener('change',()=>{ganttCenterPending=true;renderGantt();});
$('#ganttTarget').onchange=()=>selectGantt($('#ganttTarget').value,true);$('#ganttCenter').onclick=centerGanttSelection;
$('#ganttIsolate').onclick=()=>{if(ganttChainOnly){ganttChainOnly=false;renderGantt();}else revealGanttChain();};$('#ganttReveal').onclick=revealGanttChain;
$('#ganttSummary').onclick=()=>{ganttMode='summary';ganttChainOnly=false;renderGantt();};$('#ganttDetails').onclick=()=>{ganttMode='details';renderGantt();};
$('#ganttCompleted').onclick=()=>{$('#ganttGroup').value='all';$('#ganttPerson').value='all';$('#ganttRange').value='full';$('#ganttStatus').value='completed';ganttMode='details';ganttChainOnly=false;collapsedGroups.clear();renderGantt();};
$('#ganttExpand').onclick=()=>{collapsedGroups.clear();renderGantt();};
$('#ganttWide').onclick=()=>{const wide=document.body.classList.toggle('gg-wide');$('#ganttWide').textContent=wide?'Réduire ↙':'Agrandir ↗';scheduleGanttLinks();};
window.addEventListener('resize',scheduleGanttLinks);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('gg-wide')&&!document.querySelector('dialog[open]')){document.body.classList.remove('gg-wide');$('#ganttWide').textContent='Agrandir ↗';scheduleGanttLinks();}});
document.addEventListener('click',e=>{const select=e.target.closest('[data-gantt-select]');if(select){selectGantt(select.dataset.ganttSelect);return;}const drill=e.target.closest('[data-gantt-drill]');if(drill){$('#ganttGroup').value=drill.dataset.ganttDrill;ganttMode='details';ganttChainOnly=false;collapsedGroups.clear();renderGantt();$('#gantt').scrollIntoView({block:'start',behavior:'smooth'});}const collapse=e.target.closest('[data-collapse]');if(collapse){const i=Number(collapse.dataset.collapse);collapsedGroups.has(i)?collapsedGroups.delete(i):collapsedGroups.add(i);renderGantt();}});

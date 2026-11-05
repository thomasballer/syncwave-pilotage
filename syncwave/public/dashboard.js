let dashboardModel,dashboardConfig,dashboardAnnouncements=[],objectiveWindow='all';
const ANNOUNCEMENTS_KEY='syncwave-announcements-v1';
function configureDashboard(){
 dashboardAnnouncements=dashboardConfig.announcements||[];
 try{const raw=localStorage.getItem(ANNOUNCEMENTS_KEY);if(raw){const saved=JSON.parse(raw);if(!Array.isArray(saved))throw Error('Format invalide.');dashboardAnnouncements=saved.map(d=>dashboardModel.validateAnnouncement(d));}}catch{ $('#dashboardAnnouncementNotice').textContent='Les annonces locales n’ont pas pu être relues. Une copie sera conservée avant un nouvel enregistrement.'; }
 $('#dashboardPlatform').href=dashboardConfig.platform.url;
}
function storeAnnouncements(candidate){
 try{const raw=localStorage.getItem(ANNOUNCEMENTS_KEY);if(raw&&!localStorage.getItem(ANNOUNCEMENTS_KEY+'-copie'))localStorage.setItem(ANNOUNCEMENTS_KEY+'-copie',raw);localStorage.setItem(ANNOUNCEMENTS_KEY,JSON.stringify(candidate));dashboardAnnouncements=candidate;return true;}catch{toast('Le navigateur ne peut pas enregistrer les annonces.');return false;}
}
function dashboardGoal(d){
 const overdue=!validated(d)&&d.date<today(),complete=validated(d);
 return `<button class="db-goal ${complete?'is-done':overdue?'is-overdue':''}" data-id="${d.id}"><span class="db-goal-head"><span style="color:${groups[d.g].color}">${esc(groups[d.g].name)} · ${d.id}</span><time>${complete?completionPrefix(d):''}${fmt(complete?d.completedDate:d.date)}</time></span><strong>${complete?'✓ ':''}${esc(d.title)}</strong><span class="db-goal-foot"><span>${esc(assignments(d).join(' + '))}</span><b>${complete?'Terminé':d.status}${overdue?' · échéance dépassée':''}</b></span></button>`;
}
function renderDashboard(){
 if(!dashboardModel||!dashboardConfig)return;
 const state=dashboardModel.dashboardState(data,today()),milestone=data.find(d=>d.id===dashboardConfig.priorityMilestone);
 $('#dashboardDate').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(new Date(today()+'T12:00:00Z'));
 $('#dashboardStats').innerHTML=[['Terminés',`${state.done}<small>/ ${state.total}</small>`,'Preuve et date enregistrées','done'],['En cours',state.started,'Travail engagé dans le suivi','started'],['Bloqués',state.blocked,'Statut à traiter avec l’équipe','blocked'],['À actualiser',state.overdue.length,'Échéances dépassées dans le suivi','late']].map(([label,value,note,kind])=>`<article class="db-stat ${kind}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
 if(milestone){const complete=validated(milestone),late=!complete&&milestone.date<today();$('#dashboardMilestone').innerHTML=`<div><span class="eyebrow">${complete?'JALON VALIDÉ':late?'JALON À CONFIRMER DANS LE SUIVI':'PROCHAIN POINT PRIORITAIRE'} · ${fmt(milestone.date)}</span><h2>${esc(milestone.title)}</h2><p>${esc(milestone.criterion)}</p></div><button class="button" data-id="${milestone.id}">${complete?'Consulter la preuve':'Ouvrir la validation'} ↗</button>`;$('#dashboardMilestone').classList.toggle('is-done',complete);}
 $('#dashboardOverdue').hidden=!state.overdue.length;$('#dashboardOverdue').innerHTML=`<span><strong>${state.overdue.length} échéances dépassées dans le suivi</strong> · à revoir avec les responsables pour confirmer le résultat ou ajuster la date.</span><button class="text-button" data-dashboard-overdue>Les consulter ↗</button>`;
 $('#dashboardCurrent').innerHTML=(state.current.slice(0,4).map(dashboardGoal).join('')+(state.current.length>4?'<button class="text-button db-all" data-dashboard-window="current">Voir tous les objectifs en cours et bloqués ↗</button>':''))||'<p class="db-empty">Aucun objectif en cours ou bloqué dans le suivi.</p>';
 $('#dashboardUpcoming').innerHTML=(state.upcoming.slice(0,5).map(dashboardGoal).join('')+(state.upcoming.length>5?'<button class="text-button db-all" data-dashboard-window="upcoming">Voir les '+state.upcoming.length+' échéances ↗</button>':''))||'<p class="db-empty">Aucune échéance ouverte dans les sept prochains jours.</p>';
 $('#dashboardCurrentCount').textContent=state.current.length+' dans le suivi';$('#dashboardUpcomingCount').textContent=state.upcoming.length+' d’ici le '+shortDate(state.until);
 $('#dashboardRecent').innerHTML=state.recent.map(dashboardGoal).join('')||'<p class="db-empty">Les objectifs terminés avec une preuve apparaîtront ici.</p>';
 const archived=$('#dashboardArchived').checked,announcements=dashboardAnnouncements.filter(d=>Boolean(d.archived)===archived).sort((a,b)=>b.date.localeCompare(a.date));
 $('#dashboardAnnouncements').innerHTML=announcements.map(d=>`<article class="db-announcement ${d.priority}"><div><span>${({info:'Information',important:'Important',urgent:'Urgent'})[d.priority]} · ${fmt(d.date)}</span><h3>${esc(d.title)}</h3><p>${esc(d.message)}</p></div><button class="text-button" data-archive-announcement="${esc(d.id)}">${d.archived?'Rétablir':'Archiver'}</button></article>`).join('')||`<p class="db-empty">${archived?'Aucune annonce archivée.':'Aucune annonce ajoutée pour le moment.'}</p>`;
}
$('#addAnnouncement').onclick=()=>{$('#announcementForm').reset();$('#announcementDate').value=today();$('#announcementError').hidden=true;$('#announcementDialog').showModal();};
$('#closeAnnouncement').onclick=()=>$('#announcementDialog').close();$('#dashboardArchived').onchange=renderDashboard;
$('#announcementForm').onsubmit=event=>{event.preventDefault();try{const input=dashboardModel.validateAnnouncement({id:crypto.randomUUID(),title:$('#announcementTitle').value,message:$('#announcementMessage').value,date:$('#announcementDate').value,priority:$('#announcementPriority').value});if(storeAnnouncements([...dashboardAnnouncements,input])){$('#announcementDialog').close();renderDashboard();toast('Annonce enregistrée dans ce navigateur.');}}catch(error){$('#announcementError').hidden=false;$('#announcementError').textContent=error.message;}};
$('#clearObjectiveWindow').onclick=()=>{objectiveWindow='all';renderList();};
document.addEventListener('click',event=>{
 const archive=event.target.closest('[data-archive-announcement]');if(archive){const candidate=dashboardAnnouncements.map(d=>d.id===archive.dataset.archiveAnnouncement?{...d,archived:!d.archived}:d);if(storeAnnouncements(candidate))renderDashboard();}
 const windowButton=event.target.closest('[data-dashboard-window]');if(windowButton){view('objectives');$('#search').value='';$('#groupFilter').value='all';$('#personFilter').value='all';$('#statusFilter').value='all';objectiveWindow=windowButton.dataset.dashboardWindow;renderList();}
 if(event.target.closest('[data-dashboard-overdue]')){view('objectives');$('#search').value='';$('#groupFilter').value='all';$('#personFilter').value='all';$('#statusFilter').value='all';objectiveWindow='overdue';renderList();}
});

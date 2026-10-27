export const PEOPLE=['Thomas','Maia','Nazim','Basile','Tiéoulé','Gabriel'];
export const BASELINE_VERSION='20261027.3';
export const EDITABLE_FIELDS=['start','date','status','assignees','proof','completedDate'];
export const STATUSES=['À confirmer','À faire','En cours','Bloqué','Terminé'];
export const isDone=d=>d.status==='Terminé'&&Boolean(d.proof?.trim())&&Boolean(d.completedDate);
export const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function validateObjectives(items){
 const errors=[];if(!Array.isArray(items)||!items.length)return ['Le planning est vide.'];const map=new Map();
 for(const d of items){if(!d.id||map.has(d.id))errors.push('Repère absent ou dupliqué : '+d.id);map.set(d.id,d);}
 for(const d of items){const p=d.id+' : ';if(!Number.isInteger(d.g)||d.g<0||d.g>4)errors.push(p+'livrable invalide.');if(!d.title?.trim())errors.push(p+'titre absent.');if(!isDate(d.date))errors.push(p+'échéance invalide.');if(d.start&&(!isDate(d.start)||d.start>d.date))errors.push(p+'le début dépasse l’échéance.');if(!STATUSES.includes(d.status))errors.push(p+'statut invalide.');if(!Array.isArray(d.assignees)||d.assignees.some(x=>!PEOPLE.includes(x))||new Set(d.assignees).size!==d.assignees.length)errors.push(p+'affectation invalide.');
  if(d.completionDateKind&&!['realisation','confirmation'].includes(d.completionDateKind))errors.push(p+'type de date de clôture invalide.');if(d.actualStart&&!isDate(d.actualStart))errors.push(p+'début réel invalide.');const deps=(d.deps||'—').split(',').filter(x=>x!=='—');if(new Set(deps).size!==deps.length)errors.push(p+'prérequis dupliqués.');for(const id of deps){const dep=map.get(id);if(!dep){errors.push(p+'prérequis inconnu '+id);continue;}if(id===d.id)errors.push(p+'dépendance sur lui-même.');if((dep.completedDate||dep.date)>(d.completedDate||d.date))errors.push(p+'la validation précède celle du prérequis '+id+'.');if(d.status==='Terminé'&&!isDone(dep))errors.push(p+'le prérequis '+id+' n’est pas terminé.');}
  if(d.status==='Terminé'){if(!d.proof?.trim())errors.push(p+'preuve requise.');if(!isDate(d.completedDate))errors.push(p+'date de réalisation requise.');if(d.actualStart&&d.completedDate<d.actualStart)errors.push(p+'fin réelle antérieure au début connu.');}else if(d.completedDate)errors.push(p+'date de réalisation incompatible avec le statut.');
 }
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id)){errors.push('Cycle de dépendances : '+id);return;}if(done.has(id))return;visiting.add(id);for(const dep of (map.get(id)?.deps||'—').split(',').filter(x=>x!=='—'&&map.has(x)))visit(dep);visiting.delete(id);done.add(id);}for(const id of map.keys())visit(id);return [...new Set(errors)];
}

// Only real local edits override a revised baseline; unchanged old dates and
// statuses must not silently undo the new hardware sequence.
export function restoreObjectives(baseline,saved,previousBaseline){
 if(!Array.isArray(saved?.objectives))throw Error('Sauvegarde du planning invalide.');
 const entries=new Map(saved.objectives.map(d=>[d.id,d]));
 if(entries.size!==saved.objectives.length)throw Error('Repères dupliqués dans la sauvegarde.');
 const current=saved.baselineVersion===BASELINE_VERSION;
 if(!current&&saved.baselineVersion)throw Error('Version de sauvegarde non reconnue.');
 const previous=new Map((previousBaseline||[]).map(d=>[d.id,d]));
 const expected=current?new Set(baseline.map(d=>d.id)):new Set(previous.keys());
 if(expected.size!==entries.size||[...entries.keys()].some(id=>!expected.has(id)))throw Error('Objectifs de sauvegarde non reconnus.');
 const result=baseline.map(d=>{
  const item={...d},local=entries.get(d.id),old=previous.get(d.id);
  if(local)for(const key of EDITABLE_FIELDS){
   if(current||JSON.stringify(local[key])!==JSON.stringify(old?.[key])){
    if(local[key]===undefined)delete item[key];else item[key]=structuredClone(local[key]);
   }
  }
  item.owner=Array.isArray(item.assignees)?item.assignees.join(' avec ')||'Non assigné':item.owner;
  return item;
 });
 const errors=validateObjectives(result);if(errors.length)throw Error(errors.join('\n'));
 return result;
}

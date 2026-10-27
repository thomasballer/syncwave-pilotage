import {isDone} from './model.js?v=20261027.5';

export const SPRINTS=[
 {id:'S1',name:'Sprint 1',start:'2026-09-14',end:'2026-09-27',goal:'Cadrage et première plateforme sur données simulées.'},
 {id:'S2',name:'Sprint 2',start:'2026-09-28',end:'2026-10-11',goal:'Application, API et inventaire des composants.'},
 {id:'S3',name:'Sprint 3',start:'2026-10-12',end:'2026-10-25',goal:'Préparation du prototype, sécurité et données.'},
 {id:'S4',name:'Sprint 4',start:'2026-10-26',end:'2026-11-08',goal:'Valider le NFC passif dans l’application et le fonctionnement du même prototype sur batterie.'},
 {id:'S5',name:'Sprint 5',start:'2026-11-09',end:'2026-11-22',goal:'Valider SOS, GNSS, réseau, boîtier d’essai et autonomie, puis stabiliser le prototype.'},
 {id:'S6',name:'Sprint 6',start:'2026-11-23',end:'2026-12-06',goal:'Assembler et valider le lot uniquement si le premier prototype est stabilisé.'},
 {id:'S7',name:'Clôture',start:'2026-12-07',end:'2026-12-11',goal:'Recette, Go, sessions pilote, analyse et transfert final.'}
];
export const depsOf=d=>[...new Set((d.deps||'—').split(',').map(x=>x.trim()).filter(x=>x&&x!=='—'))];
export function sprintForDate(date){return SPRINTS.find(s=>date>=s.start&&date<=s.end)||null;}
export function inSprint(d,sprint){const date=isDone(d)?d.completedDate:d.date;return date>=sprint.start&&date<=sprint.end;}
export function directPrerequisites(items,id){const map=new Map(items.map(d=>[d.id,d])),target=map.get(id);if(!target)throw Error('Résultat inconnu : '+id);return depsOf(target).map(dep=>{if(!map.has(dep))throw Error('Prérequis inconnu : '+dep);return map.get(dep);});}
export function upstream(items,id){const map=new Map(items.map(d=>[d.id,d])),result=new Set(),visiting=new Set();if(!map.has(id))throw Error('Résultat inconnu : '+id);function visit(key){if(visiting.has(key))throw Error('Cycle dans les dépendances.');visiting.add(key);for(const dep of depsOf(map.get(key))){if(!map.has(dep))throw Error('Prérequis inconnu : '+dep);if(!result.has(dep)){visit(dep);result.add(dep);}}visiting.delete(key);}visit(id);return [...result].map(key=>map.get(key));}
export function directSuccessors(items,id){return items.filter(d=>depsOf(d).includes(id));}
export function prerequisiteState(items,id){const deps=directPrerequisites(items,id),done=deps.filter(isDone);return {total:deps.length,done:done.length,remaining:deps.length-done.length,ready:done.length===deps.length};}
export function dependencyLayers(items,id){const map=new Map(items.map(d=>[d.id,d])),nodes=[...upstream(items,id),map.get(id)],remaining=new Set(nodes.map(d=>d.id)),complete=new Set(),layers=[];while(remaining.size){const level=nodes.filter(d=>remaining.has(d.id)&&depsOf(d).every(dep=>complete.has(dep))).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));if(!level.length)throw Error('Cycle ou prérequis manquant dans la chaîne.');layers.push(level);for(const d of level){remaining.delete(d.id);complete.add(d.id);}}return layers;}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {dashboardState,validateAnnouncement} from '../public/dashboard-model.js';
import {BASELINE_VERSION,restoreObjectives} from '../public/model.js';
const items=JSON.parse(await fs.readFile(new URL('../public/objectifs.json',import.meta.url),'utf8'));

test('Le tableau de bord distingue les validations, le travail en cours et les échéances à actualiser',()=>{
 const state=dashboardState(items,'2026-11-05');
 assert.equal(state.total,57);assert.equal(state.done,5);assert.equal(state.started,4);assert.equal(state.blocked,0);
 assert.equal(state.overdue.length,12);assert.equal(state.upcoming.length,9);
 assert.ok(state.overdue.every(d=>d.status!=='Terminé'&&d.date<'2026-11-05'));
 assert.ok(state.upcoming.every(d=>d.date>='2026-11-05'&&d.date<='2026-11-12'));
 assert.equal(state.recent[0].id,'P11');assert.equal(state.recent[0].completionDateKind,'confirmation');
 assert.throws(()=>dashboardState(items,'2026-02-30'));
});
test('Un objectif bloqué est prioritaire et une échéance passée ne le termine pas automatiquement',()=>{
 const data=[{id:'a',date:'2026-11-05',status:'En cours'},{id:'b',date:'2026-11-06',status:'Bloqué'},{id:'c',date:'2026-11-04',status:'À faire'}];
 const state=dashboardState(data,'2026-11-05');assert.equal(state.done,0);assert.equal(state.blocked,1);assert.deepEqual(state.current.map(d=>d.id),['b','a']);assert.deepEqual(state.overdue.map(d=>d.id),['c']);
 assert.deepEqual(dashboardState([],'2026-11-05').recent,[]);
});
test('Les annonces conservent leur priorité et leur archive, avec des champs bornés et une date valide',()=>{
 const input={id:'n1',title:'  Point équipe ',message:'  Valider les résultats. ',date:'2026-11-05',priority:'urgent',archived:true};
 assert.deepEqual(validateAnnouncement(input),{...input,title:'Point équipe',message:'Valider les résultats.'});
 for(const patch of [{title:''},{title:'a'.repeat(101)},{message:''},{message:'a'.repeat(1001)},{date:'2026-02-30'},{priority:'inconnue'}])assert.throws(()=>validateAnnouncement({...input,...patch}));
});
test('La rédaction suit un verbe à l’infinitif et chaque objectif fournit sa validation et sa preuve attendue',()=>{
 const verbs=new Set(['Recenser','Allumer','Valider','Qualifier','Faire','Mesurer','Réaliser','Vérifier','Lire','Stabiliser','Assembler','Adapter','Documenter','Livrer','Définir','Afficher','Récupérer','Consolider','Intégrer','Contrôler','Préparer','Exécuter','Transférer','Nettoyer','Obtenir','Produire','Évaluer','Désactiver','Analyser','Installer','Établir','Recevoir','Rétablir','Disposer','Sécuriser','Déployer','Superviser','Restaurer','Exploiter']);
 for(const d of items){assert.ok(verbs.has(d.title.split(' ')[0]),d.id);assert.ok(d.checks.length>0,d.id);assert.ok(d.checks.every(c=>c.trim().length>15),d.id);assert.ok(d.expectedProof?.trim(),d.id);}
 const charge=items.find(d=>d.id==='P5');assert.match(charge.checks.join(' '),/charge.*tension et courant.*limites/);
 assert.match(items.find(d=>d.id==='P6').checks.join(' '),/sans ouvrir le boîtier ni forcer/);
});
test('Une sauvegarde courante conserve les saisies et adopte les nouveaux textes et critères',()=>{
 const saved=structuredClone(items),d=saved.find(d=>d.id==='P1');d.title='Ancien intitulé';d.criterion='Ancien critère';delete d.checks;delete d.expectedProof;d.proof='Relevé local conservé';d.assignees=['Maia','Basile'];
 const restored=restoreObjectives(items,{baselineVersion:BASELINE_VERSION,objectives:saved});const current=restored.find(d=>d.id==='P1'),baseline=items.find(d=>d.id==='P1');
 assert.equal(current.title,baseline.title);assert.equal(current.criterion,baseline.criterion);assert.deepEqual(current.checks,baseline.checks);assert.equal(current.expectedProof,baseline.expectedProof);
 assert.equal(current.proof,'Relevé local conservé');assert.deepEqual(current.assignees,['Maia','Basile']);
});

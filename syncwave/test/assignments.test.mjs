import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {BASELINE_VERSION,restoreObjectives,validateObjectives} from '../public/model.js';
const read=name=>fs.readFile(new URL('../public/'+name,import.meta.url),'utf8').then(JSON.parse);
const [seed,previous,legacy,recent,thomas]=await Promise.all([read('objectifs.json'),read('baseline-20261027.json'),read('baseline-20261026.json'),read('baseline-20261027-assignments.json'),read('baseline-20261027-thomas.json')]);
const goal=(items,id)=>items.find(d=>d.id===id);
const open=(items,name,priority=false)=>items.filter(d=>d.status!=='Terminé'&&d.assignees.includes(name)&&(!priority||d.focus));

test('Deux essais matériels sont transférés à Basile en conservant Maia et le périmètre des objectifs',()=>{
 for(const id of ['P12','P2']){
  assert.deepEqual(goal(seed,id).assignees,['Maia','Basile']);
  for(const key of ['date','start','status','deps','criterion'])assert.deepEqual(goal(seed,id)[key],goal(previous,id)[key]);
 }
 assert.equal(open(seed,'Nazim').length,15);assert.equal(open(seed,'Basile').length,14);
 assert.equal(open(seed,'Nazim',true).length,3);assert.equal(open(seed,'Basile',true).length,4);
 for(const id of ['E1','E4','E5','E6','E8'])assert.deepEqual(goal(seed,id).assignees,goal(previous,id).assignees);
 for(const d of seed.filter(d=>d.status==='Terminé'))assert.deepEqual(d,goal(previous,d.id));
});
test('Une ancienne sauvegarde matérielle adopte les transferts et conserve les autres saisies',()=>{
 const saved=structuredClone(previous);goal(saved,'P12').assignees=['Nazim'];goal(saved,'L12').proof='Compte rendu local complété.';
 const restored=restoreObjectives(seed,{baselineVersion:'20261027.3',objectives:saved},legacy,previous);
 for(const id of ['P12','P2'])assert.deepEqual(goal(restored,id).assignees,['Maia','Basile']);
 assert.equal(goal(restored,'L12').proof,'Compte rendu local complété.');
 assert.deepEqual(validateObjectives(restored),[]);
});

test('Thomas rejoint trois validations sans changer leurs critères ni les engagements des autres',()=>{
 const targets=['L4','L3','L6'];
 for(const d of thomas){
  const old=goal(recent,d.id);
  if(targets.includes(d.id)){assert.deepEqual(d.assignees,[...old.assignees,'Thomas']);for(const field of ['date','start','status','criterion','deps','proof'])assert.deepEqual(d[field],old[field]);}
  else assert.deepEqual(d,old);
 }
 assert.equal(open(thomas,'Thomas').length,15);assert.equal(open(thomas,'Thomas',true).length,5);
 for(const id of targets)assert.deepEqual(goal(seed,id),goal(thomas,id));
});
test('La sauvegarde précédente reçoit les ajouts de Thomas et conserve ses autres modifications',()=>{
 const saved=structuredClone(recent);goal(saved,'L12').proof='Compte rendu local conservé.';
 const restored=restoreObjectives(seed,{baselineVersion:'20261027.6',objectives:saved},legacy,previous,recent);
 for(const id of ['L4','L3','L6'])assert.ok(goal(restored,id).assignees.includes('Thomas'));
 assert.equal(goal(restored,'L12').proof,'Compte rendu local conservé.');
 for(const id of ['P2','P12'])assert.deepEqual(goal(restored,id).assignees,['Maia','Basile']);
 assert.deepEqual(validateObjectives(restored),[]);
});
test('Les nouvelles affectations restent modifiables après la migration',()=>{
 const edited=structuredClone(seed);goal(edited,'L4').assignees=['Tiéoulé'];
 const restored=restoreObjectives(seed,{baselineVersion:BASELINE_VERSION,objectives:edited},legacy,previous,recent);
 assert.deepEqual(goal(restored,'L4').assignees,['Tiéoulé']);
});

test('Maia pilote les neuf objectifs IA avec des aides ciblées, sans modifier les autres objectifs',()=>{
 const ai=seed.filter(d=>d.g===2);
 assert.equal(ai.length,9);
 for(const d of seed){
  const before=goal(thomas,d.id);
  if(d.g!==2){assert.deepEqual(d,before);continue;}
  assert.equal(d.assignees[0],'Maia');
  assert.equal(d.assignees.length,2);
  assert.ok(['Thomas','Gabriel'].includes(d.assignees[1]));
  assert.equal(d.owner,d.assignees.join(' avec '));
  assert.match(d.note,/Maia (pilote|réalise)/);
  for(const field of Object.keys(before).filter(key=>!['assignees','owner','note'].includes(key)))assert.deepEqual(d[field],before[field]);
 }
 assert.deepEqual(ai.filter(d=>d.assignees.includes('Thomas')).map(d=>d.id),['I1','I2','I3','I5','I7']);
 assert.deepEqual(ai.filter(d=>d.assignees.includes('Gabriel')).map(d=>d.id),['I4','I9','I6','I8']);
 assert.ok(ai.every(d=>!d.assignees.includes('Tiéoulé')));
 for(const [name,count] of [['Maia',24],['Thomas',16],['Gabriel',18],['Tiéoulé',12]])assert.equal(open(seed,name).length,count);
});

test('Toutes les références anciennes adoptent l’équipe IA en conservant les saisies compatibles',()=>{
 for(const [version,reference] of [[undefined,legacy],['20261027.3',previous],['20261027.6',recent],['20261027.7',thomas]]){
  const edited=structuredClone(reference);
  goal(edited,'I1').proof='Schéma local et exemples conservés.';
  goal(edited,'I1').assignees=['Tiéoulé'];
  goal(edited,'P3').assignees=['Basile'];
  const restored=restoreObjectives(seed,{baselineVersion:version,objectives:edited},legacy,previous,recent,thomas);
  for(const d of restored.filter(d=>d.g===2))assert.deepEqual(d.assignees,goal(seed,d.id).assignees);
  assert.equal(goal(restored,'I1').proof,'Schéma local et exemples conservés.');
  assert.deepEqual(goal(restored,'P3').assignees,['Basile']);
  assert.deepEqual(validateObjectives(restored),[]);
 }
});

test('Une affectation IA reste éditable après le passage à la nouvelle référence',()=>{
 const edited=structuredClone(seed);goal(edited,'I1').assignees=['Maia','Thomas','Gabriel'];
 const restored=restoreObjectives(seed,{baselineVersion:BASELINE_VERSION,objectives:edited},legacy,previous,recent,thomas);
 assert.deepEqual(goal(restored,'I1').assignees,['Maia','Thomas','Gabriel']);
});

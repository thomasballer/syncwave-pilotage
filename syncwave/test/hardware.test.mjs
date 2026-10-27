import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {BASELINE_VERSION,restoreObjectives,validateObjectives,isDone} from '../public/model.js';
import {upstream} from '../public/workflow-model.js';
const read=name=>fs.readFile(new URL('../public/'+name,import.meta.url),'utf8').then(JSON.parse);
const [seed,previous,roadmap]=await Promise.all([read('objectifs.json'),read('baseline-20261026.json'),read('hardware-plan.json')]);
const goal=id=>seed.find(d=>d.id===id),ancestors=id=>new Set(upstream(seed,id).map(d=>d.id));

test('La LED est un acquis confirmé, sans prétendre que la batterie ou le SOS sont validés',()=>{
 const led=goal('P11');assert.equal(isDone(led),true);assert.equal(led.completionDateKind,'confirmation');
 assert.equal(led.completedDate,'2026-10-27');assert.match(led.proof,/date exacte.*pas été renseignée/);
 for(const id of ['P1','P2','P14','E9'])assert.equal(isDone(goal(id)),false);
});
test('La lecture du tag passif est indépendante de l’alimentation et du programme du Pico',()=>{
 assert.match(goal('E2').criterion,/pas câblé au Pico/);
 for(const id of ['E2','L9','L11'])for(const blocked of ['P1','P2','E1','E3','E10'])assert.equal(ancestors(id).has(blocked),false,id+' ne dépend pas de '+blocked);
});
test('NFC et batterie restent dans la quinzaine et les essais radio sont planifiés ensuite',()=>{
 for(const id of ['P1','P2','E2','L9','L11','P9'])assert.ok(goal(id).date<='2026-11-06',id);
 for(const id of ['E3','E9','E10','P13']){assert.ok(goal(id).start>'2026-11-06',id);assert.equal(Boolean(goal(id).focus),false);}
 assert.equal(goal('P9').date,'2026-11-06');assert.equal(ancestors('P9').has('E3'),false);
});
test('Les contrôles USB et la qualification précèdent la batterie, l’autonomie complète précède la duplication',()=>{
 for(const id of ['P11','P12','P1'])assert.ok(ancestors('P2').has(id));
 for(const id of ['P2','P13','E3','E9','E10','P15','E4'])assert.ok(ancestors('P14').has(id),id);
 for(const id of ['P14','P16','P4'])assert.ok(ancestors('P5').has(id),id);
 assert.ok(goal('P2').date<goal('P14').date);assert.ok(goal('P4').date<goal('P5').date);
});
test('Le parcours matériel réutilise les objectifs sans doublons ni références manquantes',()=>{
 const ids=roadmap.stages.flatMap(s=>s.objectives);assert.equal(new Set(ids).size,ids.length);
 for(const id of ids)assert.ok(goal(id),id);
 for(const d of seed.filter(d=>[0,3].includes(d.g)&&d.id!=='P10'))assert.ok(ids.includes(d.id),d.id);
});
test('Une ancienne sauvegarde inchangée adopte toutes les nouvelles dates et tous les nouveaux objectifs',()=>{
 const restored=restoreObjectives(seed,{objectives:previous,revision:4},previous);
 assert.equal(restored.length,57);assert.equal(restored.find(d=>d.id==='P2').date,'2026-11-06');
 assert.equal(restored.find(d=>d.id==='E3').date,'2026-11-13');assert.equal(isDone(restored.find(d=>d.id==='P11')),true);
 assert.deepEqual(validateObjectives(restored),[]);
});
test('La reprise préserve les vraies modifications locales, sans rétablir les anciennes dépendances',()=>{
 const edited=structuredClone(previous);edited.find(d=>d.id==='L12').proof='Compte rendu complété localement.';
 edited.find(d=>d.id==='P3').assignees=['Basile'];
 const restored=restoreObjectives(seed,{objectives:edited},previous);
 assert.equal(restored.find(d=>d.id==='L12').proof,'Compte rendu complété localement.');
 assert.deepEqual(restored.find(d=>d.id==='P3').assignees,['Basile']);
 assert.equal(restored.find(d=>d.id==='P3').date,'2026-11-16');
 assert.equal(restored.find(d=>d.id==='E2').deps,'—');
 const current=restoreObjectives(seed,{baselineVersion:BASELINE_VERSION,objectives:restored},previous);
 assert.deepEqual(current,restored);
});
test('Une ancienne date incompatible est signalée pour conserver la saisie séparément',()=>{
 const edited=structuredClone(previous);edited.find(d=>d.id==='P2').date='2026-10-28';
 assert.throws(()=>restoreObjectives(seed,{objectives:edited},previous),/précède|début/);
});

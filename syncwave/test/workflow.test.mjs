import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {SPRINTS,capacityBudget,sprintForDate,inSprint,depsOf,upstream,dependencyLayers,prerequisiteState,directPrerequisites,directSuccessors} from '../public/workflow-model.js';
const seed=JSON.parse(await fs.readFile(new URL('../public/objectifs.json',import.meta.url),'utf8'));

test('Les disponibilités différentes gardent chacune une marge de 20 %',()=>{
 assert.deepEqual(capacityBudget(10),{hours:10,planned:8,margin:2});
 assert.deepEqual(capacityBudget(25),{hours:25,planned:20,margin:5});
 assert.deepEqual(capacityBudget(0),{hours:0,planned:0,margin:0});
 for(const value of [null,undefined,'',' '])assert.equal(capacityBudget(value),null);
 for(const value of [-1,'inconnu',Infinity,NaN])assert.throws(()=>capacityBudget(value));
 assert.equal(capacityBudget(7.25).planned,5.8);
});
test('Les périodes couvrent le projet sans trou ni chevauchement, week-ends compris',()=>{
 assert.equal(SPRINTS[0].start,'2026-09-14');assert.equal(SPRINTS.at(-1).end,'2026-12-11');
 for(let i=0;i<SPRINTS.length;i++){
  const s=SPRINTS[i],days=(Date.parse(s.end)-Date.parse(s.start))/86400000+1;
  assert.equal(days,i===SPRINTS.length-1?5:14);
  if(i)assert.equal((Date.parse(s.start)-Date.parse(SPRINTS[i-1].end))/86400000,1);
 }
 for(const d of seed)assert.ok(sprintForDate(d.completedDate||d.date),d.id);
 assert.equal(sprintForDate('2026-11-08').id,'S4');
 assert.equal(sprintForDate('2026-11-22').id,'S5');
 assert.equal(sprintForDate('2026-12-06').id,'S6');
 assert.equal(sprintForDate('2026-12-12'),null);
});
test('Les réalisations sont regroupées par date réelle et les objectifs ouverts par échéance',()=>{
 const goal={date:'2026-11-08',status:'Terminé',proof:'Test réussi',completedDate:'2026-10-10'};
 assert.equal(inSprint(goal,SPRINTS[1]),true);assert.equal(inSprint(goal,SPRINTS[3]),false);
 assert.equal(inSprint({...goal,status:'En cours'},SPRINTS[3]),true);
});
test('Les liens directs et les prérequis terminés correspondent au planning',()=>{
 assert.deepEqual(directPrerequisites(seed,'P9').map(d=>d.id),['P2','E2','L11']);
 assert.ok(directSuccessors(seed,'E2').some(d=>d.id==='L9'));
 assert.deepEqual(prerequisiteState(seed,'L2'),{total:1,done:1,remaining:0,ready:true});
 assert.equal(prerequisiteState(seed,'P9').ready,false);
 assert.equal(prerequisiteState(seed,'P11').ready,true);
 assert.throws(()=>directPrerequisites(seed,'inconnu'));
});
test('Toutes les chaînes utilisent les vrais liens, sans doublon et dans un ordre valide',()=>{
 for(const goal of seed){
  const ancestors=upstream(seed,goal.id),layers=dependencyLayers(seed,goal.id),flat=layers.flat(),level=new Map();
  assert.equal(new Set(ancestors.map(d=>d.id)).size,ancestors.length);
  assert.equal(flat.length,ancestors.length+1);assert.equal(new Set(flat.map(d=>d.id)).size,flat.length);
  assert.deepEqual(layers.at(-1).map(d=>d.id),[goal.id]);
  layers.forEach((layer,i)=>layer.forEach(d=>level.set(d.id,i)));
  for(const d of flat)for(const dep of depsOf(d))assert.ok(level.get(dep)<level.get(d.id),d.id+' dépend de '+dep);
 }
});
test('Une chaîne invalide est refusée plutôt que dessinée comme si elle était cohérente',()=>{
 assert.throws(()=>upstream([{id:'A',deps:'B'},{id:'B',deps:'A'}],'A'),/Cycle/);
 assert.throws(()=>dependencyLayers([{id:'A',deps:'manquant'}],'A'),/inconnu/);
 assert.throws(()=>upstream(seed,'inconnu'),/inconnu/);
});

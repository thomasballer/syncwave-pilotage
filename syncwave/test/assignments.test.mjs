import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {restoreObjectives,validateObjectives} from '../public/model.js';
const read=name=>fs.readFile(new URL('../public/'+name,import.meta.url),'utf8').then(JSON.parse);
const [seed,previous,legacy]=await Promise.all([read('objectifs.json'),read('baseline-20261027.json'),read('baseline-20261026.json')]);
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

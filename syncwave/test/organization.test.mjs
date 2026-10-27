import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildOrganizationPlan,projectWeeks,weekForDate,weekTotals,formatMinutes} from '../public/organization-model.js';
const config=JSON.parse(await fs.readFile(new URL('../public/organization-plan.json',import.meta.url),'utf8'));
const plan=buildOrganizationPlan(config);

test('Le calendrier couvre les treize semaines du projet, sans semaine manquante',()=>{
 assert.equal(plan.weeks.length,13);assert.equal(plan.weeks[0].start,'2026-09-14');assert.equal(plan.weeks.at(-1).end,'2026-12-11');
 for(let i=1;i<plan.weeks.length;i++)assert.equal((Date.parse(plan.weeks[i].start)-Date.parse(plan.weeks[i-1].start))/86400000,7);
 assert.equal(weekForDate(plan.weeks,'2026-10-27').id,'W7');assert.equal(weekForDate(plan.weeks,'2026-11-08').id,'W8');
 assert.equal(weekForDate(plan.weeks,'2026-12-12'),null);assert.equal(weekForDate(plan.weeks,'2026-12-14'),null);
 assert.throws(()=>projectWeeks('2026-09-15','2026-12-11'));
});
test('Aucune personne ni aucune semaine ne dépasse quatre heures, marge comprise',()=>{
 for(const member of plan.members)for(const week of member.weeks){
  assert.equal(week.capacity,240);assert.equal(week.planned+week.margin,240);
  assert.ok(week.planned>=0&&week.planned<=210);assert.ok(week.margin>=30);
  assert.equal(week.planned%15,0);
 }
});
test('Le 80/20 est obtenu approximativement sur le projet pour chacun, avec des semaines variables',()=>{
 for(const member of plan.members){
  assert.equal(member.capacity,3120);assert.equal(member.planned,2490);assert.equal(member.margin,630);
  assert.ok(Math.abs(member.plannedRatio-0.8)<0.005);
  assert.ok(new Set(member.weeks.map(w=>w.planned)).size>=3);
  assert.ok(member.weeks.some(w=>w.planned/w.capacity>0.8));assert.ok(member.weeks.some(w=>w.planned/w.capacity<0.8));
 }
 assert.notDeepEqual(plan.members[0].weeks.map(w=>w.planned),plan.members[4].weeks.map(w=>w.planned));
});
test('Les totaux hebdomadaires et le bilan global réconcilient travail prévu et marge',()=>{
 let planned=0,margin=0;
 plan.weeks.forEach((_,index)=>{const total=weekTotals(plan,index);assert.equal(total.capacity,1440);assert.equal(total.planned+total.margin,total.capacity);planned+=total.planned;margin+=total.margin;});
 assert.equal(planned,plan.planned);assert.equal(margin,plan.margin);assert.equal(plan.capacity,18720);
 assert.throws(()=>weekTotals(plan,13));
});
test('Les estimations incomplètes ou les plafonds incohérents sont refusés',()=>{
 for(const patch of [{weeklyLimitMinutes:0},{roundingMinutes:0},{maxWeeklyPlannedRatio:0.5}])assert.throws(()=>buildOrganizationPlan({...config,...patch}));
 const broken=structuredClone(config);broken.profiles.Thomas.weights=[];assert.throws(()=>buildOrganizationPlan(broken));
});
test('Les heures sont lisibles et l’organisation ne demande plus de disponibilités',async()=>{
 assert.equal(formatMinutes(195),'3 h 15');assert.equal(formatMinutes(30),'30 min');assert.equal(formatMinutes(2490),'41 h 30');
 const html=await fs.readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const section=html.slice(html.indexOf('<section id="organization"'),html.indexOf('<section id="dependencies"'));
 assert.doesNotMatch(section,/<input|<form|orgCapacityForm|Enregistrer les disponibilités/);
 assert.match(section,/4 h maximum par semaine/);assert.match(section,/reconstituée/);
});

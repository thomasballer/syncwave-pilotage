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
  assert.equal(week.capacity,member.name==='Nazim'?180:member.name==='Gabriel'?210:240);assert.equal(week.planned+week.margin,week.capacity);
  assert.ok(week.planned>=0&&week.planned<=210);assert.ok(week.margin>=30);
  assert.equal(week.planned%15,0);
 }
});
test('Le 80/20 est obtenu approximativement sur le projet pour chacun, avec des semaines variables',()=>{
 for(const member of plan.members){
  assert.equal(member.capacity,member.name==='Nazim'?2340:member.name==='Gabriel'?2730:3120);assert.equal(member.planned,member.name==='Nazim'?1875:member.name==='Gabriel'?2190:2490);assert.equal(member.margin,member.name==='Nazim'?465:member.name==='Gabriel'?540:630);
  assert.ok(Math.abs(member.plannedRatio-0.8)<0.005);
  assert.ok(new Set(member.weeks.map(w=>w.planned)).size>=3);
  assert.ok(member.weeks.some(w=>w.planned/w.capacity>0.8));assert.ok(member.weeks.some(w=>w.planned/w.capacity<0.8));
 }
 assert.notDeepEqual(plan.members[0].weeks.map(w=>w.planned),plan.members[4].weeks.map(w=>w.planned));
});
test('Les totaux hebdomadaires et le bilan global réconcilient travail prévu et marge',()=>{
 let planned=0,margin=0;
 plan.weeks.forEach((_,index)=>{const total=weekTotals(plan,index);assert.equal(total.capacity,1350);assert.equal(total.planned+total.margin,total.capacity);planned+=total.planned;margin+=total.margin;});
 assert.equal(planned,plan.planned);assert.equal(margin,plan.margin);assert.equal(plan.capacity,17550);
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
 assert.match(section,/3 h pour Nazim, 3 h 30 pour Gabriel/);assert.match(section,/reconstituée/);
});

test('La réduction de Nazim diminue chaque semaine sans reporter les heures sur les autres',()=>{
 const original=structuredClone(config);delete original.profiles.Nazim.weeklyLimitMinutes;
 const before=buildOrganizationPlan(original);
 for(const member of plan.members){
  const old=before.members.find(person=>person.name===member.name);
  if(member.name==='Nazim'){assert.equal(member.weeklyLimitMinutes,180);assert.equal(old.planned-member.planned,615);member.weeks.forEach((week,i)=>assert.ok(week.planned<old.weeks[i].planned));}
  else assert.deepEqual(member,old);
 }
 for(const capacity of [0,245,300]){const invalid=structuredClone(config);invalid.profiles.Nazim.weeklyLimitMinutes=capacity;assert.throws(()=>buildOrganizationPlan(invalid));}
});

test('Gabriel est légèrement allégé sans augmenter les autres profils',()=>{
 const original=structuredClone(config);delete original.profiles.Gabriel.weeklyLimitMinutes;
 const before=buildOrganizationPlan(original);
 for(const member of plan.members){
  const old=before.members.find(person=>person.name===member.name);
  if(member.name==='Gabriel'){assert.equal(member.weeklyLimitMinutes,210);assert.equal(member.planned,2190);assert.equal(member.margin,540);assert.equal(old.planned-member.planned,300);member.weeks.forEach((week,i)=>assert.ok(week.planned<old.weeks[i].planned));}
  else assert.deepEqual(member,old);
 }
});

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateObjectives,isDone} from './public/model.js';
import {buildOrganizationPlan} from './public/organization-model.js';
import {SPRINTS,sprintForDate,dependencyLayers,depsOf} from './public/workflow-model.js';
const root=path.dirname(fileURLToPath(import.meta.url)),publicDir=path.join(root,'public');
const data=JSON.parse(await fs.readFile(path.join(publicDir,'objectifs.json'),'utf8'));
const errors=validateObjectives(data);
for(const d of data){if(!isDone(d)&&d.date<'2026-10-26')errors.push(d.id+' : échéance ouverte antérieure au point de référence.');if(!d.assignees.length)errors.push(d.id+' : aucune personne assignée dans le planning de référence.');if(!d.criterion?.trim())errors.push(d.id+' : critère absent.');if(d.completedDate>(d.completionDateKind==='confirmation'?'2026-10-27':'2026-10-26'))errors.push(d.id+' : réalisation historique postérieure au point de référence.');}
for(const d of data){if(!sprintForDate(d.completedDate||d.date))errors.push(d.id+' : aucune période de sprint ne couvre la date.');try{dependencyLayers(data,d.id);}catch(e){errors.push(d.id+' : '+e.message);}}
if(new Set(data.map(d=>d.g)).size!==5)errors.push('Le planning doit couvrir les cinq livrables.');
const html=await fs.readFile(path.join(publicDir,'index.html'),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)errors.push('Identifiants HTML dupliqués.');
for(const file of ['server.mjs','test/server.test.mjs','public/files.js','public/files.css']){try{await fs.access(path.join(root,file));errors.push('Composant backend ou dépôt encore présent : '+file);}catch{}}
if(/id="(?:files|uploadForm|objectiveFiles)"/.test(html))errors.push('Interface de dépôt encore présente.');
const app=await fs.readFile(path.join(publicDir,'app.js'),'utf8');if(/\/api\//.test(app))errors.push('Appel API encore présent.');
for(const file of await fs.readdir(publicDir)){if(!/\.(json|html|js)$/.test(file))continue;const text=await fs.readFile(path.join(publicDir,file),'utf8');if(/https?:\/\/(?:[^/]*\.)?linear\.app/i.test(text))errors.push(file+' : lien vers l’ancien outil.');}
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const target=m[1];if(/^(https?:|\/)/.test(target))continue;try{await fs.access(path.join(publicDir,target.split('?')[0]));}catch{errors.push('Ressource manquante : '+target);}}
const hardware=JSON.parse(await fs.readFile(path.join(publicDir,'hardware-plan.json'),'utf8'));for(const stage of hardware.stages)for(const id of stage.objectives)if(!data.some(d=>d.id===id))errors.push('Étape matérielle : objectif inconnu '+id);
const organization=buildOrganizationPlan(JSON.parse(await fs.readFile(path.join(publicDir,'organization-plan.json'),'utf8')));
for(const member of organization.members){if(member.weeks.some(w=>w.capacity!==240||w.planned+w.margin!==w.capacity||w.planned>w.capacity))errors.push(member.name+' : plafond étudiant non respecté.');if(Math.abs(member.plannedRatio-0.8)>0.005)errors.push(member.name+' : bilan global éloigné du 80/20.');}
const result={referenceDate:'2026-10-26',reviewDate:'2026-10-27',baselineVersion:'20261027.3',objectives:data.length,deliverables:5,completed:data.filter(isDone).length,sprintPeriods:SPRINTS.length,dependencyLinks:data.reduce((n,d)=>n+depsOf(d).length,0),capacityRule:{targetPlanned:0.8,targetMargin:0.2,weeklyMaximumMinutes:240,roundingMinutes:15},organization:{weeks:organization.weeks.length,plannedMinutesPerPerson:organization.members[0].planned,marginMinutesPerPerson:organization.members[0].margin},checks:['Repères uniques','Critères et affectations présents','Dates valides','Prérequis connus et sans cycle','Ordre des validations et des échéances','Preuves et dates des réalisations','Aucune échéance ouverte avant le 26/10','Ressources HTML présentes','Aucun lien vers l’ancien outil','Site statique sans backend ni dépôt de fichiers','Périodes de sprint couvrant les échéances et réalisations','Chaînes de dépendances calculables pour chaque objectif','Étapes matérielles reliées au planning révisé','Plafond de quatre heures et bilan global proche de 80/20 pour chacun'],errors};
await fs.writeFile(path.join(root,'audit-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;

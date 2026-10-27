import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as workflowModel from '../public/workflow-model.js';
import * as organizationModel from '../public/organization-model.js';

const read=name=>fs.readFile(new URL('../public/'+name,import.meta.url),'utf8');
const [app,workflow,html,seed,organizationConfig]=await Promise.all([read('app.js'),read('workflow.js'),read('index.html'),read('objectifs.json'),read('organization-plan.json')]);
function page(){
 const elements=new Map(),events=new Map(),location={hash:'#overview'};
 function element(selector){if(!elements.has(selector))elements.set(selector,{hidden:false,value:'',textContent:'',innerHTML:'',style:{},classList:{toggle(){},remove(){}},addEventListener(){},setAttribute(name,value){this[name]=value;},insertAdjacentHTML(_,text){this.innerHTML+=text;}});return elements.get(selector);}
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))element('#'+id).hidden=html.includes('id="'+id+'" hidden');
 element('#depGroup').value='0';element('#depTarget').value='P9';element('#depMode').value='direct';
 const document={querySelector:element,querySelectorAll:()=>[],addEventListener(){},body:element('body'),currentScript:{src:'http://localhost/app.js?v=test'}};
 const window={history:{replaceState(_,__,hash){location.hash=hash;}},scrollTo(){},addEventListener(name,callback){events.set(name,callback);}};
 const context=vm.createContext({document,window,location,URL,setTimeout,__workflowModel:workflowModel,__organizationModel:organizationModel,__organizationConfig:JSON.parse(organizationConfig),__data:JSON.parse(seed),shortDate:d=>d});
 vm.runInContext(app,context);vm.runInContext(workflow,context);
 vm.runInContext('workflowModel=__workflowModel;organizationModel=__organizationModel;organizationConfig=__organizationConfig;organizationPlan=organizationModel.buildOrganizationPlan(organizationConfig);data=__data;',context);
 return {context,element,events,location};
}
test('Un lien direct affiche les vraies cartes Organisation et Dépendances après le chargement',()=>{
 const p=page();vm.runInContext('planReady=true;',p.context);
 assert.equal(typeof p.events.get('hashchange'),'function');
 p.location.hash='#organization';p.events.get('hashchange')();
 assert.equal(p.element('#organization').hidden,false);assert.equal(p.element('#overview').hidden,true);
 for(const name of ['Thomas','Maia','Nazim','Basile','Tiéoulé','Gabriel'])assert.ok(p.element('#orgPeople').innerHTML.includes('<h3>'+name+'</h3>'));
 p.location.hash='#dependencies';p.events.get('hashchange')();
 assert.equal(p.element('#dependencies').hidden,false);assert.equal(p.element('#organization').hidden,true);
 assert.ok(p.element('#depOverview').innerHTML.includes('Valider le premier bracelet'));
 assert.ok(p.element('#dependencyContent').innerHTML.includes('Lire un identifiant NFC'));
 p.location.hash='#organization';p.events.get('hashchange')();assert.equal(p.element('#organization').hidden,false);
});
test('Un changement d’onglet pendant le chargement ne masque pas le contenu initial',()=>{
 const p=page();vm.runInContext("view('organization')",p.context);
 assert.equal(p.element('#overview').hidden,false);assert.equal(p.element('#organization').hidden,true);
});
test('Les fichiers de présentation et les scripts portent la même version de chargement',()=>{
 const urls=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"]*)?)"/g)].map(m=>new URL(m[1],'http://localhost/'));
 assert.ok(urls.length>5);assert.ok(urls.every(url=>url.searchParams.get('v')));
 assert.equal(new Set(urls.map(url=>url.searchParams.get('v'))).size,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ganttChain,ganttConnections,validationPath} from '../public/gantt-model.js';
import {depsOf} from '../public/workflow-model.js';
const items=JSON.parse(await fs.readFile(new URL('../public/objectifs.json',import.meta.url),'utf8'));
const ids=items.map(d=>d.id);
test('Les 109 liens du Gantt proviennent exactement des prérequis des objectifs',()=>{
 const {links,hidden}=ganttConnections(items,ids,'P9','all');
 assert.equal(links.length,109);assert.deepEqual(hidden,[]);
 for(const link of links)assert.ok(depsOf(items.find(d=>d.id===link.to)).includes(link.from));
 assert.equal(new Set(links.map(d=>d.from+'>'+d.to)).size,109);
});
test('La chaîne NFC et batterie montre ses vrais ancêtres, y compris les réalisations antérieures',()=>{
 const chain=ganttChain(items,'P9');
 assert.equal(chain.size,11);for(const id of ['P11','P12','P1','P2','E2','L1','L2','L4','L9','L11','P9'])assert.ok(chain.has(id));
 assert.ok(!chain.has('E3'));assert.ok(!chain.has('E4'));
 const {links}=ganttConnections(items,ids,'P9');
 assert.ok(links.length>3);assert.ok(links.every(d=>chain.has(d.from)&&chain.has(d.to)&&d.focused));
 assert.ok(!links.some(d=>d.from==='P11'&&d.to==='P9'));
});
test('Un prérequis filtré est signalé, sans dessiner un raccourci ni un lien absent',()=>{
 const {links,hidden}=ganttConnections(items,['P9','P2'],'P9');
 assert.deepEqual(links.map(d=>[d.from,d.to]),[['P2','P9']]);
 assert.deepEqual(new Set(hidden.map(d=>d.from+'>'+d.to)),new Set(['P1>P2','P12>P2','E2>P9','L11>P9']));
 assert.deepEqual(ganttConnections(items,ids,'P9','none').links,[]);
});
test('Les flèches entrent sur la validation même lorsque la préparation démarre avant son prérequis',()=>{
 const target=items.find(d=>d.id==='P9'),source=items.find(d=>d.id==='P2');
 assert.ok(target.start<source.date);assert.equal(target.date,source.date);
 const path=validationPath({x:100,y:30},{x:240,y:200},0,400);
 assert.equal(path,'M 102 30 H 254 V 200 H 243');
 assert.equal(validationPath({x:320,y:200},{x:320,y:30},1,370),'M 322 200 H 340 V 30 H 323');
 assert.throws(()=>validationPath({x:NaN,y:1},{x:1,y:1},0,100));
});

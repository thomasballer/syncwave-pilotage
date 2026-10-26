import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateObjectives,isDate} from '../public/model.js';
const seed=JSON.parse(await fs.readFile(new URL('../public/objectifs.json',import.meta.url),'utf8'));
test('Le planning de référence est cohérent et couvre cinq livrables',()=>{assert.deepEqual(validateObjectives(seed),[]);assert.equal(new Set(seed.map(x=>x.g)).size,5);});
test('Une date invalide reste une erreur de validation',()=>{assert.equal(isDate('2026-99-32'),false);assert.equal(isDate('2026-02-30'),false);});
test('Une validation sans preuve ou avec prérequis ouverts est refusée',()=>{const x=structuredClone(seed);const d=x.find(d=>d.id==='P2');d.status='Terminé';d.completedDate='2026-10-30';d.proof='';const errors=validateObjectives(x);assert.ok(errors.some(x=>x.includes('preuve requise')));assert.ok(errors.some(x=>x.includes('P1 n’est pas terminé')));});
test('Un cycle et un parent plus tardif sont repérés',()=>{const x=structuredClone(seed);x.find(d=>d.id==='N1').deps='N3';assert.ok(validateObjectives(x).some(x=>x.includes('Cycle')));x.find(d=>d.id==='N1').deps='—';x.find(d=>d.id==='N1').date='2026-12-10';assert.ok(validateObjectives(x).some(x=>x.includes('prérequis N1')));});

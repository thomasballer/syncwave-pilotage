import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const pub=new URL('../public/',import.meta.url);
const catalog=JSON.parse(await fs.readFile(new URL('components.json',pub),'utf8'));
const objectives=JSON.parse(await fs.readFile(new URL('objectifs.json',pub),'utf8'));

test('Chaque fiche présente un visuel local, son origine et de vrais objectifs du planning',async()=>{
 assert.equal(catalog.items.length,17);assert.equal(new Set(catalog.items.map(d=>d.id)).size,17);
 for(const item of catalog.items){
  assert.ok(catalog.categories.some(c=>c.id===item.category));
  for(const field of ['name','reference','role','note'])assert.ok(item[field]?.trim());
  assert.ok(['confirmed','guide','pending'].includes(item.status));
  assert.ok(item.source.document&&item.source.section);
  assert.ok(item.image.path.startsWith('images/components/'));assert.ok(!item.image.path.includes('..'));
  assert.ok(item.image.alt.length>15&&item.image.caption&&item.image.credit);
  const asset=await fs.readFile(new URL(item.image.path,pub));assert.ok(asset.length>100);
  if(item.image.kind==='photo')assert.ok(item.image.sourceUrl.startsWith('https://'));
  else {assert.match(asset.toString(),/<svg/);assert.doesNotMatch(asset.toString(),/<script|(?:href|src)=["']https?:/i);}
  assert.ok(item.objectives.length);for(const id of item.objectives)assert.ok(objectives.some(d=>d.id===id));
 }
});
test('Les trois constats ne déclarent ni achat des autres pièces ni référence incertaine comme acquise',()=>{
 assert.deepEqual(catalog.items.filter(d=>d.status==='confirmed').map(d=>d.id),['pico','nfc','led']);
 const tag=catalog.items.find(d=>d.id==='nfc');assert.match(tag.reference,/proposé/);assert.match(tag.note,/pas une identification certaine/);
 const led=catalog.items.find(d=>d.id==='led');assert.match(led.note,/allumée.*confirmé/);assert.match(led.image.caption,/Exemple/);
 const pending=catalog.items.filter(d=>d.status==='pending');assert.deepEqual(pending.map(d=>d.id),['battery','boost']);
 assert.ok(pending.every(d=>!/\d+\s?mAh/.test(d.reference+d.note)));
 assert.match(catalog.items.find(d=>d.id==='buffer').note,/à ajouter/);
});

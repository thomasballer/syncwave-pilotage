import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('Persistance du suivi et des fichiers, conflits et erreurs',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'syncwave-test-'));process.env.SYNCWAVE_DATA_DIR=dir;
 const {createApp}=await import('../server.mjs');let server=await createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));let origin='http://127.0.0.1:'+server.address().port;
 async function request(url,opts){const r=await fetch(origin+url,opts);return {status:r.status,body:await r.json()};}
 try{
  let state=(await request('/api/state')).body;assert.equal(state.revision,0);assert.equal(state.objectives.length,50);
  const next=structuredClone(state);next.objectives.find(x=>x.id==='P1').proof='Essai en cours, relevé conservé.';
  let saved=await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});assert.equal(saved.status,200);assert.equal(saved.body.revision,1);
  assert.equal((await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)})).status,409);
  const invalid=structuredClone(saved.body);invalid.objectives.find(x=>x.id==='P2').status='Terminé';invalid.objectives.find(x=>x.id==='P2').completedDate='2026-10-26';
  assert.equal((await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(invalid)})).status,422);
  assert.equal((await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json',Origin:'https://unexpected.example'},body:JSON.stringify(saved.body)})).status,403);
  const q=new URLSearchParams({title:'Preuve test NFC',version:'v1',author:'Thomas',group:'3',objectiveId:'E2',filename:'preuve.txt'});const bytes=Buffer.from('Démonstration NFC de test.');
  const upload=await request('/api/files?'+q,{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Syncwave-Upload':'1'},body:bytes});assert.equal(upload.status,201);assert.equal(upload.body.size,bytes.length);assert.equal(upload.body.author,'Thomas');
  const download=await fetch(origin+'/api/files/'+upload.body.id+'/download');assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/attachment/);assert.deepEqual(Buffer.from(await download.arrayBuffer()),bytes);
  q.set('group','0');assert.equal((await request('/api/files?'+q,{method:'POST',headers:{'X-Syncwave-Upload':'1'},body:bytes})).status,422);
  q.delete('group');assert.equal((await request('/api/files?'+q,{method:'POST',headers:{'X-Syncwave-Upload':'1'},body:bytes})).status,422);q.set('group','3');assert.equal((await request('/api/files?'+q,{method:'POST',headers:{'X-Syncwave-Upload':'1'},body:Buffer.alloc(0)})).status,422);assert.equal((await request('/api/files')).body.length,1);
  await new Promise(r=>server.close(r));server=await createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
  assert.equal((await request('/api/state')).body.revision,1);assert.equal((await request('/api/files')).body.length,1);
  const live=(await request('/api/state')).body;const writes=await Promise.all([1,2].map(()=>request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(live)})));assert.deepEqual(writes.map(x=>x.status).sort(),[200,409]);
 }finally{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});

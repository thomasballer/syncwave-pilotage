import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {PEOPLE,validateObjectives} from './public/model.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'public');
const storage=path.resolve(process.env.SYNCWAVE_DATA_DIR||path.join(root,'storage'));
const maxBytes=50*1024*1024;
const jsonFile=(name)=>path.join(storage,name+'.json');
let lock=Promise.resolve();
function serial(fn){const next=lock.then(fn,fn);lock=next.catch(()=>{});return next;}
async function readJSON(file){return JSON.parse(await fs.readFile(file,'utf8'));}
async function atomic(file,data){const tmp=file+'.'+randomUUID()+'.part';await fs.writeFile(tmp,JSON.stringify(data,null,2));await fs.rename(tmp,file);}
async function initialize(){await fs.mkdir(path.join(storage,'files'),{recursive:true});for(const [name,value] of [['state',{revision:0,objectives:await readJSON(path.join(publicDir,'objectifs.json'))}],['files',[]]]){try{await fs.access(jsonFile(name));}catch{await atomic(jsonFile(name),value);}}}
function fail(status,message){return Object.assign(new Error(message),{status});}
function sendJSON(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function bodyJSON(req){let size=0,bufs=[];for await(const part of req){size+=part.length;if(size>2*1024*1024)throw fail(413,'Requête trop volumineuse.');bufs.push(part);}try{return JSON.parse(Buffer.concat(bufs).toString())}catch{throw fail(400,'Données JSON invalides.');}}
export async function createApp(){await initialize();return http.createServer(async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const url=new URL(req.url,'http://localhost');
 if(req.method!=='GET'&&req.method!=='HEAD'){const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)throw fail(403,'Origine refusée.');}
 if(url.pathname==='/api/state'&&req.method==='GET')return sendJSON(res,200,await readJSON(jsonFile('state')));
 if(url.pathname==='/api/state'&&req.method==='PUT'){
  if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Format JSON requis.');const input=await bodyJSON(req);
  const result=await serial(async()=>{const state=await readJSON(jsonFile('state'));if(input.revision!==state.revision)throw fail(409,'Le planning a changé dans une autre fenêtre. Rechargez la page avant de réessayer.');if(!Array.isArray(input.objectives)||input.objectives.length!==state.objectives.length)throw fail(400,'Le périmètre des objectifs doit être conservé.');const edits=new Map(input.objectives.map(x=>[x.id,x]));if(edits.size!==state.objectives.length)throw fail(400,'Repères d’objectifs dupliqués.');const list=state.objectives.map(d=>{const x=edits.get(d.id);if(!x)throw fail(400,'Objectif absent : '+d.id);const next={...d};for(const k of ['start','date','status','assignees','proof','completedDate']){if(x[k]===undefined)delete next[k];else next[k]=x[k];}next.owner=Array.isArray(next.assignees)?next.assignees.join(' avec ')||'Non assigné':'';if(typeof next.proof!=='string'||next.proof.length>10000)throw fail(400,'Preuve invalide ou trop longue.');return next;});const errors=validateObjectives(list);if(errors.length)throw fail(422,errors.join('\n'));const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris'}).format(new Date());if(list.some(d=>d.completedDate>today))throw fail(422,'Une réalisation ne peut pas être datée dans le futur.');const updated={revision:state.revision+1,updatedAt:new Date().toISOString(),objectives:list};await atomic(jsonFile('state'),updated);return updated;});return sendJSON(res,200,result);
 }
 if(url.pathname==='/api/files'&&req.method==='GET')return sendJSON(res,200,await readJSON(jsonFile('files')));
 if(url.pathname==='/api/files'&&req.method==='POST'){
  if(req.headers['x-syncwave-upload']!=='1')throw fail(400,'En-tête de dépôt requis.');if(Number(req.headers['content-length']||0)>maxBytes)throw fail(413,'Fichier trop volumineux : limite de 50 Mo.');
  const meta={title:url.searchParams.get('title')?.trim(),version:url.searchParams.get('version')?.trim(),author:url.searchParams.get('author'),group:Number(url.searchParams.get('group')),objectiveId:url.searchParams.get('objectiveId')||'',description:url.searchParams.get('description')||'',originalName:path.basename((url.searchParams.get('filename')||'').replaceAll('\\','/'))};
  if(!url.searchParams.has('group')||!meta.title||meta.title.length>160||!meta.version||meta.version.length>40||!PEOPLE.includes(meta.author)||!Number.isInteger(meta.group)||meta.group<0||meta.group>4||!meta.originalName||meta.originalName.length>240||meta.description.length>1000)throw fail(422,'Métadonnées du livrable invalides.');
  const state=await readJSON(jsonFile('state'));if(meta.objectiveId&&!state.objectives.some(d=>d.id===meta.objectiveId&&d.g===meta.group))throw fail(422,'L’objectif doit appartenir au livrable choisi.');
  const id=randomUUID(),tmp=path.join(storage,'files',id+'.part'),dest=path.join(storage,'files',id);let size=0;
  try{await pipeline(req,new Transform({transform(chunk,enc,cb){size+=chunk.length;cb(size>maxBytes?fail(413,'Limite de 50 Mo dépassée.'):null,chunk);}}),createWriteStream(tmp,{flags:'wx'}));if(!size)throw fail(422,'Le fichier est vide.');await fs.rename(tmp,dest);const record={id,...meta,size,createdAt:new Date().toISOString()};await serial(async()=>{const all=await readJSON(jsonFile('files'));all.unshift(record);await atomic(jsonFile('files'),all);});return sendJSON(res,201,record);}catch(e){await fs.rm(tmp,{force:true});await fs.rm(dest,{force:true});throw e;}
 }
 const fileMatch=url.pathname.match(/^\/api\/files\/([a-f0-9-]{36})\/download$/);
 if(fileMatch&&req.method==='GET'){const file=(await readJSON(jsonFile('files'))).find(x=>x.id===fileMatch[1]);if(!file)throw fail(404,'Fichier introuvable.');res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':file.size,'Content-Disposition':`attachment; filename="livrable"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,'Cache-Control':'no-store'});await pipeline(createReadStream(path.join(storage,'files',file.id)),res);return;}
 if(url.pathname.startsWith('/api/'))throw fail(404,'Fonction inconnue.');if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'Méthode refusée.');
 const pathname=decodeURIComponent(url.pathname),filename=path.resolve(publicDir,'.'+(pathname==='/'?'/index.html':pathname));if(!filename.startsWith(publicDir+path.sep))throw fail(403,'Chemin refusé.');const stat=await fs.stat(filename).catch(()=>{throw fail(404,'Page introuvable.');});if(!stat.isFile())throw fail(404,'Page introuvable.');const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();await pipeline(createReadStream(filename),res);
 }catch(e){if(!res.headersSent)sendJSON(res,e.status||500,{error:e.status?e.message:'Une erreur empêche l’opération. Aucun succès n’a été confirmé.'});else res.destroy();}});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=await createApp();const port=Number(process.env.PORT||8770),host=process.env.HOST||'127.0.0.1';server.listen(port,host,()=>console.log(`Syncwave : http://${host}:${server.address().port}`));}

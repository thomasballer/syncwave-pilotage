import {depsOf,upstream} from './workflow-model.js?v=20261028.1';

export function ganttChain(items,id){
 if(!items.some(d=>d.id===id))return new Set();
 return new Set([...upstream(items,id).map(d=>d.id),id]);
}

// Links use the real objective graph. Filtering never introduces shortcuts
// between remaining rows or turns deliverable groups into dependencies.
export function ganttConnections(items,visibleIds,selectedId,mode='focus'){
 const visible=new Set(visibleIds),chain=ganttChain(items,selectedId),links=[],hidden=[];
 for(const target of items){
  for(const from of depsOf(target)){
   const focused=chain.has(from)&&chain.has(target.id);
   if(mode==='none'||(mode==='focus'&&!focused))continue;
   const link={from,to:target.id,focused};
   if(visible.has(from)&&visible.has(target.id))links.push(link);
   else if(visible.has(target.id))hidden.push(link);
  }
 }
 return {links,hidden,chain};
}

// Both anchors represent validation dates, not an assumed finish-to-start rule.
// The path enters the target on its right, away from the bar's date label.
export function validationPath(source,target,index,width){
 if(![source.x,source.y,target.x,target.y,width].every(Number.isFinite))throw Error('Coordonnées du Gantt invalides.');
 const lane=Math.min(width-7,Math.max(source.x,target.x)+14+(index%5)*6);
 const n=value=>Math.round(value*10)/10;
 return `M ${n(source.x+2)} ${n(source.y)} H ${n(lane)} V ${n(target.y)} H ${n(target.x+3)}`;
}

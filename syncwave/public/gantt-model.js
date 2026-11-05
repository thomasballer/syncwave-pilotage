import {depsOf,upstream} from './workflow-model.js?v=20261105.1';

export function ganttChain(items,id){
 if(!items.some(d=>d.id===id))return new Set();
 return new Set([...upstream(items,id).map(d=>d.id),id]);
}

// Links use the real objective graph. Filtering never introduces shortcuts
// between remaining rows or turns deliverable groups into dependencies.
export function ganttConnections(items,visibleIds,selectedId,mode='focus'){
 const visible=new Set(visibleIds),chain=ganttChain(items,selectedId),links=[],hidden=[],map=new Map(items.map(d=>[d.id,d]));
 for(const target of items){
  for(const from of depsOf(target)){
   const focused=chain.has(from)&&chain.has(target.id),cross=map.get(from)?.g!==target.g;
   if(mode==='none'||(mode==='focus'&&!focused)||(mode==='cross'&&!cross))continue;
   const link={from,to:target.id,focused,cross};
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

// A deliverable/person filter may still need a predecessor from another
// deliverable. Keep that real objective as context rather than dropping its link.
export function ganttContext(items,visibleIds){
 const ids=new Set(visibleIds),map=new Map(items.map(d=>[d.id,d])),context=new Set();
 for(const id of ids){const target=map.get(id);if(!target)continue;for(const from of depsOf(target)){const source=map.get(from);if(source&&source.g!==target.g&&!ids.has(from))context.add(from);}}
 return {ids:new Set([...ids,...context]),context};
}

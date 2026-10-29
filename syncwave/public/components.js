let componentCatalog=null;
const componentStates={confirmed:{label:'Confirmé par l’équipe',short:'Confirmé'},guide:{label:'Prévu dans les guides',short:'Dans les guides'},pending:{label:'Référence à préciser',short:'À préciser'}};
const componentSearchText=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/(\d)\s+(?=\d)/g,'$1').toLocaleLowerCase('fr');
function configureComponents(){
 if(!componentCatalog)return;
 $('#componentCategory').innerHTML='<option value="all">Toutes les familles</option>'+componentCatalog.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
 $('#componentStats').innerHTML=`<div><strong>${componentCatalog.items.length}</strong><span>fiches de matériel</span></div><div><strong>${componentCatalog.categories.length}</strong><span>familles complémentaires</span></div><div><strong>${componentCatalog.items.filter(d=>d.status==='confirmed').length}</strong><span>constats confirmés par l’équipe</span></div>`;
 renderComponents();
}
function renderComponents(){
 if(!componentCatalog)return;
 const query=componentSearchText($('#componentSearch').value.trim()),category=$('#componentCategory').value,state=$('#componentState').value;
 const visible=componentCatalog.items.filter(d=>(category==='all'||d.category===category)&&(state==='all'||d.status===state)&&componentSearchText([d.name,d.reference,d.role,d.note].join(' ')).includes(query));
 const categoryName=id=>componentCatalog.categories.find(c=>c.id===id)?.name||id;
 const external=(url,label)=>typeof url==='string'&&url.startsWith('https://')?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
 $('#componentCount').textContent=`${visible.length} fiche${visible.length>1?'s':''} affichée${visible.length>1?'s':''} sur ${componentCatalog.items.length}`;
 $('#componentGrid').innerHTML=visible.map(d=>`<article class="component-card" id="component-${d.id}"><figure class="component-visual ${d.image.kind==='photo'?'is-photo':''}"><img src="${esc(d.image.path)}" alt="${esc(d.image.alt)}" loading="lazy" decoding="async" data-component-image="${d.id}"><span class="component-category">${esc(categoryName(d.category))}</span><figcaption>${esc(d.image.caption)}</figcaption></figure><div class="component-copy"><span class="component-status ${d.status}"><i></i>${componentStates[d.status].label}</span><h3>${esc(d.name)}</h3><p class="component-reference">${esc(d.reference)}</p><p class="component-role">${esc(d.role)}</p><details class="component-detail"><summary>Détails et source</summary><p>${esc(d.note)}</p><div class="component-source"><strong>Référence du projet</strong><span>${esc(d.source.document)} · ${esc(d.source.section)}</span><small>Le PDF fourni complète ce guide ; son contenu est titré « Tutorial V3 ».</small></div>${d.documentation?`<div class="component-doc">${external(d.documentation.url,d.documentation.label)}</div>`:''}<p class="component-credit">${d.image.sourceUrl?external(d.image.sourceUrl,'Visuel : '+d.image.credit):esc(d.image.credit)}${d.image.kind==='illustration'?' · sans indication de brochage':''}</p></details><div class="component-goals"><span>Dans le planning</span>${d.objectives.map(id=>{const goal=data.find(d=>d.id===id);return goal?`<button data-id="${id}" title="${esc(goal.title)}">${id} ↗</button>`:'';}).join('')}</div></div></article>`).join('')||'<div class="component-empty"><strong>Aucun composant pour cette recherche.</strong><p>Essayez une autre référence ou réinitialisez les filtres.</p><button class="button" data-reset-components>Réinitialiser les filtres</button></div>';
}
function resetComponents(){ $('#componentSearch').value='';$('#componentCategory').value='all';$('#componentState').value='all';renderComponents(); }
$('#componentSearch').addEventListener('input',renderComponents);
['#componentCategory','#componentState'].forEach(selector=>$(selector).addEventListener('change',renderComponents));
$('#componentReset').onclick=resetComponents;
document.addEventListener('click',event=>{if(event.target.closest('[data-reset-components]'))resetComponents();});
document.addEventListener('error',event=>{const image=event.target;if(!image.matches?.('[data-component-image]')||image.dataset.fallbackApplied)return;image.dataset.fallbackApplied='true';image.src='images/components/'+image.dataset.componentImage+'.svg';const figure=image.closest('figure');figure?.classList.remove('is-photo');if(figure)figure.querySelector('figcaption').textContent='Illustration de repérage';},true);

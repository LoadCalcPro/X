(function(){
'use strict';

function makeHeader(){
  const header=document.createElement('div');
  header.className='v3-column-header section-column-header';
  header.innerHTML='<span>Description</span><span>Quantity</span><span>VA</span><span>Managed</span><span>Service Load</span><span>Generator Load</span>';
  return header;
}

function cardByHeading(text){
  return Array.from(document.querySelectorAll('main .card')).find(function(card){
    const heading=card.querySelector('.card-heading');
    return heading&&String(heading.textContent||'').replace(/\s+/g,' ').trim()===text;
  })||null;
}

function syncContinuousHeader(){
  const card=document.querySelector('.continuous-loads-card')||cardByHeading('Continuous Loads');
  if(!card)return;
  const body=card.querySelector('.card-body');
  if(!body)return;
  let header=body.querySelector(':scope > .section-column-header');
  if(!header){
    header=makeHeader();
    const firstRow=body.querySelector(':scope > .load-row');
    if(firstRow)body.insertBefore(header,firstRow);else body.prepend(header);
  }
}

function syncHVACHeaders(){
  const card=cardByHeading('HVAC Loads');
  if(!card)return;
  const body=card.querySelector('.card-body');
  if(!body)return;

  /* The section-level header is intentionally removed. Column headings belong
     with the actual HVAC system rows, not directly under HVAC Loads. */
  body.querySelectorAll(':scope > .v3-column-header').forEach(function(header){header.remove();});

  document.querySelectorAll('#v57HvacMethodSections .v522-system-group').forEach(function(group){
    let header=group.querySelector(':scope > .section-column-header');
    if(header)return;
    header=makeHeader();
    const title=group.querySelector(':scope > .v522-system-title');
    if(title)title.insertAdjacentElement('afterend',header);else group.prepend(header);
  });
}

function sync(){
  syncContinuousHeader();
  syncHVACHeaders();
}

function scheduleSync(){
  setTimeout(sync,0);
  setTimeout(sync,60);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});else scheduleSync();

document.addEventListener('click',function(event){
  if(event.target.closest('.heating-method-choice,#multipleHvacSystemsChoice,.v522-add-system,.v523-remove-system,.v57-hp-option'))scheduleSync();
});

window.syncGeneratorSectionColumnHeaders=sync;
})();
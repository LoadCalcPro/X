(function(){
'use strict';

function installSharedGridAuthority(){
  if(document.getElementById('loadGridAuthority'))return;
  const link=document.createElement('link');
  link.id='loadGridAuthority';
  link.rel='stylesheet';
  link.href='load-grid-authority.css?v=2';
  document.head.appendChild(link);
}

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

  body.querySelectorAll(':scope > .v3-column-header').forEach(function(header){header.remove();});

  document.querySelectorAll('#v57HvacMethodSections .v522-system-group').forEach(function(group){
    let header=group.querySelector(':scope > .section-column-header');
    if(header)return;
    header=makeHeader();
    const title=group.querySelector(':scope > .v522-system-title');
    if(title)title.insertAdjacentElement('afterend',header);else group.prepend(header);
  });
}

function syncHeaderLabels(){
  const actions=document.querySelector('.header-actions');
  if(!actions)return;

  const printButton=Array.from(actions.querySelectorAll('button')).find(function(button){
    return String(button.getAttribute('onclick')||'').includes('printCalculation');
  });
  if(printButton)printButton.textContent='Print / PDF';

  const newButton=Array.from(actions.querySelectorAll('button')).find(function(button){
    return String(button.getAttribute('onclick')||'').includes('startNewCalculationFromButton');
  });
  if(newButton)newButton.textContent='New Calculation';
}

function sync(){
  syncContinuousHeader();
  syncHVACHeaders();
  syncHeaderLabels();
}

function scheduleSync(){
  setTimeout(sync,0);
  setTimeout(sync,60);
  setTimeout(sync,250);
}

installSharedGridAuthority();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});else scheduleSync();

document.addEventListener('click',function(event){
  if(event.target.closest('.heating-method-choice,#multipleHvacSystemsChoice,.v522-add-system,.v523-remove-system,.v57-hp-option'))scheduleSync();
});

window.syncGeneratorSectionColumnHeaders=sync;
})();
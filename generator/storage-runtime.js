/* LoadCalcPro X Generator — persistent storage authority.
   Loaded after script.js and before app-runtime.js.
   This makes save/restore deterministic and keeps New Calculation as the only
   intentional clearing path for the main calculator state. */
(function(){
'use strict';

const KEY =
  (typeof STORAGE_KEY !== 'undefined' && STORAGE_KEY)
    ? STORAGE_KEY
    : 'loadcalcpro_generator_mobile_nec2023_v1';

const MANAGED_KEY =
  (typeof MANAGED_QTY_STORAGE_KEY !== 'undefined' && MANAGED_QTY_STORAGE_KEY)
    ? MANAGED_QTY_STORAGE_KEY
    : 'loadcalcpro_generator_mobile_managed_quantities_v1';

function buildState(){
  if(typeof calculatorState === 'function'){
    return calculatorState();
  }

  const state = {
    savedAt:new Date().toISOString(),
    project:{},
    inputs:{},
    descriptions:{},
    managedQuantities:{}
  };

  ['projectName','projectNumber','projectAddress','projectCityState']
    .forEach(function(id){
      const el=document.getElementById(id);
      state.project[id]=el ? el.value : '';
    });

  document.querySelectorAll('input[id^="q"],input[id^="v"],select[id^="q"]')
    .forEach(function(el){
      state.inputs[el.id]=el.value;
    });

  document.querySelectorAll('input[id^="d"]')
    .forEach(function(el){
      state.descriptions[el.id]=el.value;
    });

  if(typeof managedQuantities !== 'undefined' && managedQuantities){
    state.managedQuantities={...managedQuantities};
  }

  return state;
}

function writeState(){
  try{
    localStorage.setItem(KEY,JSON.stringify(buildState()));

    if(typeof saveManagedQuantities === 'function'){
      saveManagedQuantities();
    }else if(typeof managedQuantities !== 'undefined'){
      localStorage.setItem(MANAGED_KEY,JSON.stringify(managedQuantities||{}));
    }

    return true;
  }catch(e){
    return false;
  }
}

function readState(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return null;
    const data=JSON.parse(raw);
    return data && typeof data==='object' ? data : null;
  }catch(e){
    return null;
  }
}

function meaningful(data){
  if(!data)return false;

  const project=Object.values(data.project||{}).some(function(value){
    return String(value===null||value===undefined?'':value).trim()!=='';
  });

  const inputs=Object.entries(data.inputs||{}).some(function(entry){
    if(entry[0]==='q46')return false;
    const text=String(entry[1]===null||entry[1]===undefined?'':entry[1]).trim();
    if(!text)return false;
    const n=Number(text);
    return Number.isFinite(n) ? n!==0 : true;
  });

  const descriptions=Object.values(data.descriptions||{}).some(function(value){
    return String(value===null||value===undefined?'':value).trim()!=='';
  });

  const managed=Object.values(data.managedQuantities||{}).some(function(value){
    return Number(value)>0;
  });

  return project || inputs || descriptions || managed;
}

/* Replace the legacy save/read/check functions with one storage authority. */
window.saveState=function(showMessage){
  if(typeof suppressAutoSave!=='undefined' && suppressAutoSave)return false;
  if(typeof restorePromptOpen!=='undefined' && restorePromptOpen)return false;

  const ok=writeState();

  if(showMessage!==false && typeof showSaveStatus==='function'){
    showSaveStatus(ok ? 'Calculation saved' : 'Unable to save calculation');
  }

  return ok;
};

window.savedState=readState;
window.hasSavedCalculation=function(){
  return meaningful(readState());
};

/* Save immediately when any user-editable calculator field changes. */
function onEdit(event){
  const el=event && event.target;
  if(!el || !el.id)return;

  if(
    el.matches(
      '#projectName,#projectNumber,#projectAddress,#projectCityState,'+
      'input[id^="q"],input[id^="v"],input[id^="d"],select[id^="q"]'
    )
  ){
    writeState();
  }
}

document.addEventListener('input',onEdit,true);
document.addEventListener('change',onEdit,true);

/* pagehide is more dependable than beforeunload on phones and app-like browsers. */
window.addEventListener('pagehide',function(){
  if(typeof restorePromptOpen!=='undefined' && restorePromptOpen)return;
  writeState();
});

document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden'){
    if(typeof restorePromptOpen!=='undefined' && restorePromptOpen)return;
    writeState();
  }
});

})();

(function(){
'use strict';

function nonBlank(value){
  return String(value === null || value === undefined ? '' : value).trim() !== '';
}

function positiveOrText(value){
  const text=String(value === null || value === undefined ? '' : value).trim();
  if(!text)return false;
  const number=Number(text);
  return Number.isFinite(number) ? number > 0 : true;
}

function hasMeaningfulHvacData(){
  try{
    const raw=localStorage.getItem('loadcalcpro_hvac_method_sections_v57');
    if(!raw)return false;
    const data=JSON.parse(raw);
    if(!data || typeof data!=='object')return false;
    return Object.values(data).some(function(item){
      if(!item || typeof item!=='object')return false;
      return positiveOrText(item.qty) || positiveOrText(item.va);
    });
  }catch(e){
    return false;
  }
}

window.hasSavedCalculation=function(){
  const data=(typeof savedState==='function') ? savedState() : null;
  if(!data)return false;

  const project=Object.values(data.project || {}).some(nonBlank);

  const inputs=Object.entries(data.inputs || {}).some(function(entry){
    const id=entry[0];
    const value=entry[1];
    if(id==='q46')return false;
    return positiveOrText(value);
  });

  const motor=data.largestMotor || {};
  const largestMotor=
    motor.included === true ||
    positiveOrText(motor.va) ||
    nonBlank(motor.type);

  const managed=Object.values(data.managedQuantities || {}).some(function(value){
    return Number(value) > 0;
  });

  const meaningful=project || inputs || largestMotor || managed || hasMeaningfulHvacData();

  if(!meaningful){
    try{
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MANAGED_QTY_STORAGE_KEY);
    }catch(e){}
  }

  return meaningful;
};
})();

/* EV charger behavior: quantity alone does not create a load. Apply the 7,200 VA minimum only after a nameplate value is entered. */
(function(){
  'use strict';

  window.rowVA=function(row){
    const quantity=(typeof positiveQuantity==='function')
      ? positiveQuantity('q'+row)
      : Math.max(0,Math.floor(Number(document.getElementById('q'+row)?.value)||0));

    const enteredVA=(typeof numberValue==='function')
      ? numberValue('v'+row)
      : Math.max(0,Number(document.getElementById('v'+row)?.value)||0);

    if(row===43){
      if(quantity<1 || enteredVA<=0){
        return 0;
      }
      return quantity*Math.max(enteredVA,7200);
    }

    return quantity*enteredVA;
  };
})();

/* Load the consolidated print renderer after all legacy generator scripts have finished loading. */
(function(){
  'use strict';
  function loadPrintRenderer(){
    if(document.querySelector('script[data-generator-print-renderer]'))return;
    const script=document.createElement('script');
    script.src='print-report.js';
    script.dataset.generatorPrintRenderer='1';
    document.body.appendChild(script);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',loadPrintRenderer,{once:true});
  }else{
    loadPrintRenderer();
  }
})();

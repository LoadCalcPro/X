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

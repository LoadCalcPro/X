(function(){
  'use strict';

  const frame=document.getElementById('aicFrame');
  if(!frame)return;

  function innerDoc(){
    try{return frame.contentDocument||frame.contentWindow.document}catch(e){return null}
  }

  function sortHorsepowerSelect(select){
    if(!select)return;
    const current=select.value;
    const options=Array.from(select.options);
    if(options.length<2)return;

    const placeholder=options.find(option=>option.value==='');
    const horsepowerOptions=options
      .filter(option=>option.value!=='')
      .sort((a,b)=>Number(a.value)-Number(b.value));

    select.innerHTML='';
    if(placeholder)select.appendChild(placeholder);
    horsepowerOptions.forEach(option=>select.appendChild(option));
    if(current && horsepowerOptions.some(option=>option.value===current))select.value=current;
  }

  function sortAllHorsepowerLists(){
    const d=innerDoc();
    if(!d)return;
    d.querySelectorAll('select[data-motor-field="hp"]').forEach(sortHorsepowerSelect);
  }

  function install(){
    const d=innerDoc();
    if(!d)return;
    sortAllHorsepowerLists();
    if(d.__loadCalcProHpOrderInstalled)return;
    d.__loadCalcProHpOrderInstalled=true;
    d.addEventListener('change',event=>{
      if(event.target.matches('[data-motor-field="phase"],[data-motor-field="voltage"]')){
        setTimeout(sortAllHorsepowerLists,0);
      }
    },true);
    d.addEventListener('click',()=>setTimeout(sortAllHorsepowerLists,0),true);
  }

  frame.addEventListener('load',()=>{
    install();
    setTimeout(install,150);
    setTimeout(install,650);
  });

  try{
    const d=innerDoc();
    if(d&&d.readyState==='complete')install();
  }catch(e){}
})();

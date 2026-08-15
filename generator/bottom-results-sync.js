(function(){
'use strict';

function syncBottomResults(){
  const serviceSource=document.getElementById('serviceAmps');
  const generatorSource=document.getElementById('generatorAmps');
  const serviceView=document.getElementById('serviceAmpsView');
  const generatorView=document.getElementById('generatorAmpsView');

  if(serviceSource&&serviceView){
    serviceView.textContent=String(serviceSource.textContent||'0 A').trim()||'0 A';
  }

  if(generatorSource&&generatorView){
    generatorView.textContent=String(generatorSource.textContent||'0 A').trim()||'0 A';
  }
}

function observe(id){
  const el=document.getElementById(id);
  if(!el||!window.MutationObserver)return;
  new MutationObserver(syncBottomResults).observe(el,{childList:true,characterData:true,subtree:true});
}

function init(){
  syncBottomResults();
  observe('serviceAmps');
  observe('generatorAmps');
  document.addEventListener('input',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('change',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('click',function(){setTimeout(syncBottomResults,0)});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();

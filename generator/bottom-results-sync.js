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

function installPrintModeStyles(){
  if(document.getElementById('generatorPrintModeStyles'))return;
  const style=document.createElement('style');
  style.id='generatorPrintModeStyles';
  style.textContent=`
    .generator-print-mode-control{display:flex;align-items:center;gap:7px;min-height:42px;padding:5px 8px;border:1px solid rgba(255,255,255,.35);border-radius:9px;color:#fff;font-size:12px;font-weight:800;white-space:nowrap}
    .generator-print-mode-control select{min-height:30px;border:0;border-radius:7px;padding:4px 7px;background:#fff;color:#111827;font-size:12px;font-weight:700}
    @media(max-width:700px){.generator-print-mode-control{width:100%;justify-content:center}}
    @media print{
      #printReport.calculation-only .generator-print-heading .print-brand{display:none!important}
      #printReport.calculation-only .generator-print-heading{margin-bottom:7px!important}
      #printReport.calculation-only .print-title-text{font-size:11px!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.02em!important;color:#111!important}
    }
  `;
  document.head.appendChild(style);
}

function installPrintModeControl(){
  if(document.getElementById('generatorPrintMode'))return;
  const actions=document.querySelector('.header-actions');
  if(!actions)return;
  const printButton=Array.from(actions.querySelectorAll('button')).find(button=>String(button.getAttribute('onclick')||'').includes('printCalculation'));
  if(!printButton)return;
  const label=document.createElement('label');
  label.className='generator-print-mode-control';
  label.innerHTML='Print Type <select id="generatorPrintMode" aria-label="Generator print type"><option value="branded" selected>Branded Report</option><option value="calculation">Calculation Only</option></select>';
  actions.insertBefore(label,printButton);
}

function clearGenericPrint(){
  const report=document.getElementById('printReport');
  if(!report)return;
  report.classList.remove('calculation-only');
  const title=report.querySelector('.print-title-text');
  if(title&&title.dataset.originalPrintTitle){
    title.textContent=title.dataset.originalPrintTitle;
    delete title.dataset.originalPrintTitle;
  }
}

function applyGenericPrint(){
  const report=document.getElementById('printReport');
  if(!report)return;
  report.classList.add('calculation-only');
  const title=report.querySelector('.print-title-text');
  if(title){
    if(!title.dataset.originalPrintTitle)title.dataset.originalPrintTitle=title.textContent;
    title.textContent='Generator Optional Method Load Calculation';
  }
}

function installPrintModeWrapper(){
  if(window.__generatorPrintModeWrapped||typeof window.printCalculation!=='function')return;
  const original=window.printCalculation;
  window.printCalculation=function(){
    const mode=document.getElementById('generatorPrintMode')?.value||'branded';
    if(mode!=='calculation'){
      clearGenericPrint();
      return original.apply(this,arguments);
    }
    const nativePrint=window.print.bind(window);
    const currentPrint=window.print;
    window.print=function(){applyGenericPrint();nativePrint()};
    try{return original.apply(this,arguments)}finally{
      window.print=currentPrint;
      setTimeout(clearGenericPrint,250);
    }
  };
  window.__generatorPrintModeWrapped=true;
}

function loadPrintRenderer(){
  if(document.querySelector('script[data-generator-print-renderer]')){
    installPrintModeWrapper();
    return;
  }
  const script=document.createElement('script');
  script.src='print-report.js';
  script.dataset.generatorPrintRenderer='1';
  script.addEventListener('load',()=>setTimeout(installPrintModeWrapper,0),{once:true});
  document.body.appendChild(script);
}

function init(){
  syncBottomResults();
  observe('serviceAmps');
  observe('generatorAmps');
  document.addEventListener('input',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('change',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('click',function(){setTimeout(syncBottomResults,0)});
  installPrintModeStyles();
  installPrintModeControl();
  loadPrintRenderer();
  setTimeout(installPrintModeWrapper,100);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();

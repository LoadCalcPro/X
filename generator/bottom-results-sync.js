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

function trialDashboardUrl(){
  const trialEmail=localStorage.getItem('loadcalcproTrialEmail');
  const trialCode=localStorage.getItem('loadcalcproTrialCode');
  return (trialEmail&&trialCode)?'../trial-dashboard.html':'../member-dashboard.html';
}

function installTrialNavigation(){
  const actions=document.querySelector('.header-actions');
  if(!actions)return;
  const button=Array.from(actions.querySelectorAll('button')).find(b=>{
    const text=String(b.textContent||'').trim().toLowerCase();
    const onclick=String(b.getAttribute('onclick')||'').toLowerCase();
    return text==='available calculators'||text==='calculators'||onclick.includes('member-dashboard.html');
  });
  if(!button)return;
  button.removeAttribute('onclick');
  button.onclick=function(event){
    if(event){event.preventDefault();event.stopPropagation();}
    window.location.href=trialDashboardUrl();
    return false;
  };
}

function installPrintControlStyles(){
  if(document.getElementById('generatorPrintControlStyles'))return;
  const style=document.createElement('style');
  style.id='generatorPrintControlStyles';
  style.textContent=`
    .generator-print-control{display:flex;align-items:center;gap:7px;min-height:42px;padding:5px 8px;border:1px solid rgba(255,255,255,.35);border-radius:9px;color:#fff;font-size:12px;font-weight:800;white-space:nowrap}
    .generator-print-control select{min-height:30px;border:0;border-radius:7px;padding:4px 7px;background:#fff;color:#111827;font-size:12px;font-weight:700}
    @media(max-width:760px){.generator-print-control{width:100%;justify-content:center;flex-wrap:wrap}}
  `;
  document.head.appendChild(style);
}

function installPrintControls(){
  if(document.getElementById('generatorPrintType'))return;
  const actions=document.querySelector('.header-actions');
  if(!actions)return;
  const printButton=Array.from(actions.querySelectorAll('button')).find(button=>String(button.getAttribute('onclick')||'').includes('printCalculation'));
  if(!printButton)return;

  const control=document.createElement('div');
  control.className='generator-print-control';
  control.innerHTML=`
    <select id="generatorPrintType" aria-label="Generator print type">
      <option value="branded" selected>Branded Report</option>
      <option value="calculation">Calculation Only</option>
    </select>
    <select id="generatorPrintLayout" aria-label="Generator print layout">
      <option value="full" selected>Full Width</option>
      <option value="compact">Compact Left</option>
    </select>`;
  actions.insertBefore(control,printButton);
}

function loadPrintRenderer(){
  if(document.querySelector('script[data-generator-print-renderer]'))return;
  const script=document.createElement('script');
  script.src='print-report.js';
  script.dataset.generatorPrintRenderer='1';
  document.body.appendChild(script);
}

function init(){
  syncBottomResults();
  observe('serviceAmps');
  observe('generatorAmps');
  document.addEventListener('input',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('change',function(){setTimeout(syncBottomResults,0)});
  document.addEventListener('click',function(){setTimeout(syncBottomResults,0)});
  installTrialNavigation();
  setTimeout(installTrialNavigation,100);
  setTimeout(installTrialNavigation,500);
  installPrintControlStyles();
  installPrintControls();
  loadPrintRenderer();
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();

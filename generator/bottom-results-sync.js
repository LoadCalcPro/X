(function(){
'use strict';

function syncBottomResults(){
  const serviceSource=document.getElementById('serviceAmps');
  const generatorSource=document.getElementById('generatorAmps');
  const serviceView=document.getElementById('serviceAmpsView');
  const generatorView=document.getElementById('generatorAmpsView');
  if(serviceSource&&serviceView)serviceView.textContent=String(serviceSource.textContent||'0 A').trim()||'0 A';
  if(generatorSource&&generatorView)generatorView.textContent=String(generatorSource.textContent||'0 A').trim()||'0 A';
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
  button.textContent='Calculators';
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
    .generator-main-site{display:none}
    @media(max-width:760px){
      .app-header{padding:15px 14px 17px!important;background:#071b47!important}
      .brand-row{display:block!important}
      .app-brand{display:inline-flex!important;align-items:center!important;order:0!important;padding:0!important;font-size:0!important;line-height:1!important}
      .app-brand .bolt{color:#ff7a45!important;font-size:23px!important;margin-right:5px!important}
      .app-brand::after{content:'LoadCalcPro ';color:#fff;font-size:23px;font-weight:900;letter-spacing:-.025em}
      .app-brand .brand-x{order:3!important;color:#5eead4!important;font-size:23px!important;margin-left:0!important}
      .brand-row>div:first-child{display:flex!important;flex-direction:column!important}
      .app-brand{position:absolute!important;top:15px!important;left:14px!important}
      .brand-row{padding-top:38px!important}
      .app-title{margin:0!important;font-size:18px!important;line-height:1.15!important;font-weight:900!important;color:#fff!important}
      .app-version{margin-top:6px!important;color:#dbeafe!important;font-size:12px!important;font-weight:700!important}
      .header-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:18px!important}
      .header-actions button{min-height:46px!important;border:1px solid rgba(255,255,255,.40)!important;border-radius:9px!important;padding:10px 14px!important;background:rgba(255,255,255,.10)!important;color:#fff!important;font-size:13px!important;font-weight:800!important;white-space:normal!important}
      .header-actions button.primary{background:#0f766e!important;border-color:#2dd4bf!important}
      .generator-main-site{display:flex!important;align-items:center!important;justify-content:center!important}
      .generator-print-control{grid-column:1/-1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;width:100%!important;min-height:46px!important;padding:7px 8px!important;border:1px solid rgba(255,255,255,.40)!important;border-radius:9px!important;background:rgba(255,255,255,.10)!important}
      .generator-print-control select{width:100%!important;min-width:0!important;min-height:39px!important;padding:8px 10px!important;border:0!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:13px!important;font-weight:700!important}
    }
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

function installAicStylePhoneHeader(){
  const title=document.querySelector('.app-title');
  const version=document.querySelector('.app-version');
  const actions=document.querySelector('.header-actions');
  if(title)title.textContent='Generator Optional Method Calculator';
  if(version)version.textContent='Version 1.0';
  if(!actions)return;
  let mainSite=actions.querySelector('.generator-main-site');
  if(!mainSite){
    mainSite=document.createElement('button');
    mainSite.type='button';
    mainSite.className='generator-main-site';
    mainSite.textContent='Main Site';
    mainSite.addEventListener('click',()=>{window.location.href='../index.html';});
    actions.insertBefore(mainSite,actions.firstChild);
  }
  installTrialNavigation();
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
  installPrintControlStyles();
  installPrintControls();
  installAicStylePhoneHeader();
  setTimeout(installTrialNavigation,100);
  setTimeout(installTrialNavigation,500);
  loadPrintRenderer();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();

(function(){
'use strict';

function outputNumber(id){
  const el=document.getElementById(id);
  if(!el)return 0;
  const n=Number(String(el.textContent||'').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n)?n:0;
}
function displayNumber(value){
  const n=Math.round(Number(value)||0);
  return n.toLocaleString('en-US');
}
function generalApplianceTotals(){
  return {
    service:outputNumber('e8')+outputNumber('e31'),
    generator:outputNumber('f8')+outputNumber('f31')
  };
}
function hvacContinuousTotals(){
  return {
    service:outputNumber('e44')+outputNumber('e45'),
    generator:outputNumber('f44')+outputNumber('f45')
  };
}
function ensureCalculatorTotals(){
  const demand=document.getElementById('v3DemandCard');
  if(demand){
    const body=demand.querySelector('.card-body');
    if(body&&!document.getElementById('generalApplianceTotalRow')){
      const row=document.createElement('div');
      row.id='generalApplianceTotalRow';
      row.className='demand-row checkpoint-total-row';
      row.innerHTML='<span class="demand-description">Total General + Appliance Load</span><span id="generalApplianceService" class="demand-service"></span><span id="generalApplianceGenerator" class="demand-generator"></span>';
      const first=body.querySelector('.demand-row');
      if(first)body.insertBefore(row,first);else body.appendChild(row);
    }
  }

  const continuous=document.querySelector('.continuous-loads-card .card-body');
  if(continuous&&!document.getElementById('hvacContinuousTotalRow')){
    const row=document.createElement('div');
    row.id='hvacContinuousTotalRow';
    row.className='checkpoint-total-box';
    row.innerHTML='<div class="checkpoint-total-label">Total HVAC + Continuous Load</div><div class="checkpoint-total-values"><div><span>Service Load</span><strong id="hvacContinuousService"></strong></div><div><span>Generator Load</span><strong id="hvacContinuousGenerator"></strong></div></div>';
    continuous.appendChild(row);
  }
}
function updateCalculatorTotals(){
  ensureCalculatorTotals();
  const ga=generalApplianceTotals();
  const hc=hvacContinuousTotals();
  const map={
    generalApplianceService:ga.service,
    generalApplianceGenerator:ga.generator,
    hvacContinuousService:hc.service,
    hvacContinuousGenerator:hc.generator
  };
  Object.entries(map).forEach(([id,value])=>{
    const el=document.getElementById(id);
    if(el)el.textContent=displayNumber(value);
  });
}
function rowHTML(label,service,generator,className){
  return '<tr class="'+className+'"><td><strong>'+label+'</strong></td><td></td><td class="number"><strong>'+displayNumber(service)+'</strong></td><td class="number"><strong>'+displayNumber(generator)+'</strong></td></tr>';
}
function polishPrintReport(){
  const report=document.getElementById('printReport');
  if(!report)return;
  const page=report.querySelector('.print-page');
  const table=report.querySelector('.print-table');
  if(!page||!table)return;

  const heading=page.querySelector('h1');
  if(heading){
    heading.innerHTML='<div class="generator-print-heading"><div class="print-brand"><span class="print-brand-main">LoadCalc</span><span class="print-brand-accent">Pro X</span></div><div class="print-title-text">Optional Method Generator Calculation Report</div></div>';
  }

  const ga=generalApplianceTotals();
  const hc=hvacContinuousTotals();
  const rows=Array.from(table.querySelectorAll('tr'));
  const demandSection=rows.find(r=>/^Demand Load$/i.test(String(r.textContent||'').trim()));
  if(demandSection&&!table.querySelector('.print-general-appliance-total')){
    demandSection.insertAdjacentHTML('afterend',rowHTML('Total General + Appliance Load',ga.service,ga.generator,'print-general-appliance-total checkpoint-print-row'));
  }

  const finalRow=table.querySelector('.final-total-row');
  if(finalRow&&!table.querySelector('.print-hvac-continuous-total')){
    finalRow.insertAdjacentHTML('beforebegin',rowHTML('Total HVAC + Continuous Load',hc.service,hc.generator,'print-hvac-continuous-total checkpoint-print-row'));
  }
}
function installStyles(){
  if(document.getElementById('generatorReportPolishStyles'))return;
  const style=document.createElement('style');
  style.id='generatorReportPolishStyles';
  style.textContent=`
.checkpoint-total-row{font-weight:800;background:#fbfcfe}
.checkpoint-total-box{margin-top:12px;border-top:1px solid #94a3b8;padding:10px 0 0}
.checkpoint-total-label{margin-bottom:7px;font-size:13px;font-weight:900;color:#0f172a}
.checkpoint-total-values{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.checkpoint-total-values>div{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #d8dee9;border-radius:8px;padding:8px 10px;background:#f8fafc}
.checkpoint-total-values span{font-size:12px;font-weight:800;color:#475569}
.checkpoint-total-values strong{font-size:15px;color:#0f172a;font-variant-numeric:tabular-nums}
@media(max-width:899px){.checkpoint-total-values{grid-template-columns:1fr}.checkpoint-total-box{margin-top:10px}.checkpoint-total-label{font-size:13px}}
@media print{
  .print-page{border:.6pt solid #cbd5e1!important;padding:.14in!important;box-sizing:border-box!important}
  .print-page h1{display:block!important;margin:0 0 7px!important;padding:0 0 7px!important;border-bottom:1px solid #777!important}
  .generator-print-heading{display:block!important}
  .print-brand{display:block!important;margin:0 0 2px!important;font-size:12px!important;line-height:1.05!important;font-weight:900!important;letter-spacing:0!important}
  .print-brand-main{color:#17377f!important}
  .print-brand-accent{color:#0f766e!important;margin-left:2px!important}
  .print-title-text{display:block!important;color:#111!important;font-size:9px!important;line-height:1.15!important;font-weight:700!important}
  .print-table{width:84%!important;margin-left:auto!important;margin-right:auto!important}
  .print-table th:first-child,.print-table td:first-child{width:46%!important}
  .print-table th:nth-child(2),.print-table td:nth-child(2){width:12%!important}
  .print-table th:nth-child(3),.print-table td:nth-child(3),.print-table th:nth-child(4),.print-table td:nth-child(4){width:21%!important}
  .checkpoint-print-row td{background:#fbfcfe!important;border-top:1px solid #94a3b8!important;font-weight:800!important}
}
`;
  document.head.appendChild(style);
}

installStyles();

const originalCalculate=window.calculate;
if(typeof originalCalculate==='function'&&!window.__generatorReportPolishCalculateWrapped){
  window.calculate=function(){
    const result=originalCalculate.apply(this,arguments);
    updateCalculatorTotals();
    return result;
  };
  window.__generatorReportPolishCalculateWrapped=true;
}

window.printCalculation=function(){
  if(typeof window.calculate==='function')window.calculate();
  updateCalculatorTotals();
  polishPrintReport();
  window.print();
};

function init(){
  ensureCalculatorTotals();
  updateCalculatorTotals();
  setTimeout(updateCalculatorTotals,0);
  setTimeout(updateCalculatorTotals,150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else init();

})();
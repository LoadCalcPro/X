(function(){
'use strict';

function esc(value){return String(value===null||value===undefined?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}
function num(value){const n=Math.round(Number(value)||0);return n.toLocaleString('en-US')}
function out(id){const el=document.getElementById(id);if(!el)return 0;const n=Number(String(el.textContent||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0}
function qty(id){const el=document.getElementById(id);const n=Math.floor(Number(el?el.value:0)||0);return n>0?n:0}
function value(id){const el=document.getElementById(id);return el?String(el.value||'').trim():''}
function vaForRow(row){if(row===5)return 3;if(row===6||row===7)return 1500;const n=Number(value('v'+row));return Number.isFinite(n)&&n>0?n:0}
function readPrintJSON(key,fallback){try{const parsed=JSON.parse(localStorage.getItem(key)||'');return parsed&&typeof parsed==='object'?parsed:fallback}catch(e){return fallback}}
function hvacManagedForKind(kind){
  const methods=readPrintJSON('loadcalcpro_hvac_selected_methods_v1',[]),data=readPrintJSON('loadcalcpro_hvac_method_sections_v57',{}),managed=readPrintJSON('loadcalcpro_hvac_method_managed_v57',{}),counts=readPrintJSON('loadcalcpro_hvac_visible_system_counts_v522',{});
  if(!Array.isArray(methods))return 0;
  let total=0;
  methods.filter(method=>['central65','separate40','heatpump'].includes(method)).forEach(method=>{
    const count=Math.max(1,Math.min(3,Math.floor(Number(counts[method])||1)));
    for(let i=1;i<=count;i++){
      const type=kind+(i===1?'':i),key=method+'_'+type,item=data[key]||{},entered=Math.max(0,Math.floor(Number(item.qty)||0)),raw=managed[key],selected=raw===true?entered:Math.floor(Number(raw)||0);
      total+=Math.max(0,Math.min(entered,Number.isFinite(selected)?selected:0));
    }
  });
  return total;
}
function managedForRow(row){if(row===37)return hvacManagedForKind('ac');if(row===38)return hvacManagedForKind('heat');if(typeof managedQuantity==='function')return managedQuantity(row);return 0}
function managedMarker(row){const managed=managedForRow(row);return managed>0?managed:''}
function generalTotal(){return Math.max(Number(value('q5'))||0,0)*3+Math.max(qty('q6'),0)*1500+Math.max(qty('q7'),0)*1500}
function applianceTotals(){let service=0,generator=0;for(let row=10;row<=30;row++){service+=out('e'+row);generator+=out('f'+row)}return{service,generator}}
function generatorCell(generator,row){const managed=row?managedMarker(row):'';const marker=managed!==''?'<span class="generator-qty" title="Managed quantity">'+esc(managed)+'</span>':'';return '<td class="number generator-number">'+marker+'<span class="generator-value">'+num(generator)+'</span></td>'}
function loadRow(label,quantity,va,service,generator,row,className){if(Number(service)<=0&&Number(generator)<=0)return '';return '<tr class="'+(className||'normal-load-row')+'"><td>'+esc(label)+'</td><td class="quantity">'+(quantity?esc(quantity):'')+'</td><td class="number va-number">'+(Number(va)>0?num(va):'')+'</td><td class="number">'+num(service)+'</td>'+generatorCell(generator,row)+'</tr>'}
function totalRow(label,service,generator,className){return '<tr class="'+(className||'subtotal-row')+'"><td><strong>'+esc(label)+'</strong></td><td></td><td></td><td class="number"><strong>'+num(service)+'</strong></td><td class="number"><strong>'+num(generator)+'</strong></td></tr>'}
function sectionRow(label){return '<tr class="print-section-row"><td colspan="5">'+esc(label)+'</td></tr>'}
function applianceLabel(item){if(typeof applianceDescription==='function')return applianceDescription(item.row,item.label);return item.label||''}
function hvacLabel(row){if(typeof window.getHVACRowLabel==='function')return window.getHVACRowLabel(row);return row===37||row===39?'Air Conditioning':'Heating'}
function printType(){return document.getElementById('generatorPrintType')?.value||'branded'}
function printLayout(){return document.getElementById('generatorPrintLayout')?.value||'full'}

function installStyle(){
  if(document.getElementById('generatorPrintSingleSourceStyle'))return;
  const style=document.createElement('style');style.id='generatorPrintSingleSourceStyle';style.textContent=`
@media print{
  @page{size:letter portrait;margin:.22in}
  html,body{margin:0!important;padding:0!important;background:#fff!important;color:#222!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .mobile-app,.bottom-results,.modal-backdrop{display:none!important}
  .print-report{display:block!important;width:100%!important;margin:0!important;padding:0!important;font-family:"Segoe UI",Arial,Helvetica,sans-serif!important;color:#222!important}
  .print-page{width:84%!important;margin:0 auto!important;padding:.14in!important;border:.6pt solid #cbd5e1!important;box-sizing:border-box!important;background:#fff!important}
  .print-page.compact{width:58%!important;margin-left:.10in!important;margin-right:auto!important}
  .generator-print-heading{margin:0 0 7px!important;padding:0 0 7px!important;border-bottom:1px solid #777!important}
  .print-brand{display:block!important;margin:0 0 2px!important;font-size:13px!important;line-height:1.05!important;font-weight:900!important;letter-spacing:0!important}
  .print-brand-main{color:#17377f!important}.print-brand-accent{margin-left:0!important;color:#0f766e!important}
  .print-title-text{display:block!important;color:#222!important;font-size:9px!important;line-height:1.15!important;font-weight:700!important}
  .print-page.calculation-only .print-brand{display:none!important}
  .print-page.calculation-only .print-title-text{font-size:10px!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.02em!important}
  .print-project{display:grid!important;grid-template-columns:1fr 1fr!important;gap:3px 12px!important;margin:0 0 5px!important;padding:0 0 5px!important;border-bottom:1px solid #c7cdd4!important;color:#222!important;font-size:9px!important;line-height:1.25!important}
  .print-table{width:100%!important;margin:0!important;border-collapse:collapse!important;table-layout:fixed!important}
  .print-table th,.print-table td{height:20px!important;padding:2px 4px!important;border:1px solid #cfd4da!important;color:#222!important;font-size:8.4px!important;line-height:1.15!important;vertical-align:middle!important}
  .print-table thead th{background:#f3f4f6!important;color:#222!important;border-top:1.2px solid #6b7280!important;border-bottom:1.2px solid #6b7280!important;font-size:8px!important;font-weight:800!important;text-align:center!important}
  .print-table th:first-child,.print-table td:first-child{width:38%!important;text-align:left!important}
  .print-table th:nth-child(2),.print-table td:nth-child(2){width:10%!important;text-align:center!important}
  .print-table th:nth-child(3),.print-table td:nth-child(3){width:12%!important;text-align:right!important}
  .print-table th:nth-child(4),.print-table td:nth-child(4){width:19%!important;text-align:right!important}
  .print-table th:nth-child(5),.print-table td:nth-child(5){width:21%!important;text-align:right!important}
  .print-page.compact .print-table th,.print-page.compact .print-table td{font-size:7.6px!important;padding:2px 3px!important}
  .print-page.compact .print-project{font-size:8px!important;gap:2px 8px!important}
  .print-table .normal-load-row td{background:#fff!important;color:#222!important;font-weight:400!important}
  .print-table .normal-load-row td.number,.print-table .normal-load-row td.quantity{color:#222!important;font-weight:400!important}
  .print-table .print-section-row td{background:#e8edf3!important;color:#222!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:.02em!important;text-align:left!important}
  .print-table .subtotal-row td,.print-table .demand-total-row td,.print-table .hvac-continuous-total-row td{background:#f7f7f7!important;color:#222!important;font-weight:800!important}
  .print-table .demand-breakdown-row td{background:#fff!important;color:#222!important;font-weight:400!important}
  .generator-number{position:relative!important;white-space:nowrap!important}
  .generator-qty{float:left!important;min-width:15px!important;margin-left:1px!important;margin-right:7px!important;padding:1px 3px!important;border:1px solid #94a3b8!important;border-radius:3px!important;text-align:center!important;font-size:7.5px!important;line-height:1.05!important;font-weight:700!important;color:#222!important;background:#fff!important}
  .generator-value{float:right!important}
  .print-table .managed-quantity-row td{background:#fff!important;color:#222!important;border-top:1px solid #94a3b8!important;font-weight:800!important}
  .print-table .managed-quantity-row .managed-total-value{text-align:right!important}
  .print-table .final-total-row td,.print-table .final-amps-row td{background:#fff!important;color:#222!important;border-top:1.5px solid #4b5563!important;font-weight:900!important}
  .print-table tr{break-inside:avoid!important;page-break-inside:avoid!important}
}`;document.head.appendChild(style)
}

window.updatePrintRows=function(data){
  const report=document.getElementById('printReport');if(!report)return;
  const generic=printType()==='calculation';
  const compact=printLayout()==='compact';
  const general=generalTotal(),appliances=applianceTotals(),combinedService=general+appliances.service,combinedGenerator=general+appliances.generator;
  const demandServiceCombined=(data.demandLoads&&Number.isFinite(data.demandLoads.serviceCombined))?data.demandLoads.serviceCombined:combinedService;
  const demandGeneratorCombined=(data.demandLoads&&Number.isFinite(data.demandLoads.generatorCombined))?data.demandLoads.generatorCombined:combinedGenerator;
  const serviceFirst=Math.min(Math.max(demandServiceCombined,0),10000),generatorFirst=Math.min(Math.max(demandGeneratorCombined,0),10000);
  const serviceRemainder=Math.max(demandServiceCombined-10000,0)*.40,generatorRemainder=Math.max(demandGeneratorCombined-10000,0)*.40;
  const hvacContinuousService=(Number(data.hvacLoads&&data.hvacLoads.service)||0)+(Number(data.continuousLoads&&data.continuousLoads.service)||0);
  const hvacContinuousGenerator=(Number(data.hvacLoads&&data.hvacLoads.generator)||0)+(Number(data.continuousLoads&&data.continuousLoads.generator)||0);
  let body='';
  body+=loadRow('General Lighting',qty('q5'),3,out('e5'),out('f5'),5);
  body+=loadRow('Small Appliance Circuits',qty('q6'),1500,out('e6'),out('f6'),6);
  body+=loadRow('Laundry Circuit',qty('q7'),1500,out('e7'),out('f7'),7);
  if(typeof APPLIANCES!=='undefined')APPLIANCES.forEach(item=>{body+=loadRow(applianceLabel(item),qty('q'+item.row),vaForRow(item.row),out('e'+item.row),out('f'+item.row),item.row)});
  body+=totalRow('Total General + Appliance Load',combinedService,combinedGenerator,'subtotal-row');
  body+=sectionRow('Demand Load');
  body+='<tr class="demand-breakdown-row"><td>First 10,000 at 100%</td><td></td><td></td><td class="number">'+num(serviceFirst)+'</td><td class="number">'+num(generatorFirst)+'</td></tr>';
  body+='<tr class="demand-breakdown-row"><td>Remainder at 40%</td><td></td><td></td><td class="number">'+num(serviceRemainder)+'</td><td class="number">'+num(generatorRemainder)+'</td></tr>';
  body+=totalRow('Demand Total',data.demandLoads.service,data.demandLoads.generator,'demand-total-row');
  const hvacRows=[37,38,39,40].map(row=>loadRow(hvacLabel(row),qty('q'+row),vaForRow(row),out('e'+row),out('f'+row),row)).join('');if(hvacRows)body+=sectionRow('HVAC Load')+hvacRows;
  let continuousRows='';continuousRows+=loadRow('EV Charger',qty('q43'),vaForRow(43),out('e43'),out('f43'),43);
  continuousRows+=loadRow(value('d47')||'Additional Continuous Load (100%)',qty('q47'),vaForRow(47),out('e47'),out('f47'),47);
  continuousRows+=loadRow(value('d42')||'Additional Continuous Load (125%)',qty('q42'),vaForRow(42),out('e42'),out('f42'),42);
  if(data.largestMotor&&Number(data.largestMotor.additionalVA)>0)continuousRows+=loadRow((data.largestMotor.type||'Largest Motor')+' — Additional 25%','',data.largestMotor.additionalVA,data.largestMotor.additionalVA,data.largestMotor.additionalVA,null);
  if(continuousRows)body+=sectionRow('Continuous Loads')+continuousRows;
  body+=totalRow('Total HVAC + Continuous Load',hvacContinuousService,hvacContinuousGenerator,'hvac-continuous-total-row');
  body+=totalRow('Total VA',data.serviceTotalVA,data.generatorTotalVA,'final-total-row');
  body+='<tr class="final-amps-row"><td><strong>Calculated Amps</strong></td><td></td><td></td><td class="number"><strong>'+Math.ceil(Number(data.serviceCurrent)||0)+' A</strong></td><td class="number"><strong>'+Math.ceil(Number(data.generatorCurrent)||0)+' A</strong></td></tr>';
  body+='<tr class="managed-quantity-row"><td colspan="4">Managed Quantity</td><td class="managed-total-value">'+num(data.managedLoadCount)+'</td></tr>';

  const pageClass='print-page'+(generic?' calculation-only':'')+(compact?' compact':'');
  const heading=generic
    ? '<div class="generator-print-heading"><div class="print-title-text">Generator Optional Method Load Calculation</div></div>'
    : '<div class="generator-print-heading"><div class="print-brand"><span class="print-brand-main">LoadCalc</span><span class="print-brand-accent">Pro X</span></div><div class="print-title-text">Generator Optional Method Calculator</div></div>';

  report.innerHTML='<div class="'+pageClass+'">'+heading+'<div class="print-project"><div><strong>Project:</strong> '+esc(value('projectName'))+'</div><div><strong>Project #:</strong> '+esc(value('projectNumber'))+'</div><div><strong>Address:</strong> '+esc(value('projectAddress'))+'</div><div><strong>City / State:</strong> '+esc(value('projectCityState'))+'</div><div><strong>Service Voltage:</strong> '+num(data.voltage)+' V</div></div><table class="print-table"><thead><tr><th>Description</th><th>Quantity</th><th>VA</th><th>Service Load</th><th>Generator Load</th></tr></thead><tbody>'+body+'</tbody></table></div>';
};

window.printCalculation=function(){
  if(typeof window.calculate==='function')window.calculate();
  window.print();
};

installStyle();
if(typeof window.calculate==='function')window.calculate();
})();

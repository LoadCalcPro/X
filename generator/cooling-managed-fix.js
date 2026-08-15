/* LoadCalcPro staging hotfix: preserve the service-selected HVAC controller when managed loads are applied. */
(function(){
  'use strict';

  const original = window.hvacLoadCalculation;
  if (typeof original !== 'function') return;

  const METHODS_KEY = 'loadcalcpro_hvac_selected_methods_v1';
  const DATA_KEY = 'loadcalcpro_hvac_method_sections_v57';
  const MANAGED_KEY = 'loadcalcpro_hvac_method_managed_v57';
  const COUNT_KEY = 'loadcalcpro_hvac_visible_system_counts_v522';
  const HP_SYSTEM_KEY = 'loadcalcpro_hvac_heatpump_answers_v543';

  function readJSON(key, fallback){try{const value=JSON.parse(localStorage.getItem(key)||'');return value&&typeof value==='object'?value:fallback}catch(e){return fallback}}
  function selected(){const value=readJSON(METHODS_KEY,[]);return Array.isArray(value)?value.filter(m=>['central65','separate40','heatpump'].includes(m)):[]}
  function count(method){const counts=readJSON(COUNT_KEY,{});return Math.max(1,Math.min(3,Math.floor(Number(counts[method])||1)))}
  function typeFor(kind,index){return kind+(index===1?'':index)}
  function key(method,type){return method+'_'+type}
  function item(method,type){return readJSON(DATA_KEY,{})[key(method,type)]||{}}
  function qty(method,type){return Math.max(0,Math.floor(Number(item(method,type).qty)||0))}
  function va(method,type){return Math.max(0,Number(item(method,type).va)||0)}
  function total(method,type){return qty(method,type)*va(method,type)}
  function managedQty(method,type){const q=qty(method,type),raw=readJSON(MANAGED_KEY,{})[key(method,type)],n=raw===true?q:Math.floor(Number(raw)||0);return Math.max(0,Math.min(q,n))}
  function remaining(method,type){return Math.max(qty(method,type)-managedQty(method,type),0)*va(method,type)}
  function aggregate(method,kind,generator){let value=0;for(let i=1;i<=count(method);i++)value+=(generator?remaining:total)(method,typeFor(kind,i));return value}
  function heatFactor(method){if(method!=='separate40')return .65;let units=0;for(let i=1;i<=count(method);i++)units+=qty(method,typeFor('heat',i));return units>=4?.40:.65}
  function hpAnswer(index){const answers=readJSON(HP_SYSTEM_KEY,{});return answers[String(index)]||''}
  function heatPumpResult(generator){let result={total:0,c:0,h:0};for(let i=1;i<=count('heatpump');i++){const ac=typeFor('ac',i),heat=typeFor('heat',i),serviceC=total('heatpump',ac),serviceH=total('heatpump',heat)*.65,c=(generator?remaining:total)('heatpump',ac),h=(generator?remaining:total)('heatpump',heat)*.65,answer=hpAnswer(i);if(answer==='yes'){result.total+=c+h;result.c+=c;result.h+=h}else if(answer==='no'){if(serviceC>=serviceH){result.total+=c;result.c+=c}else{result.total+=h;result.h+=h}}}return result}
  function normalResult(method,generator){const factor=heatFactor(method),serviceC=aggregate(method,'ac',false),serviceH=aggregate(method,'heat',false)*factor,c=aggregate(method,'ac',generator),h=aggregate(method,'heat',generator)*factor;return serviceC>=serviceH?{total:c,c:c,h:0}:{total:h,c:0,h:h}}

  window.hvacLoadCalculation=function(){original();let service=0,generator=0,serviceAC=0,generatorAC=0,serviceHeating=0,generatorHeating=0;selected().forEach(method=>{let s,g;if(method==='heatpump'){s=heatPumpResult(false);g=heatPumpResult(true)}else{s=normalResult(method,false);g=normalResult(method,true)}service+=s.total;generator+=g.total;serviceAC+=s.c;generatorAC+=g.c;serviceHeating+=s.h;generatorHeating+=g.h});if(typeof setOutput==='function'){setOutput('e37',serviceAC);setOutput('e38',serviceHeating);setOutput('f37',generatorAC);setOutput('f38',generatorHeating)}return{service,generator,serviceAC,generatorAC,serviceHeating,generatorHeating,method:selected().join(','),multipleHeatTypes:selected().length>1}}
})();

/* Keep each heat-pump system's Yes/No choice independent. */
(function(){
  'use strict';
  const HP_SYSTEM_KEY='loadcalcpro_hvac_heatpump_answers_v543',LEGACY_HP_KEY='loadcalcpro_hvac_multi_hp_answer_v1';
  function readAnswers(){try{const value=JSON.parse(localStorage.getItem(HP_SYSTEM_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(e){return {}}}
  function writeAnswers(value){try{localStorage.setItem(HP_SYSTEM_KEY,JSON.stringify(value));localStorage.setItem(LEGACY_HP_KEY,'yes')}catch(e){}}
  function refreshQuestion(index){const answers=readAnswers(),current=answers[String(index)]||'';document.querySelectorAll('.v543-hp-option[data-v543-hp-index="'+index+'"]').forEach(function(button){const chosen=button.dataset.v543HpAnswer===current;button.classList.toggle('selected',chosen);const mark=button.querySelector('.v543-hp-check');if(mark)mark.textContent=chosen?'✓':''})}
  document.addEventListener('click',function(event){const button=event.target.closest('.v543-hp-option');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const index=String(button.dataset.v543HpIndex||''),answer=String(button.dataset.v543HpAnswer||'');if(!index||(answer!=='yes'&&answer!=='no'))return;const answers=readAnswers();if(answers[index]===answer)delete answers[index];else answers[index]=answer;writeAnswers(answers);refreshQuestion(index);if(typeof calculate==='function')calculate()},true)
})();

/* Keep the fixed Service/Generator result boxes symmetrical. */
(function(){
  'use strict';
  function makeRow(label,valueNode,suffix){const row=document.createElement('div');row.className='calculation-summary-row';const labelNode=document.createElement('span');labelNode.textContent=label;const valueWrap=document.createElement('span');valueWrap.appendChild(valueNode);if(suffix)valueWrap.appendChild(document.createTextNode(suffix));row.appendChild(labelNode);row.appendChild(valueWrap);return row}
  function syncSummaryValues(){const serviceSource=document.getElementById('serviceTotalVAView'),generatorSource=document.getElementById('generatorTotalVAView'),serviceTarget=document.getElementById('calcSummaryServiceVA'),generatorTarget=document.getElementById('calcSummaryGeneratorVA');if(serviceSource&&serviceTarget)serviceTarget.textContent=serviceSource.textContent||'0';if(generatorSource&&generatorTarget)generatorTarget.textContent=generatorSource.textContent||'0'}
  function watch(source){if(!source)return;new MutationObserver(syncSummaryValues).observe(source,{childList:true,characterData:true,subtree:true})}
  function init(){if(document.getElementById('calculationFinalSummary'))return;const q42=document.getElementById('q42'),additionalRow=q42?q42.closest('.load-row'):null,managedCount=document.getElementById('bottomManagedLoadCount'),generatorVA=document.getElementById('generatorTotalVAView'),generatorLine=generatorVA?generatorVA.closest('.total-managed-line'):null;if(!additionalRow||!managedCount||!generatorVA||!generatorLine)return;const summary=document.createElement('div');summary.id='calculationFinalSummary';summary.className='calculation-summary';summary.setAttribute('aria-label','Final calculation summary');const serviceValue=document.createElement('span');serviceValue.id='calcSummaryServiceVA';serviceValue.textContent='0';const generatorValue=document.createElement('span');generatorValue.id='calcSummaryGeneratorVA';generatorValue.textContent='0';summary.appendChild(makeRow('Service Load:',serviceValue,' VA'));summary.appendChild(makeRow('Generator Load:',generatorValue,' VA'));summary.appendChild(makeRow('Managed Quantity:',managedCount,''));additionalRow.insertAdjacentElement('afterend',summary);generatorLine.textContent='';generatorLine.appendChild(generatorVA);generatorLine.appendChild(document.createTextNode(' VA'));syncSummaryValues();watch(document.getElementById('serviceTotalVAView'));watch(generatorVA)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();

/* LoadCalcPro X navigation: Main Site + existing calculator actions. */
(function(){
  'use strict';
  function initNavigation(){
    const actions=document.querySelector('.header-actions');
    if(!actions||actions.querySelector('.main-site-button'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='main-site-button';
    button.textContent='Main Site';
    button.addEventListener('click',function(){window.location.href='../index.html'});
    actions.insertBefore(button,actions.firstChild);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initNavigation,{once:true});else initNavigation();
})();

/* Final Generator totals, print presentation, and continuous managed-load fixes. */
(function(){
  'use strict';

  function numberFrom(id){
    const el=document.getElementById(id);
    if(!el)return 0;
    const n=Number(String(el.textContent||'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function inputNumber(id){
    const el=document.getElementById(id);
    const n=Number(el?el.value:0);
    return Number.isFinite(n)?n:0;
  }
  function textNumber(value){return Math.round(Number(value)||0).toLocaleString('en-US')}
  function generalAppliance(){
    const general=(Math.max(inputNumber('q5'),0)*3)+(Math.max(Math.floor(inputNumber('q6')),0)*1500)+(Math.max(Math.floor(inputNumber('q7')),0)*1500);
    let serviceAppliances=0;
    let generatorAppliances=0;
    for(let row=10;row<=30;row++){
      serviceAppliances+=numberFrom('e'+row);
      generatorAppliances+=numberFrom('f'+row);
    }
    return{service:general+serviceAppliances,generator:general+generatorAppliances};
  }
  function hvacContinuous(){return{service:numberFrom('e44')+numberFrom('e45'),generator:numberFrom('f44')+numberFrom('f45')}}

  function makeInlineTotal(id,label,serviceId,generatorId){
    const row=document.createElement('div');
    row.id=id;
    row.className='demand-row total checkpoint-total-row';
    row.innerHTML='<span class="demand-description">'+label+'</span><span id="'+serviceId+'" class="demand-service"></span><span id="'+generatorId+'" class="demand-generator"></span>';
    return row;
  }

  function ensureTotals(){
    const demandBody=document.querySelector('#v3DemandCard .card-body');
    if(demandBody&&!document.getElementById('generalApplianceTotalRow')){
      const row=makeInlineTotal('generalApplianceTotalRow','Total General + Appliance Load','generalApplianceService','generalApplianceGenerator');
      const first=demandBody.querySelector('.demand-row');
      if(first)demandBody.insertBefore(row,first);else demandBody.appendChild(row);
    }

    const continuousBody=document.querySelector('.continuous-loads-card .card-body');
    if(continuousBody&&!document.getElementById('hvacContinuousTotalRow')){
      const row=makeInlineTotal('hvacContinuousTotalRow','Total HVAC + Continuous Load','hvacContinuousService','hvacContinuousGenerator');
      continuousBody.appendChild(row);
    }
  }

  function updateTotals(){
    ensureTotals();
    const ga=generalAppliance(),hc=hvacContinuous();
    const values={generalApplianceService:ga.service,generalApplianceGenerator:ga.generator,hvacContinuousService:hc.service,hvacContinuousGenerator:hc.generator};
    Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=textNumber(value)});
  }

  function bindContinuousManaged(){
    [42,43,47].forEach(row=>{
      const check=document.getElementById('m'+row),qty=document.getElementById('mq'+row);
      if(check&&!check.dataset.continuousManagedBound){
        check.dataset.continuousManagedBound='1';
        if(row===47)check.addEventListener('click',()=>{if(typeof toggleManaged==='function')toggleManaged(row)});
      }
      if(qty&&!qty.dataset.continuousManagedBound){
        qty.dataset.continuousManagedBound='1';
        if(row===47)qty.addEventListener('click',event=>{event.stopPropagation();if(typeof reduceManagedQuantity==='function')reduceManagedQuantity(row)});
      }
    });
  }

  function printRow(label,service,generator,cls){
    return '<tr class="'+cls+'"><td><strong>'+label+'</strong></td><td></td><td class="number"><strong>'+textNumber(service)+'</strong></td><td class="number"><strong>'+textNumber(generator)+'</strong></td></tr>';
  }

  function polishPrint(){
    const report=document.getElementById('printReport');
    if(!report)return;
    const page=report.querySelector('.print-page'),table=report.querySelector('.print-table');
    if(!page||!table)return;

    const heading=page.querySelector('h1');
    if(heading)heading.innerHTML='<div class="generator-print-heading"><div class="print-brand"><span class="print-brand-main">LoadCalc</span><span class="print-brand-accent">Pro X</span></div><div class="print-title-text">Optional Method Generator Calculation Report</div></div>';

    /* The compact table already contains the final VA and amp totals. Keep the details box for unique information only. */
    const details=page.querySelector('.print-method-details');
    if(details){
      Array.from(details.children).forEach(function(item){
        const text=String(item.textContent||'').trim();
        if(/^Service Total:/i.test(text)||/^Generator Total:/i.test(text))item.remove();
      });
    }

    table.querySelectorAll('.print-general-appliance-total,.print-hvac-continuous-total').forEach(r=>r.remove());
    const ga=generalAppliance(),hc=hvacContinuous();
    const tbody=table.querySelector('tbody');
    const tfoot=table.querySelector('tfoot');
    if(tbody){
      const firstHvac=Array.from(tbody.querySelectorAll('tr')).find(function(r){
        const text=String(r.cells&&r.cells[0]?r.cells[0].textContent:'').trim();
        return /Air Conditioning|Heating|Heat Pump|Central Electric Heat|Separately Controlled/i.test(text);
      });
      const gaHtml=printRow('Total General + Appliance Load',ga.service,ga.generator,'print-general-appliance-total checkpoint-print-row');
      if(firstHvac)firstHvac.insertAdjacentHTML('beforebegin',gaHtml);else tbody.insertAdjacentHTML('beforeend',gaHtml);
    }
    if(tfoot){
      const firstFooterRow=tfoot.querySelector('tr');
      const hcHtml=printRow('Total HVAC + Continuous Load',hc.service,hc.generator,'print-hvac-continuous-total checkpoint-print-row');
      if(firstFooterRow)firstFooterRow.insertAdjacentHTML('beforebegin',hcHtml);else tfoot.insertAdjacentHTML('afterbegin',hcHtml);
    }
  }

  function installStyles(){
    if(document.getElementById('generatorFinalPolishStyles'))return;
    const s=document.createElement('style');
    s.id='generatorFinalPolishStyles';
    s.textContent=`
.checkpoint-total-row{font-weight:800!important;background:#fbfcfe!important;border-top:1px solid #94a3b8!important}
@media(max-width:899px){#hvacContinuousTotalRow{display:grid!important;grid-template-columns:1fr auto auto!important;gap:10px!important;padding:9px 0!important}}
@media print{
  .print-page{width:84%!important;margin:0 auto!important;border:.6pt solid #cbd5e1!important;padding:.14in!important;box-sizing:border-box!important}
  .print-page h1,.print-project,.print-method-details,.print-table,.print-code-note{width:100%!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}
  .print-page h1{display:block!important;margin-top:0!important;margin-bottom:7px!important;padding:0 0 7px!important;border-bottom:1px solid #777!important}
  .generator-print-heading{display:block!important}
  .print-brand{display:block!important;margin:0 0 2px!important;font-size:12px!important;line-height:1.05!important;font-weight:900!important;letter-spacing:0!important}
  .print-brand-main{color:#17377f!important}
  .print-brand-accent{color:#0f766e!important;margin-left:2px!important}
  .print-title-text{display:block!important;color:#111!important;font-size:9px!important;line-height:1.15!important;font-weight:700!important}
  .print-method-details{grid-template-columns:1fr 1fr!important}
  .print-table{table-layout:fixed!important}
  .print-table th:first-child,.print-table td:first-child{width:46%!important}
  .print-table th:nth-child(2),.print-table td:nth-child(2){width:12%!important}
  .print-table th:nth-child(3),.print-table td:nth-child(3),.print-table th:nth-child(4),.print-table td:nth-child(4){width:21%!important}
  .checkpoint-print-row td{background:#fbfcfe!important;border-top:1px solid #94a3b8!important;font-weight:800!important}
}`;
    document.head.appendChild(s);
  }

  installStyles();
  const originalCalculate=window.calculate;
  if(typeof originalCalculate==='function'&&!window.__generatorFinalPolishWrapped){
    window.calculate=function(){const result=originalCalculate.apply(this,arguments);updateTotals();return result};
    window.__generatorFinalPolishWrapped=true;
  }

  window.printCalculation=function(){
    if(typeof window.calculate==='function')window.calculate();
    updateTotals();
    polishPrint();
    window.print();
  };

  function init(){bindContinuousManaged();ensureTotals();updateTotals();setTimeout(()=>{bindContinuousManaged();updateTotals()},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
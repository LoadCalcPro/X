/* LoadCalcPro X Generator runtime stability layer.
   Replaces the old cooling-managed patch at runtime without self-observing DOM loops. */
(function(){
  'use strict';

  const METHODS_KEY='loadcalcpro_hvac_selected_methods_v1';
  const DATA_KEY='loadcalcpro_hvac_method_sections_v57';
  const MANAGED_KEY='loadcalcpro_hvac_method_managed_v57';
  const COUNT_KEY='loadcalcpro_hvac_visible_system_counts_v522';
  const HP_SYSTEM_KEY='loadcalcpro_hvac_heatpump_answers_v543';
  const LEGACY_HP_KEY='loadcalcpro_hvac_multi_hp_answer_v1';

  function readJSON(key,fallback){
    try{
      const value=JSON.parse(localStorage.getItem(key)||'');
      return value&&typeof value==='object'?value:fallback;
    }catch(e){return fallback;}
  }

  function selected(){
    const value=readJSON(METHODS_KEY,[]);
    return Array.isArray(value)?value.filter(m=>['central65','separate40','heatpump'].includes(m)):[];
  }
  function count(method){
    const counts=readJSON(COUNT_KEY,{});
    return Math.max(1,Math.min(3,Math.floor(Number(counts[method])||1)));
  }
  function typeFor(kind,index){return kind+(index===1?'':index);}
  function key(method,type){return method+'_'+type;}
  function item(method,type){return readJSON(DATA_KEY,{})[key(method,type)]||{};}
  function qty(method,type){return Math.max(0,Math.floor(Number(item(method,type).qty)||0));}
  function va(method,type){return Math.max(0,Number(item(method,type).va)||0);}
  function total(method,type){return qty(method,type)*va(method,type);}
  function managedQty(method,type){
    const q=qty(method,type);
    const raw=readJSON(MANAGED_KEY,{})[key(method,type)];
    const n=raw===true?q:Math.floor(Number(raw)||0);
    return Math.max(0,Math.min(q,n));
  }
  function remaining(method,type){return Math.max(qty(method,type)-managedQty(method,type),0)*va(method,type);}
  function aggregate(method,kind,generator){
    let value=0;
    for(let i=1;i<=count(method);i++) value+=(generator?remaining:total)(method,typeFor(kind,i));
    return value;
  }
  function heatFactor(method){
    if(method!=='separate40')return .65;
    let units=0;
    for(let i=1;i<=count(method);i++)units+=qty(method,typeFor('heat',i));
    return units>=4?.40:.65;
  }
  function hpAnswer(index){
    const answers=readJSON(HP_SYSTEM_KEY,{});
    return answers[String(index)]||'';
  }
  function heatPumpResult(generator){
    const result={total:0,c:0,h:0};
    for(let i=1;i<=count('heatpump');i++){
      const ac=typeFor('ac',i),heat=typeFor('heat',i);
      const serviceC=total('heatpump',ac);
      const serviceH=total('heatpump',heat)*.65;
      const c=(generator?remaining:total)('heatpump',ac);
      const h=(generator?remaining:total)('heatpump',heat)*.65;
      const answer=hpAnswer(i);
      if(answer==='yes'){
        result.total+=c+h; result.c+=c; result.h+=h;
      }else if(answer==='no'){
        if(serviceC>=serviceH){result.total+=c;result.c+=c;}
        else{result.total+=h;result.h+=h;}
      }
    }
    return result;
  }
  function normalResult(method,generator){
    const factor=heatFactor(method);
    const serviceC=aggregate(method,'ac',false);
    const serviceH=aggregate(method,'heat',false)*factor;
    const c=aggregate(method,'ac',generator);
    const h=aggregate(method,'heat',generator)*factor;
    return serviceC>=serviceH?{total:c,c:c,h:0}:{total:h,c:0,h:h};
  }

  const originalHvac=window.hvacLoadCalculation;
  if(typeof originalHvac==='function'&&!window.__generatorStableHvac){
    window.hvacLoadCalculation=function(){
      originalHvac.apply(this,arguments);
      let service=0,generator=0,serviceAC=0,generatorAC=0,serviceHeating=0,generatorHeating=0;
      selected().forEach(method=>{
        const s=method==='heatpump'?heatPumpResult(false):normalResult(method,false);
        const g=method==='heatpump'?heatPumpResult(true):normalResult(method,true);
        service+=s.total; generator+=g.total;
        serviceAC+=s.c; generatorAC+=g.c;
        serviceHeating+=s.h; generatorHeating+=g.h;
      });
      if(typeof setOutput==='function'){
        setOutput('e37',serviceAC); setOutput('e38',serviceHeating);
        setOutput('f37',generatorAC); setOutput('f38',generatorHeating);
      }
      return {service,generator,serviceAC,generatorAC,serviceHeating,generatorHeating,method:selected().join(','),multipleHeatTypes:selected().length>1};
    };
    window.__generatorStableHvac=true;
  }

  function readAnswers(){return readJSON(HP_SYSTEM_KEY,{});}
  function writeAnswers(value){
    try{
      localStorage.setItem(HP_SYSTEM_KEY,JSON.stringify(value));
      localStorage.setItem(LEGACY_HP_KEY,'yes');
    }catch(e){}
  }
  function refreshQuestion(index){
    const answers=readAnswers(),current=answers[String(index)]||'';
    document.querySelectorAll('.v543-hp-option[data-v543-hp-index="'+index+'"]').forEach(button=>{
      const chosen=button.dataset.v543HpAnswer===current;
      button.classList.toggle('selected',chosen);
      const mark=button.querySelector('.v543-hp-check');
      if(mark)mark.textContent=chosen?'✓':'';
    });
  }
  document.addEventListener('click',function(event){
    const button=event.target.closest('.v543-hp-option');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const index=String(button.dataset.v543HpIndex||'');
    const answer=String(button.dataset.v543HpAnswer||'');
    if(!index||(answer!=='yes'&&answer!=='no'))return;
    const answers=readAnswers();
    if(answers[index]===answer)delete answers[index]; else answers[index]=answer;
    writeAnswers(answers);
    refreshQuestion(index);
    if(typeof window.calculate==='function')window.calculate();
  },true);

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
  function textNumber(value){
    const n=Math.round(Number(value)||0);
    return n>0?n.toLocaleString('en-US'):'';
  }
  function generalAppliance(){
    const general=(Math.max(inputNumber('q5'),0)*3)+(Math.max(Math.floor(inputNumber('q6')),0)*1500)+(Math.max(Math.floor(inputNumber('q7')),0)*1500);
    let serviceAppliances=0,generatorAppliances=0;
    for(let row=10;row<=30;row++){
      serviceAppliances+=numberFrom('e'+row);
      generatorAppliances+=numberFrom('f'+row);
    }
    return {service:general+serviceAppliances,generator:general+generatorAppliances};
  }
  function hvacContinuous(){
    return {service:numberFrom('e44')+numberFrom('e45'),generator:numberFrom('f44')+numberFrom('f45')};
  }
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
      if(first)demandBody.insertBefore(row,first); else demandBody.appendChild(row);
    }
    const continuousBody=document.querySelector('.continuous-loads-card .card-body');
    if(continuousBody&&!document.getElementById('hvacContinuousTotalRow')){
      continuousBody.appendChild(makeInlineTotal('hvacContinuousTotalRow','Total HVAC + Continuous Load','hvacContinuousService','hvacContinuousGenerator'));
    }
  }
  function updateTotals(){
    ensureTotals();
    const ga=generalAppliance(),hc=hvacContinuous();
    const values={generalApplianceService:ga.service,generalApplianceGenerator:ga.generator,hvacContinuousService:hc.service,hvacContinuousGenerator:hc.generator};
    Object.entries(values).forEach(([id,value])=>{
      const el=document.getElementById(id);
      const next=textNumber(value);
      if(el&&el.textContent!==next)el.textContent=next;
    });
  }

  function makeSummaryRow(label,id,suffix){
    const row=document.createElement('div');
    row.className='calculation-summary-row';
    row.innerHTML='<span>'+label+'</span><span><span id="'+id+'"></span>'+suffix+'</span>';
    return row;
  }
  function ensureSummary(){
    if(document.getElementById('calculationFinalSummary'))return;
    const q42=document.getElementById('q42');
    const additionalRow=q42?q42.closest('.load-row'):null;
    if(!additionalRow)return;
    const summary=document.createElement('div');
    summary.id='calculationFinalSummary';
    summary.className='calculation-summary';
    summary.appendChild(makeSummaryRow('Service Load:','calcSummaryServiceVA',' VA'));
    summary.appendChild(makeSummaryRow('Generator Load:','calcSummaryGeneratorVA',' VA'));
    summary.appendChild(makeSummaryRow('Managed Quantity:','calcSummaryManaged',''));
    additionalRow.insertAdjacentElement('afterend',summary);
  }
  function syncSummaryValues(){
    ensureSummary();
    const pairs=[
      ['serviceTotalVAView','calcSummaryServiceVA'],
      ['generatorTotalVAView','calcSummaryGeneratorVA'],
      ['bottomManagedLoadCount','calcSummaryManaged']
    ];
    pairs.forEach(([sourceId,targetId])=>{
      const source=document.getElementById(sourceId),target=document.getElementById(targetId);
      if(!source||!target)return;
      let next=String(source.textContent||'').trim();
      if(sourceId==='bottomManagedLoadCount'){
        const n=Math.max(0,Math.floor(Number(next.replace(/[^0-9.-]/g,''))||0));
        next=n>0?String(n):'';
      }
      if(target.textContent!==next)target.textContent=next;
    });
  }

  function bindContinuousManaged(){
    [42,43,47].forEach(row=>{
      const check=document.getElementById('m'+row),qtyButton=document.getElementById('mq'+row);
      if(check&&!check.dataset.continuousManagedBound){
        check.dataset.continuousManagedBound='1';
        if(row===47)check.addEventListener('click',()=>{if(typeof toggleManaged==='function')toggleManaged(row);});
      }
      if(qtyButton&&!qtyButton.dataset.continuousManagedBound){
        qtyButton.dataset.continuousManagedBound='1';
        if(row===47)qtyButton.addEventListener('click',event=>{event.stopPropagation();if(typeof reduceManagedQuantity==='function')reduceManagedQuantity(row);});
      }
    });
  }

  function installStyles(){
    if(document.getElementById('generatorStableRuntimeStyles'))return;
    const s=document.createElement('style');
    s.id='generatorStableRuntimeStyles';
    s.textContent='.checkpoint-total-row{font-weight:700!important;background:#fbfcfe!important;border-top:1px solid #94a3b8!important}@media(max-width:899px){#hvacContinuousTotalRow{display:grid!important;grid-template-columns:1fr auto auto!important;gap:10px!important;padding:9px 0!important}}';
    document.head.appendChild(s);
  }

  function syncDerivedUI(){
    updateTotals();
    syncSummaryValues();
  }

  const originalCalculate=window.calculate;
  if(typeof originalCalculate==='function'&&!window.__generatorStableCalculate){
    window.calculate=function(){
      const result=originalCalculate.apply(this,arguments);
      syncDerivedUI();
      return result;
    };
    window.__generatorStableCalculate=true;
  }

  function init(){
    installStyles();
    bindContinuousManaged();
    ensureTotals();
    ensureSummary();
    syncDerivedUI();
    setTimeout(function(){bindContinuousManaged();syncDerivedUI();},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

(function(){
  'use strict';

  const MOTOR_STORAGE_KEY='loadCalcProAicMotorContributionV1';
  const frame=document.getElementById('aicFrame');
  if(!frame)return;

  /* NEC Table 430.248 — single-phase AC motors. The 230 V column is used for 220–240 V systems. */
  const singlePhaseFLC={
    '208':{
      '0.1667':2.4,'0.25':3.2,'0.3333':4.0,'0.5':5.4,'0.75':7.6,'1':8.8,
      '1.5':11.0,'2':13.2,'3':18.7,'5':30.8,'7.5':44.0,'10':55.0
    },
    '240':{
      '0.1667':2.2,'0.25':2.9,'0.3333':3.6,'0.5':4.9,'0.75':6.9,'1':8.0,
      '1.5':10.0,'2':12.0,'3':17.0,'5':28.0,'7.5':40.0,'10':50.0
    }
  };

  /* NEC Table 430.250 — induction-type squirrel-cage and wound-rotor three-phase AC motors.
     240 V systems use the 230 V column and 480 V systems use the 460 V column. */
  const threePhaseFLC={
    '208':{
      '0.5':2.4,'0.75':3.5,'1':4.6,'1.5':6.6,'2':7.5,'3':10.6,'5':16.7,'7.5':24.2,
      '10':30.8,'15':46.2,'20':59.4,'25':74.8,'30':88,'40':114,'50':143,'60':169,
      '75':211,'100':273,'125':343,'150':396,'200':528
    },
    '240':{
      '0.5':2.2,'0.75':3.2,'1':4.2,'1.5':6.0,'2':6.8,'3':9.6,'5':15.2,'7.5':22,
      '10':28,'15':42,'20':54,'25':68,'30':80,'40':104,'50':130,'60':154,
      '75':192,'100':248,'125':312,'150':360,'200':480
    },
    '480':{
      '0.5':1.1,'0.75':1.6,'1':2.1,'1.5':3.0,'2':3.4,'3':4.8,'5':7.6,'7.5':11,
      '10':14,'15':21,'20':27,'25':34,'30':40,'40':52,'50':65,'60':77,'75':96,
      '100':124,'125':156,'150':180,'200':240,'250':302,'300':361,'350':414,
      '400':477,'450':515,'500':590
    }
  };

  const hpLabels={
    '0.1667':'1/6','0.25':'1/4','0.3333':'1/3','0.5':'1/2','0.75':'3/4','1':'1',
    '1.5':'1 1/2','2':'2','3':'3','5':'5','7.5':'7 1/2','10':'10','15':'15','20':'20',
    '25':'25','30':'30','40':'40','50':'50','60':'60','75':'75','100':'100','125':'125',
    '150':'150','200':'200','250':'250','300':'300','350':'350','400':'400','450':'450','500':'500'
  };

  function innerDoc(){
    try{return frame.contentDocument||frame.contentWindow.document}catch(e){return null}
  }
  function innerWin(){
    try{return frame.contentWindow}catch(e){return null}
  }
  function panelNumber(card,index){
    return Number(card.dataset.panelIndex||card.dataset.calc||index+1)||index+1;
  }
  function loadState(){
    try{return JSON.parse(localStorage.getItem(MOTOR_STORAGE_KEY)||'{}')||{}}catch(e){return{}}
  }
  function saveState(state){
    try{localStorage.setItem(MOTOR_STORAGE_KEY,JSON.stringify(state))}catch(e){}
  }
  function clearAllMotorState(){
    try{localStorage.removeItem(MOTOR_STORAGE_KEY)}catch(e){}
  }
  function blankRow(){
    return {phase:'',voltage:'',hp:'',quantity:'1',factor:'4',customFactor:''};
  }
  function getPanelState(n){
    const state=loadState();
    const saved=state[String(n)];
    if(!saved)return {enabled:false,rows:[]};
    return {
      enabled:saved.enabled===true,
      rows:Array.isArray(saved.rows)&&saved.rows.length?saved.rows:[blankRow()]
    };
  }
  function setPanelState(n,panelState){
    const state=loadState();
    state[String(n)]=panelState;
    saveState(state);
  }
  function removePanelState(n){
    const state=loadState();
    delete state[String(n)];
    saveState(state);
  }
  function flcTable(phase){return phase==='single'?singlePhaseFLC:phase==='three'?threePhaseFLC:null}
  function flcValue(row){
    const table=flcTable(row.phase);
    if(!table||!table[row.voltage])return null;
    const value=table[row.voltage][row.hp];
    return Number.isFinite(value)?value:null;
  }
  function factorValue(row){
    if(row.factor==='custom'){
      const v=Number(row.customFactor);
      return Number.isFinite(v)&&v>0?v:null;
    }
    const v=Number(row.factor);
    return Number.isFinite(v)&&v>0?v:null;
  }
  function rowContribution(row){
    const flc=flcValue(row);
    const qty=Number(row.quantity);
    const factor=factorValue(row);
    if(!Number.isFinite(flc)||!Number.isFinite(qty)||qty<1||!Number.isFinite(factor))return null;
    return flc*qty*factor;
  }
  function panelContribution(n){
    const p=getPanelState(n);
    if(!p.enabled)return 0;
    return p.rows.reduce((sum,row)=>{
      const contribution=rowContribution(row);
      return sum+(Number.isFinite(contribution)?contribution:0);
    },0);
  }
  function formatNumber(value,digits){
    return Number.isFinite(value)?value.toLocaleString(undefined,{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
  }
  function voltageOptions(phase,current){
    const values=phase==='single'?['208','240']:phase==='three'?['208','240','480']:[];
    return '<option value="">Select voltage</option>'+values.map(v=>`<option value="${v}"${v===current?' selected':''}>${v} V</option>`).join('');
  }
  function hpOptions(row){
    const table=flcTable(row.phase);
    const values=table&&table[row.voltage]?Object.keys(table[row.voltage]):[];
    return '<option value="">Select horsepower</option>'+values.map(v=>`<option value="${v}"${v===row.hp?' selected':''}>${hpLabels[v]||v} HP</option>`).join('');
  }
  function motorStyles(d){
    let style=d.getElementById('loadCalcProMotorStyles');
    if(style)return;
    style=d.createElement('style');
    style.id='loadCalcProMotorStyles';
    style.textContent=`
      @media screen{
        .motor-contribution-wrap{margin-top:14px;padding-top:13px;border-top:1px solid #dbe3ec}
        .motor-add-toggle{background:#fff!important;color:#1e3a8a!important;border:1px solid #1e3a8a!important;padding:9px 13px!important}
        .motor-contribution-panel{margin-top:10px;padding:14px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc}
        .motor-panel-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}
        .motor-panel-title{font-size:15px;font-weight:800;color:#17365d}
        .motor-panel-note{margin-top:3px;color:#64748b;font-size:12px;font-weight:500}
        .motor-row{padding:12px 0;border-top:1px solid #e2e8f0}
        .motor-row:first-of-type{border-top:0;padding-top:0}
        .motor-row-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;align-items:end}
        .motor-field label{display:block;margin:0 0 5px;color:#475569;font-size:12px;font-weight:700}
        .motor-field input,.motor-field select{min-height:40px;padding:7px 8px;font-size:13px}
        .motor-readout{min-height:40px;display:flex;align-items:center;padding:7px 8px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;font-weight:700;color:#0f172a}
        .motor-custom-factor{margin-top:6px}
        .motor-row-actions{display:flex;justify-content:flex-end;margin-top:8px}
        .motor-row-actions button,.motor-footer button,.motor-panel-header button{min-height:36px;padding:7px 10px;font-size:12px;border-radius:8px}
        .motor-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0}
        .motor-total{font-size:13px;font-weight:800;color:#0f3557}
        .motor-calc-summary{margin-top:8px;padding-top:7px;border-top:1px solid #cbd5e1;color:#0f3557;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800}
        @media(max-width:850px){.motor-row-grid{grid-template-columns:1fr 1fr 1fr}}
        @media(max-width:560px){.motor-row-grid{grid-template-columns:1fr 1fr}.motor-panel-header,.motor-footer{align-items:flex-start;flex-direction:column}}
      }
      @media print{.motor-contribution-wrap,.motor-calc-summary{display:none!important}}
    `;
    d.head.appendChild(style);
  }
  function readRowFromDom(rowEl){
    return {
      phase:rowEl.querySelector('[data-motor-field="phase"]')?.value||'',
      voltage:rowEl.querySelector('[data-motor-field="voltage"]')?.value||'',
      hp:rowEl.querySelector('[data-motor-field="hp"]')?.value||'',
      quantity:rowEl.querySelector('[data-motor-field="quantity"]')?.value||'1',
      factor:rowEl.querySelector('[data-motor-field="factor"]')?.value||'4',
      customFactor:rowEl.querySelector('[data-motor-field="customFactor"]')?.value||''
    };
  }
  function readPanelFromDom(panel){
    return {
      enabled:true,
      rows:Array.from(panel.querySelectorAll('.motor-row')).map(readRowFromDom)
    };
  }
  function updateRowDisplays(rowEl,row){
    const voltage=rowEl.querySelector('[data-motor-field="voltage"]');
    const hp=rowEl.querySelector('[data-motor-field="hp"]');
    const custom=rowEl.querySelector('.motor-custom-factor');
    if(voltage)voltage.innerHTML=voltageOptions(row.phase,row.voltage);
    if(hp)hp.innerHTML=hpOptions(row);
    if(custom)custom.style.display=row.factor==='custom'?'block':'none';
    const flc=flcValue(row);
    const contribution=rowContribution(row);
    const flcNode=rowEl.querySelector('[data-motor-readout="flc"]');
    const contributionNode=rowEl.querySelector('[data-motor-readout="contribution"]');
    if(flcNode)flcNode.textContent=Number.isFinite(flc)?formatNumber(flc,1)+' A':'—';
    if(contributionNode)contributionNode.textContent=Number.isFinite(contribution)?formatNumber(contribution,0)+' A':'—';
  }
  function buildMotorRow(d,row,index){
    const rowEl=d.createElement('div');
    rowEl.className='motor-row';
    rowEl.dataset.motorIndex=String(index);
    rowEl.innerHTML=`
      <div class="motor-row-grid">
        <div class="motor-field"><label>Phase</label><select data-motor-field="phase"><option value="">Select phase</option><option value="single"${row.phase==='single'?' selected':''}>Single phase</option><option value="three"${row.phase==='three'?' selected':''}>Three phase</option></select></div>
        <div class="motor-field"><label>Voltage</label><select data-motor-field="voltage"></select></div>
        <div class="motor-field"><label>Horsepower</label><select data-motor-field="hp"></select></div>
        <div class="motor-field"><label>Quantity</label><input data-motor-field="quantity" type="number" min="1" step="1" value="${row.quantity||'1'}"></div>
        <div class="motor-field"><label>Contribution Factor</label><select data-motor-field="factor"><option value="4"${row.factor==='4'?' selected':''}>4 × FLC</option><option value="5"${row.factor==='5'?' selected':''}>5 × FLC</option><option value="6"${row.factor==='6'?' selected':''}>6 × FLC</option><option value="custom"${row.factor==='custom'?' selected':''}>Custom</option></select><input class="motor-custom-factor" data-motor-field="customFactor" type="number" min="0.1" step="0.1" placeholder="Custom factor" value="${row.customFactor||''}"></div>
        <div class="motor-field"><label>NEC Table FLC</label><div class="motor-readout" data-motor-readout="flc">—</div></div>
      </div>
      <div class="motor-row-grid" style="margin-top:9px">
        <div class="motor-field" style="grid-column:1/-1"><label>Calculated Motor Contribution</label><div class="motor-readout" data-motor-readout="contribution">—</div></div>
      </div>
      <div class="motor-row-actions"><button type="button" class="secondary motor-remove-row">Remove Motor</button></div>
    `;
    updateRowDisplays(rowEl,row);
    return rowEl;
  }
  function updatePanelTotal(panel,n){
    const total=panelContribution(n);
    const node=panel.querySelector('.motor-total');
    if(node)node.textContent='Total Motor Contribution: '+formatNumber(total,0)+' A';
  }
  function renderMotorPanel(card,n,panelState){
    const d=innerDoc();
    let wrap=card.querySelector('.motor-contribution-wrap');
    if(!wrap){
      wrap=d.createElement('div');
      wrap.className='motor-contribution-wrap no-print';
      const buttons=card.querySelector('.button-row');
      card.insertBefore(wrap,buttons||null);
    }
    wrap.innerHTML='';
    if(!panelState.enabled){
      const button=d.createElement('button');
      button.type='button';
      button.className='secondary motor-add-toggle';
      button.textContent='+ Add Motor Contribution';
      button.addEventListener('click',()=>{
        const next={enabled:true,rows:[blankRow()]};
        setPanelState(n,next);
        renderMotorPanel(card,n,next);
        recalculate(n);
        resizeParent();
      });
      wrap.appendChild(button);
      return;
    }

    const panel=d.createElement('div');
    panel.className='motor-contribution-panel';
    panel.innerHTML=`
      <div class="motor-panel-header">
        <div><div class="motor-panel-title">Motor Contribution</div><div class="motor-panel-note">FLC is looked up from NEC Table 430.248 (single phase) or the induction-motor portion of Table 430.250 (three phase).</div></div>
        <button type="button" class="secondary motor-remove-section">Remove Section</button>
      </div>
      <div class="motor-rows"></div>
      <div class="motor-footer"><button type="button" class="secondary motor-add-row">+ Add Another Motor</button><div class="motor-total">Total Motor Contribution: 0 A</div></div>
    `;
    const rows=panel.querySelector('.motor-rows');
    const sourceRows=panelState.rows.length?panelState.rows:[blankRow()];
    sourceRows.forEach((row,index)=>rows.appendChild(buildMotorRow(d,row,index)));
    wrap.appendChild(panel);
    updatePanelTotal(panel,n);

    panel.addEventListener('change',event=>handleMotorInput(event,card,panel,n));
    panel.addEventListener('input',event=>handleMotorInput(event,card,panel,n));
    panel.querySelector('.motor-add-row').addEventListener('click',()=>{
      const current=readPanelFromDom(panel);
      current.rows.push(blankRow());
      setPanelState(n,current);
      renderMotorPanel(card,n,current);
      recalculate(n);
      resizeParent();
    });
    panel.querySelector('.motor-remove-section').addEventListener('click',()=>{
      removePanelState(n);
      renderMotorPanel(card,n,{enabled:false,rows:[]});
      recalculate(n);
      resizeParent();
    });
    panel.querySelectorAll('.motor-remove-row').forEach((button,index)=>button.addEventListener('click',()=>{
      const current=readPanelFromDom(panel);
      current.rows.splice(index,1);
      if(!current.rows.length)current.rows.push(blankRow());
      setPanelState(n,current);
      renderMotorPanel(card,n,current);
      recalculate(n);
      resizeParent();
    }));
  }
  function handleMotorInput(event,card,panel,n){
    const rowEl=event.target.closest('.motor-row');
    if(!rowEl)return;
    let row=readRowFromDom(rowEl);
    if(event.target.matches('[data-motor-field="phase"]')){
      row.voltage='';row.hp='';
      const voltage=rowEl.querySelector('[data-motor-field="voltage"]');
      if(voltage)voltage.value='';
    }
    if(event.target.matches('[data-motor-field="voltage"]')){
      row.hp='';
      const hp=rowEl.querySelector('[data-motor-field="hp"]');
      if(hp)hp.value='';
    }
    updateRowDisplays(rowEl,row);
    const current=readPanelFromDom(panel);
    setPanelState(n,current);
    updatePanelTotal(panel,n);
    recalculate(n);
    resizeParent();
  }
  function recalculate(n){
    const w=innerWin();
    if(w&&typeof w.calculate==='function'){
      try{w.calculate(n)}catch(e){}
    }
  }
  function resizeParent(){
    try{window.dispatchEvent(new Event('resize'))}catch(e){}
  }
  function applyMotorToCalculatedResult(w,d,n){
    const result=d.getElementById('aicResult'+(n===1?'':n));
    const details=d.getElementById('calcDetails'+(n===1?'':n));
    if(!result||!details)return;
    details.querySelector('.motor-calc-summary')?.remove();
    const baseText=String(result.textContent||'').replace(/,/g,'').trim();
    const base=Number(baseText);
    if(!Number.isFinite(base))return;
    const contribution=panelContribution(n);
    const total=base+contribution;
    result.textContent=Math.round(total).toLocaleString();
    if(contribution>0){
      const summary=d.createElement('div');
      summary.className='motor-calc-summary';
      summary.textContent='Base AIC '+Math.round(base).toLocaleString()+' A + Motor Contribution '+Math.round(contribution).toLocaleString()+' A = Total AIC '+Math.round(total).toLocaleString()+' A';
      details.appendChild(summary);
    }
    if(n===1){
      const next=d.getElementById('utilityFault2');
      if(next){
        next.dataset.userEdited='false';
        next.value=Math.round(total).toString();
        if(typeof w.calculate==='function')w.calculate(2);
      }
    }
  }
  function installCalculationWrapper(){
    const w=innerWin(),d=innerDoc();
    if(!w||!d||w.__loadCalcProMotorWrapped||typeof w.calculate!=='function')return;
    const original=w.calculate;
    let active=false;
    w.calculate=function(n){
      if(active)return original.call(w,n);
      active=true;
      try{
        original.call(w,n);
        applyMotorToCalculatedResult(w,d,n);
      }finally{active=false}
    };
    w.__loadCalcProMotorWrapped=true;
  }
  function installMotorSections(){
    const d=innerDoc();if(!d)return;
    motorStyles(d);
    const state=loadState();
    Array.from(d.querySelectorAll('#calculationsContainer > .card')).forEach((card,index)=>{
      const n=panelNumber(card,index);
      const saved=state[String(n)];
      const panelState=saved?getPanelState(n):{enabled:false,rows:[]};
      if(!card.querySelector('.motor-contribution-wrap'))renderMotorPanel(card,n,panelState);
    });
  }
  function installResetHooks(){
    const d=innerDoc();if(!d||d.__loadCalcProMotorResetHook)return;
    d.__loadCalcProMotorResetHook=true;
    d.addEventListener('click',event=>{
      const reset=event.target.closest('#resetBtn,[data-reset]');
      if(reset){
        const card=reset.closest('.card');
        if(card){
          const index=Array.from(d.querySelectorAll('#calculationsContainer > .card')).indexOf(card);
          const n=panelNumber(card,index);
          setTimeout(()=>{
            removePanelState(n);
            renderMotorPanel(card,n,{enabled:false,rows:[]});
            recalculate(n);
            resizeParent();
          },0);
        }
      }
      if(event.target.closest('#startNewBtn')){
        clearAllMotorState();
        setTimeout(()=>{installMotorSections();recalculate(1);resizeParent()},0);
      }
    },true);
  }
  function install(){
    const d=innerDoc();
    if(!d)return;
    installCalculationWrapper();
    installMotorSections();
    installResetHooks();
    try{
      const w=innerWin();
      if(w&&typeof w.calculate==='function'){
        Array.from(d.querySelectorAll('#calculationsContainer > .card')).forEach((card,index)=>w.calculate(panelNumber(card,index)));
      }
    }catch(e){}
    resizeParent();
  }

  frame.addEventListener('load',()=>{
    install();
    setTimeout(install,150);
    setTimeout(install,650);
    const d=innerDoc();
    if(d){
      d.addEventListener('click',()=>setTimeout(install,40),true);
    }
  });

  document.getElementById('newCalculationBtn')?.addEventListener('click',()=>{
    clearAllMotorState();
    setTimeout(install,40);
  },true);

  try{
    const d=innerDoc();
    if(d&&d.readyState==='complete')install();
  }catch(e){}
})();

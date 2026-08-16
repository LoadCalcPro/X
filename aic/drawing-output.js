(function(){
  'use strict';

  const frame=document.getElementById('aicFrame');
  const layout=document.getElementById('outerPrintLayout');
  const STORAGE_KEY='loadCalcProAicCalculatorExpandablePanels';
  if(!frame||!layout)return;

  function innerDoc(){try{return frame.contentDocument||frame.contentWindow.document}catch(e){return null}}
  function innerWin(){try{return frame.contentWindow}catch(e){return null}}
  function cards(){const d=innerDoc();return d?Array.from(d.querySelectorAll('#calculationsContainer > .card')):[]}

  function ensureCalculationOnlyOption(){
    if(Array.from(layout.options).some(o=>o.value==='calculation'))return;
    const option=document.createElement('option');
    option.value='calculation';
    option.textContent='Calculation Only';
    layout.appendChild(option);
  }

  function savedPanelCount(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      const count=Number(saved&&saved.panelCount);
      return Number.isFinite(count)&&count>0?count:1;
    }catch(e){return 1}
  }

  function ensureOneInitialPanel(){
    if(savedPanelCount()>1)return;
    const d=innerDoc(),w=innerWin();
    if(!d||!w)return;
    const current=cards();
    while(current.length>1)current.pop().remove();
    try{if(typeof w.updatePanelControls==='function')w.updatePanelControls()}catch(e){}
  }

  function clampOuterScroll(){
    const top=frame.getBoundingClientRect().top+window.scrollY;
    const bottom=top+frame.offsetHeight;
    const maxScroll=Math.max(0,bottom-window.innerHeight+12);
    if(window.scrollY>maxScroll)window.scrollTo({top:maxScroll,left:0,behavior:'auto'});
  }

  function resizeTight(clamp=false){
    const d=innerDoc();
    if(!d)return;
    frame.style.height='1px';
    requestAnimationFrame(()=>{
      const b=d.body,h=d.documentElement;
      const height=Math.max(b?b.scrollHeight:0,b?b.offsetHeight:0,h?h.scrollHeight:0,h?h.offsetHeight:0,1);
      frame.style.height=(height+4)+'px';
      if(clamp)requestAnimationFrame(clampOuterScroll);
    });
  }

  function installPrintStyles(d){
    let style=d.getElementById('drawingReadyAicPrintStyles');
    if(!style){style=d.createElement('style');style.id='drawingReadyAicPrintStyles';d.head.appendChild(style)}
    style.textContent=`
      @media print{
        .drawing-calculation-title{display:block!important;margin:0 0 7px!important;padding:0 0 5px!important;border-bottom:1px solid #777!important;font:800 11px/1.2 Arial,Helvetica,sans-serif!important;letter-spacing:.02em!important;text-transform:uppercase!important;color:#111!important}
        .print-page.calculation-only .print-page-header{display:none!important}
        .print-page.calculation-only .print-report-card{border:1px solid #777!important}
      }
    `;
  }

  function identifyCalculationBlocks(d,generic){
    d.querySelectorAll('#printPages .print-report-card').forEach(card=>{
      const report=card.querySelector('.clean-print-report');
      if(report&&!report.querySelector('.drawing-calculation-title')){
        const title=d.createElement('div');
        title.className='drawing-calculation-title';
        title.textContent='Available Fault Current Calculation';
        report.insertBefore(title,report.firstChild);
      }
    });
    d.querySelectorAll('#printPages .print-page').forEach(page=>page.classList.toggle('calculation-only',generic));
  }

  function installDrawingPrint(){
    const d=innerDoc(),w=innerWin();
    if(!d||!w)return;
    installPrintStyles(d);
    if(w.__drawingReadyAicPrintInstalled)return;
    w.__drawingReadyAicPrintInstalled=true;
    const original=w.preparePrint;
    w.preparePrint=function(){
      const selected=layout.value||'full';
      const generic=selected==='calculation';
      if(typeof w.buildCleanPrintReports==='function'&&typeof w.createPrintPages==='function'){
        w.buildCleanPrintReports();
        const count=w.createPrintPages(generic?'full':selected);
        if(!count){w.alert('Enter calculation information before printing.');return}
        identifyCalculationBlocks(d,generic);
        w.print();
        return;
      }
      if(typeof original==='function')return original.apply(w,arguments);
    };
  }

  function installRemovalCollapse(){
    const d=innerDoc();
    if(!d||d.__aicPanelCollapseInstalled)return;
    d.__aicPanelCollapseInstalled=true;
    d.addEventListener('click',event=>{
      if(event.target.closest('#removePanelBtn')){
        setTimeout(()=>resizeTight(true),0);
        setTimeout(()=>resizeTight(true),80);
      }
    },true);
    const container=d.getElementById('calculationsContainer');
    if(container&&window.MutationObserver){
      new MutationObserver(()=>setTimeout(()=>resizeTight(false),0)).observe(container,{childList:true});
    }
  }

  function install(){
    ensureCalculationOnlyOption();
    ensureOneInitialPanel();
    installDrawingPrint();
    installRemovalCollapse();
    resizeTight(false);
  }

  frame.addEventListener('load',()=>{
    install();
    setTimeout(install,150);
    setTimeout(install,700);
  });
  layout.addEventListener('change',()=>setTimeout(installDrawingPrint,0));
  ensureCalculationOnlyOption();
  try{if(innerDoc()?.readyState==='complete')install()}catch(e){}
})();

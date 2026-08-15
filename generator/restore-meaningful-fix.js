(function(){
'use strict';

function nonBlank(value){
  return String(value === null || value === undefined ? '' : value).trim() !== '';
}

function positiveOrText(value){
  const text=String(value === null || value === undefined ? '' : value).trim();
  if(!text)return false;
  const number=Number(text);
  return Number.isFinite(number) ? number > 0 : true;
}

function hasMeaningfulHvacData(){
  try{
    const raw=localStorage.getItem('loadcalcpro_hvac_method_sections_v57');
    if(!raw)return false;
    const data=JSON.parse(raw);
    if(!data || typeof data!=='object')return false;
    return Object.values(data).some(function(item){
      if(!item || typeof item!=='object')return false;
      return positiveOrText(item.qty) || positiveOrText(item.va);
    });
  }catch(e){
    return false;
  }
}

window.hasSavedCalculation=function(){
  const data=(typeof savedState==='function') ? savedState() : null;
  if(!data)return false;

  const project=Object.values(data.project || {}).some(nonBlank);

  const inputs=Object.entries(data.inputs || {}).some(function(entry){
    const id=entry[0];
    const value=entry[1];
    if(id==='q46')return false;
    return positiveOrText(value);
  });

  const motor=data.largestMotor || {};
  const largestMotor=
    motor.included === true ||
    positiveOrText(motor.va) ||
    nonBlank(motor.type);

  const managed=Object.values(data.managedQuantities || {}).some(function(value){
    return Number(value) > 0;
  });

  const meaningful=project || inputs || largestMotor || managed || hasMeaningfulHvacData();

  if(!meaningful){
    try{
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MANAGED_QTY_STORAGE_KEY);
    }catch(e){}
  }

  return meaningful;
};
})();

/* EV charger behavior: quantity alone does not create a load. Apply the 7,200 VA minimum only after a nameplate value is entered. */
(function(){
  'use strict';

  window.rowVA=function(row){
    const quantity=(typeof positiveQuantity==='function')
      ? positiveQuantity('q'+row)
      : Math.max(0,Math.floor(Number(document.getElementById('q'+row)?.value)||0));

    const enteredVA=(typeof numberValue==='function')
      ? numberValue('v'+row)
      : Math.max(0,Number(document.getElementById('v'+row)?.value)||0);

    if(row===43){
      if(quantity<1 || enteredVA<=0){
        return 0;
      }
      return quantity*Math.max(enteredVA,7200);
    }

    return quantity*enteredVA;
  };
})();

/* Generator print report cleanup: unified header, checkpoint totals, compact footer, and matching report width. */
(function(){
  'use strict';

  function readOutputNumber(id){
    const el=document.getElementById(id);
    if(!el)return 0;
    const n=Number(String(el.textContent||'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }

  function readInputNumber(id){
    const el=document.getElementById(id);
    const n=Number(el?el.value:0);
    return Number.isFinite(n)?n:0;
  }

  function formatNumber(value){
    return Math.round(Number(value)||0).toLocaleString('en-US');
  }

  function generalApplianceTotals(){
    const general=
      Math.max(readInputNumber('q5'),0)*3 +
      Math.max(Math.floor(readInputNumber('q6')),0)*1500 +
      Math.max(Math.floor(readInputNumber('q7')),0)*1500;

    let serviceAppliances=0;
    let generatorAppliances=0;

    for(let row=10;row<=30;row++){
      serviceAppliances+=readOutputNumber('e'+row);
      generatorAppliances+=readOutputNumber('f'+row);
    }

    return {
      service:general+serviceAppliances,
      generator:general+generatorAppliances
    };
  }

  function hvacContinuousTotals(){
    return {
      service:readOutputNumber('e44')+readOutputNumber('e45'),
      generator:readOutputNumber('f44')+readOutputNumber('f45')
    };
  }

  function totalRow(label,service,generator,className){
    return '<tr class="'+className+'">'+
      '<td><strong>'+label+'</strong></td><td></td>'+
      '<td class="number"><strong>'+formatNumber(service)+'</strong></td>'+
      '<td class="number"><strong>'+formatNumber(generator)+'</strong></td>'+
      '</tr>';
  }

  function cleanPrintReport(){
    const report=document.getElementById('printReport');
    if(!report)return;

    const page=report.querySelector('.print-page');
    const table=report.querySelector('.print-table');
    if(!page||!table)return;

    const heading=page.querySelector('h1');
    if(heading){
      heading.innerHTML=
        '<div class="generator-print-heading">'+
          '<div class="print-brand">'+
            '<span class="print-brand-main">LoadCalc</span>'+
            '<span class="print-brand-accent">Pro X</span>'+
          '</div>'+
          '<div class="print-title-text">Generator Optional Method Calculator</div>'+
        '</div>';
    }

    const details=page.querySelector('.print-method-details');
    if(details){
      Array.from(details.children).forEach(function(item){
        const text=String(item.textContent||'').trim();
        if(/^Service Total:/i.test(text)||/^Generator Total:/i.test(text)){
          item.remove();
        }
      });
    }

    table.querySelectorAll('.print-general-appliance-total,.print-hvac-continuous-total').forEach(function(row){
      row.remove();
    });

    const ga=generalApplianceTotals();
    const hc=hvacContinuousTotals();
    const tbody=table.querySelector('tbody');
    const tfoot=table.querySelector('tfoot');

    if(tbody){
      tbody.insertAdjacentHTML(
        'beforeend',
        totalRow('Total General + Appliance Load',ga.service,ga.generator,'print-general-appliance-total checkpoint-print-row')
      );
    }

    if(tfoot){
      const finalTotal=tfoot.querySelector('.final-total-row');
      const html=totalRow('Total HVAC + Continuous Load',hc.service,hc.generator,'print-hvac-continuous-total checkpoint-print-row');
      if(finalTotal){
        finalTotal.insertAdjacentHTML('beforebegin',html);
      }else{
        tfoot.insertAdjacentHTML('afterbegin',html);
      }
    }
  }

  if(typeof window.updatePrintRows==='function'&&!window.__generatorPrintCleanupWrapped){
    const originalUpdatePrintRows=window.updatePrintRows;
    window.updatePrintRows=function(data){
      const result=originalUpdatePrintRows.apply(this,arguments);
      cleanPrintReport();
      return result;
    };
    window.__generatorPrintCleanupWrapped=true;
  }

  const style=document.createElement('style');
  style.id='generatorPrintCleanupStyles';
  style.textContent=`
@media print{
  .print-page{width:84%!important;margin:0 auto!important;border:.6pt solid #cbd5e1!important;padding:.14in!important;box-sizing:border-box!important}
  .print-page h1,.print-project,.print-method-details,.print-table,.print-code-note{width:100%!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}
  .print-page h1{display:block!important;margin-top:0!important;margin-bottom:7px!important;padding:0 0 7px!important;border-bottom:1px solid #777!important}
  .generator-print-heading{display:block!important}
  .print-brand{display:block!important;margin:0 0 3px!important;font-size:15px!important;line-height:1.05!important;font-weight:900!important;letter-spacing:0!important}
  .print-brand-main{color:#17377f!important}
  .print-brand-accent{color:#0f766e!important;margin-left:2px!important}
  .print-title-text{display:block!important;color:#111!important;font-size:10px!important;line-height:1.2!important;font-weight:800!important}
  .print-method-details{grid-template-columns:1fr 1fr!important}
  .checkpoint-print-row td{background:#fbfcfe!important;border-top:1px solid #94a3b8!important;font-weight:800!important}
}
`;
  document.head.appendChild(style);
})();

(function(){
  'use strict';

  const PHONE_MAX_WIDTH = 760;
  const frame = document.getElementById('aicFrame');
  const printButton = document.getElementById('printBtn');
  const layoutSelect = document.getElementById('outerPrintLayout');
  const printTypeSelect = document.getElementById('outerPrintType');

  function isPhoneLayout(){
    return window.matchMedia(`(max-width:${PHONE_MAX_WIDTH}px)`).matches;
  }

  function restorePhonePrintControls(){
    if (!layoutSelect) return;
    layoutSelect.style.display = '';
    layoutSelect.removeAttribute('aria-hidden');
    const control = layoutSelect.closest('.print-control');
    if (control) control.style.gridTemplateColumns = '';
  }

  function suffix(n){ return n === 1 ? '' : String(n); }

  function temporarilyClearAutoOnlyPanels(doc){
    const restores = [];
    const cards = Array.from(doc.querySelectorAll('#calculationsContainer > .card'));
    cards.forEach((card, index) => {
      const n = index + 1;
      if (n === 1) return;
      const heading = doc.getElementById(`calculationHeading${n}`);
      const headingHasValue = String(heading && heading.value || '').trim() !== '';
      const meaningfulFields = ['conduit','wireType','wireSize','distance','volts','conductors','phase'];
      const hasMeaningfulField = meaningfulFields.some(base => {
        const node = doc.getElementById(base + suffix(n));
        return String(node && node.value || '').trim() !== '';
      });
      if (headingHasValue || hasMeaningfulField) return;
      const fault = doc.getElementById('utilityFault' + suffix(n));
      if (!fault || String(fault.value || '').trim() === '') return;
      restores.push({node:fault, value:fault.value});
      fault.value = '';
    });
    return function restore(){
      restores.forEach(item => { item.node.value = item.value; });
    };
  }

  function installPhonePrintStyle(doc){
    let style = doc.getElementById('aicPhoneSingleSourcePrintStyle');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'aicPhoneSingleSourcePrintStyle';
      doc.head.appendChild(style);
    }
    style.textContent = `
      @media print{
        @page{size:letter portrait;margin:.35in}
        html,body{margin:0!important;padding:0!important;background:#fff!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important}
        body>*:not(#printPages){display:none!important}
        #printPages,.print-pages{display:block!important;position:static!important;width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
        .print-page{box-sizing:border-box!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;overflow:visible!important;break-after:page!important;page-break-after:always!important}
        .print-page:last-child{break-after:auto!important;page-break-after:auto!important}
        .print-page-grid{height:auto!important;min-height:0!important}
        .print-report-card{height:auto!important;min-height:0!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important}
        body.aic-calculation-only .aic-print-heading{display:none!important}
      }`;
  }

  function removeEmptyGeneratedReports(printPages){
    printPages.querySelectorAll('.print-report-card').forEach(card => {
      const values = Array.from(card.querySelectorAll('.print-report-value')).map(node => String(node.textContent || '').trim());
      const hasRealValue = values.some(value => value && value !== '—');
      if (!hasRealValue) card.remove();
    });
    printPages.querySelectorAll('.print-page').forEach(page => {
      if (!page.querySelector('.print-report-card')) page.remove();
    });
  }

  function printPhoneInPlace(event){
    if (!isPhoneLayout()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    let win = null;
    let doc = null;
    try {
      win = frame && frame.contentWindow;
      doc = frame && frame.contentDocument;
    } catch (error) {}
    if (!win || !doc) return;

    const restoreAutoValues = temporarilyClearAutoOnlyPanels(doc);
    try {
      if (typeof win.buildCleanPrintReports !== 'function' || typeof win.createPrintPages !== 'function') {
        restoreAutoValues();
        console.error('AIC phone print routine is not available');
        return;
      }

      if (typeof win.removePrintPages === 'function') win.removePrintPages();
      win.buildCleanPrintReports();
      const mode = layoutSelect && layoutSelect.value || 'full';
      const count = win.createPrintPages(mode);
      restoreAutoValues();

      const printPages = doc.getElementById('printPages');
      if (!count || !printPages) {
        if (printPages) printPages.remove();
        win.alert('Enter calculation information before printing.');
        return;
      }

      removeEmptyGeneratedReports(printPages);
      if (!printPages.querySelector('.print-report-card')) {
        printPages.remove();
        win.alert('Enter calculation information before printing.');
        return;
      }

      installPhonePrintStyle(doc);
      const calculationOnly = printTypeSelect && printTypeSelect.value === 'calculation';
      doc.body.classList.toggle('aic-calculation-only', calculationOnly);

      const cleanup = function(){
        try { doc.body.classList.remove('aic-calculation-only'); } catch (error) {}
        try { if (typeof win.removePrintPages === 'function') win.removePrintPages(); else printPages.remove(); } catch (error) {}
        try { window.focus(); } catch (error) {}
      };
      win.addEventListener('afterprint', cleanup, {once:true});

      win.focus();
      win.print();
    } catch (error) {
      restoreAutoValues();
      console.error('AIC phone print failed', error);
    }
  }

  restorePhonePrintControls();
  window.addEventListener('resize', restorePhonePrintControls);
  window.addEventListener('orientationchange', restorePhonePrintControls);
  if (printButton) printButton.addEventListener('click', printPhoneInPlace, true);
})();

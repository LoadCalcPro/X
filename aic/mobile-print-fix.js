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

  function collectPrintHead(doc){
    const parts = [];
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (link.href) parts.push(`<link rel="stylesheet" href="${link.href}">`);
    });
    doc.querySelectorAll('style').forEach(style => {
      parts.push(`<style>${style.textContent}</style>`);
    });
    parts.push(`<style>
      @page{size:letter portrait;margin:.35in}
      html,body{margin:0!important;padding:0!important;background:#fff!important;width:100%!important;height:auto!important;min-height:0!important}
      body{overflow:visible!important}
      .print-pages{display:block!important;margin:0!important;padding:0!important}
      .print-page{box-sizing:border-box!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;break-after:page!important;page-break-after:always!important}
      .print-page:last-child{break-after:auto!important;page-break-after:auto!important}
      .print-page-grid{min-height:0!important;height:auto!important}
      .print-report-card{height:auto!important;min-height:0!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important}
      body.aic-calculation-only .aic-print-heading{display:none!important}
    </style>`);
    return parts.join('\n');
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

  function printPhoneWithSelectedLayout(event){
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('AIC phone print window was blocked');
      return;
    }

    const restoreAutoValues = temporarilyClearAutoOnlyPanels(doc);

    try {
      if (typeof win.buildCleanPrintReports !== 'function' || typeof win.createPrintPages !== 'function') {
        restoreAutoValues();
        printWindow.close();
        console.error('AIC phone print routine is not available');
        return;
      }

      win.buildCleanPrintReports();
      const mode = layoutSelect && layoutSelect.value || 'full';
      const count = win.createPrintPages(mode);
      restoreAutoValues();

      if (!count) {
        printWindow.close();
        win.alert('Enter calculation information before printing.');
        return;
      }

      const sourcePages = doc.getElementById('printPages');
      if (!sourcePages) {
        printWindow.close();
        console.error('AIC phone print pages were not created');
        return;
      }

      const clonedPages = sourcePages.cloneNode(true);
      removeEmptyGeneratedReports(clonedPages);
      sourcePages.remove();

      if (!clonedPages.querySelector('.print-report-card')) {
        printWindow.close();
        win.alert('Enter calculation information before printing.');
        return;
      }

      const calculationOnly = printTypeSelect && printTypeSelect.value === 'calculation';
      const bodyClass = calculationOnly ? 'aic-calculation-only' : '';
      printWindow.document.open();
      printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LoadCalcPro X AIC Report</title>${collectPrintHead(doc)}</head><body class="${bodyClass}">${clonedPages.outerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try { printWindow.print(); } catch (error) { console.error('AIC phone print failed', error); }
      }, 120);
    } catch (error) {
      restoreAutoValues();
      try { printWindow.close(); } catch (closeError) {}
      console.error('AIC phone print failed', error);
    }
  }

  restorePhonePrintControls();
  window.addEventListener('resize', restorePhonePrintControls);
  window.addEventListener('orientationchange', restorePhonePrintControls);
  if (printButton) printButton.addEventListener('click', printPhoneWithSelectedLayout, true);
})();

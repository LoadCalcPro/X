(function(){
  'use strict';

  const PHONE_MAX_WIDTH = 760;
  const frame = document.getElementById('aicFrame');
  const printButton = document.getElementById('printBtn');
  const layoutSelect = document.getElementById('outerPrintLayout');

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

    const restoreAutoValues = temporarilyClearAutoOnlyPanels(doc);
    const restoreAfterPrint = function(){
      restoreAutoValues();
      win.removeEventListener('afterprint', restoreAfterPrint);
    };
    win.addEventListener('afterprint', restoreAfterPrint);

    try {
      win.focus();
      if (typeof win.preparePrint === 'function') {
        win.preparePrint();
      } else {
        restoreAfterPrint();
        console.error('AIC phone print routine is not available');
      }
    } catch (error) {
      restoreAfterPrint();
      console.error('AIC phone print failed', error);
    }
  }

  restorePhonePrintControls();
  window.addEventListener('resize', restorePhonePrintControls);
  window.addEventListener('orientationchange', restorePhonePrintControls);
  if (printButton) printButton.addEventListener('click', printPhoneWithSelectedLayout, true);
})();

(function(){
  'use strict';

  const PHONE_MAX_WIDTH = 760;
  const frame = document.getElementById('aicFrame');
  const printButton = document.getElementById('printBtn');
  const layoutSelect = document.getElementById('outerPrintLayout');

  function isPhoneLayout(){
    return window.matchMedia(`(max-width:${PHONE_MAX_WIDTH}px)`).matches;
  }

  function updatePhonePrintControls(){
    if (!layoutSelect) return;
    if (isPhoneLayout()) {
      layoutSelect.value = 'full';
      layoutSelect.style.display = 'none';
      layoutSelect.setAttribute('aria-hidden','true');
      const control = layoutSelect.closest('.print-control');
      if (control) control.style.gridTemplateColumns = '1fr';
    } else {
      layoutSelect.style.display = '';
      layoutSelect.removeAttribute('aria-hidden');
      const control = layoutSelect.closest('.print-control');
      if (control) control.style.gridTemplateColumns = '';
    }
  }

  function printPhoneFullPage(event){
    if (!isPhoneLayout()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (layoutSelect) layoutSelect.value = 'full';

    let win = null;
    try { win = frame && frame.contentWindow; } catch (error) {}
    if (!win) return;

    try {
      win.focus();
      if (typeof win.preparePrint === 'function') {
        win.preparePrint();
      } else {
        console.error('AIC phone print routine is not available');
      }
    } catch (error) {
      console.error('AIC phone print failed', error);
    }
  }

  updatePhonePrintControls();
  window.addEventListener('resize', updatePhonePrintControls);
  window.addEventListener('orientationchange', updatePhonePrintControls);
  if (printButton) printButton.addEventListener('click', printPhoneFullPage, true);
})();

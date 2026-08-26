(function(){
  'use strict';

  /*
    Phone printing now intentionally uses the exact same print routine and
    print CSS as desktop. This file only preserves the phone print controls;
    it no longer intercepts the Print button, rebuilds pages, or injects
    phone-specific @media print rules.
  */

  const layoutSelect = document.getElementById('outerPrintLayout');

  function restorePrintControls(){
    if (!layoutSelect) return;
    layoutSelect.style.display = '';
    layoutSelect.removeAttribute('aria-hidden');
    const control = layoutSelect.closest('.print-control');
    if (control) control.style.gridTemplateColumns = '';
  }

  restorePrintControls();
  window.addEventListener('resize', restorePrintControls);
  window.addEventListener('orientationchange', restorePrintControls);
})();

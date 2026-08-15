/* EV charger entry behavior: do not apply the 7,200 VA minimum until a nameplate value is entered. */
(function(){
  'use strict';

  window.rowVA = function(row){
    const quantity = typeof positiveQuantity === 'function'
      ? positiveQuantity('q' + row)
      : Math.max(0, Math.floor(Number(document.getElementById('q' + row)?.value) || 0));

    const enteredVA = typeof numberValue === 'function'
      ? numberValue('v' + row)
      : Math.max(0, Number(document.getElementById('v' + row)?.value) || 0);

    if(row === 43){
      if(quantity < 1 || enteredVA <= 0){
        return 0;
      }
      return quantity * Math.max(enteredVA, 7200);
    }

    return quantity * enteredVA;
  };
})();

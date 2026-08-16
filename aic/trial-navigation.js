(function(){
  'use strict';
  const button=document.getElementById('calculatorsBtn');
  if(!button)return;
  button.addEventListener('click',function(event){
    const trialEmail=localStorage.getItem('loadcalcproTrialEmail');
    const trialCode=localStorage.getItem('loadcalcproTrialCode');
    if(!(trialEmail&&trialCode))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.href='../trial-dashboard.html';
  },true);
})();

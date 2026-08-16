(function(){
  'use strict';
  const frame=document.getElementById('aicFrame');
  if(!frame)return;

  function install(){
    let d;
    try{d=frame.contentDocument||frame.contentWindow.document}catch(e){return}
    if(!d||!d.head)return;
    let style=d.getElementById('aicResultHighlightStyles');
    if(!style){
      style=d.createElement('style');
      style.id='aicResultHighlightStyles';
      d.head.appendChild(style);
    }
    style.textContent=`
      @media screen{
        .eng-work-item.eng-final{
          background:#e8eefc;
          margin-left:0;
          margin-right:0;
          padding:7px 10px;
          border-top:1px solid #cfe3f2;
          border-bottom:1px solid #cfe3f2;
        }
        .eng-work-item.eng-final .eng-result{
          white-space:nowrap;
          min-width:max-content;
        }
      }
    `;
  }

  frame.addEventListener('load',()=>{
    install();
    setTimeout(install,150);
    setTimeout(install,650);
  });
  try{if(frame.contentDocument?.readyState==='complete')install()}catch(e){}
})();

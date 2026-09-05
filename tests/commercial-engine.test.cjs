const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../commercial/engine.js');
const base=()=>({phase:3,voltage:208,occupancy:'retail',sqft:1000,actualLighting:'',hotelAllLighting:false,showWindowFt:'',trackFt:'',signQty:'',signRequired:false,receptacles:'',other:[],kitchen:[],hvacMode:'',cooling:'',heating:'',includedMotor:'',motors:[],continuous:[]});
test('blank calculator is not blocked by validation',()=>{const s=base();s.occupancy='';s.sqft='';const r=E.calculate(s);assert.equal(r.touched,false);assert.deepEqual(r.errors,[]);});
test('all Table 220.42(A) occupancy values are present',()=>{
 assert.equal(Object.keys(E.OCCUPANCIES).length,29);assert.equal(E.OCCUPANCIES.office.va,1.3);assert.equal(E.OCCUPANCIES.retail.va,1.9);assert.equal(E.OCCUPANCIES.warehouse.va,1.2);
});
test('occupancy lighting value already includes continuous allowance',()=>{
 const r=E.calculate(base());assert.equal(r.minimumLighting,1900);assert.equal(r.lighting,1900);
});
test('actual lighting governs when larger than occupancy minimum',()=>{
 const s=base();s.actualLighting=2500;assert.equal(E.calculate(s).lightingBase,2500);
});
test('Table 220.45 hospital, hotel and warehouse demand bands',()=>{
 assert.equal(Object.values(E.lightingDemand(100000,'hospital')).filter(x=>typeof x==='number').reduce((a,b)=>a+b,0),30000);
 assert.equal(Object.values(E.lightingDemand(150000,'hotel')).filter(x=>typeof x==='number').reduce((a,b)=>a+b,0),77500);
 assert.equal(Object.values(E.lightingDemand(22500,'warehouse')).filter(x=>typeof x==='number').reduce((a,b)=>a+b,0),17500);
 assert.equal(Object.values(E.lightingDemand(150000,'hotel',true)).filter(x=>typeof x==='number').reduce((a,b)=>a+b,0),150000);
});
test('office receptacle load uses larger of yokes or 1 VA per square foot',()=>{
 const s=base();s.occupancy='office';s.sqft=20000;s.receptacles=50;let r=E.calculate(s);assert.equal(r.receptacleConnected,20000);assert.equal(r.receptacles,15000);
 s.receptacles=200;assert.equal(E.calculate(s).receptacleConnected,36000);
});
test('commercial kitchen equipment demand factors',()=>{
 assert.deepEqual([1,2,3,4,5,6,20].map(E.kitchenFactor),[1,1,.9,.8,.7,.65,.65]);const s=base();s.kitchen=[{qty:3,va:1000}];assert.equal(E.calculate(s).kitchen,2700);
});
test('noncoincident HVAC selects larger load and included motor adds 25 percent once',()=>{
 const s=base();s.hvacMode='noncoincident';s.cooling=9000;s.heating=12500;s.includedMotor=4000;const r=E.calculate(s);assert.equal(r.hvac,12500);assert.equal(r.motorAdder,1000);
});
test('three-phase service current uses square root of three',()=>{
 const s=base();const r=E.calculate(s);assert.equal(r.amps,r.total/(Math.sqrt(3)*208));s.phase=1;assert.equal(E.calculate(s).amps,E.calculate(s).total/208);
});
test('EV load uses 7200 VA minimum without another 125 percent multiplier',()=>{
 const s=base();s.continuous=[{label:'EV Charger',qty:1,va:3000,ev:true,factor:1}];assert.equal(E.calculate(s).continuous,7200);
});
test('incomplete rows and missing HVAC arrangement produce validation errors',()=>{
 const s=base();s.other=[{label:'Water Heater',qty:1,va:''}];s.cooling=5000;const errors=E.calculate(s).errors.join(' ');assert.match(errors,/Complete quantity/);assert.match(errors,/HVAC operating arrangement/);
});

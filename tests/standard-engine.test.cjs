const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../standard/engine.js');
const base=()=>({sqft:2000,small:2,laundry:1,voltage:240,appliances:[],cooking:[],dryers:[],motors:[],continuous:[],hvac:[],applianceMotor:''});
test('general demand boundaries use 117000 VA in the middle band',()=>{
 for(const [input,total] of [[0,0],[2000,2000],[3000,3000],[10500,5625],[120000,43950],[123000,44700]]){const d=E.general(input);assert.equal(d.first+d.middle+d.last,total);}
});
test('cooking ratings, quantity and mixed Note 3 groups',()=>{
 for(const [rows,total] of [[[{qty:1,va:12000}],8000],[[{qty:1,va:15000}],9200],[[{qty:2,va:6500}],8450],[[{qty:1,va:3000},{qty:1,va:5000}],6400],[[{qty:1,va:1750}],1750],[[{qty:1,va:30000}],30000],[[{qty:2,va:14000},{qty:1,va:10000}],14700]])assert.equal(E.cooking(rows).total,total);
});
test('fixed appliance count uses quantity, 500 W or quarter horsepower, and excludes other appliances',()=>{
 const s=base();s.appliances=[{qty:3,va:1000,fixed:true},{qty:1,va:400,fixed:true},{qty:1,va:1000,fixed:false}];assert.equal(E.calculate(s).appliances,4400);
 s.appliances[1].quarterHP=true;assert.equal(E.calculate(s).eligibleCount,4);assert.equal(E.calculate(s).appliances,3550);
});
test('dryer minimum and table bands',()=>{
 for(const [n,f] of [[4,1],[5,.85],[11,.47],[12,.46],[23,.35],[24,.345],[42,.255],[43,.25]])assert.equal(E.dryerFactor(n),f);
 const s=base();s.dryers=[{qty:2,va:4000},{qty:3,va:6000}];assert.equal(E.calculate(s).dryers,23800);
});
test('heat pump concurrent heat at 100%, one largest motor adder',()=>{
 const s=base();s.hvac=[{mode:'simultaneous',cool:3500,coolMotor:3000,heat:10000,heatMotor:0}];s.motors=[{qty:2,va:2000}];const r=E.calculate(s);assert.equal(r.hvac,13500);assert.equal(r.motorAdder,750);assert.equal(r.total,23875);
});
test('motor adder can make cooling govern over a larger heating base',()=>{
 const s=base();s.hvac=[{mode:'noncoincident',cool:4000,coolMotor:3600,heat:4500,heatMotor:0}];const r=E.calculate(s);assert.equal(r.hvac,4000);assert.equal(r.motorAdder,900);assert.equal(r.total,10525);
});
test('multiple HVAC systems sum independently and motor addition applies once',()=>{
 const s=base();s.hvac=[{mode:'noncoincident',cool:4000,coolMotor:3600,heat:4500,heatMotor:0},{mode:'noncoincident',cool:2000,coolMotor:1200,heat:1000,heatMotor:0}];const r=E.calculate(s);assert.equal(r.hvac,6000);assert.equal(r.motorAdder,900);
});
test('other larger motor may make heating govern instead',()=>{
 const s=base();s.hvac=[{mode:'noncoincident',cool:4000,coolMotor:3600,heat:4500,heatMotor:0}];s.motors=[{qty:1,va:6000}];const r=E.calculate(s);assert.equal(r.hvac,4500);assert.equal(r.motorAdder,1500);
});
test('EV minimum plus continuous adder and noncontinuous row',()=>{
 const s=base();s.continuous=[{qty:1,va:3000,ev:true,factor:1.25},{qty:2,va:1000,factor:1.25},{qty:1,va:500,factor:1}];assert.equal(E.calculate(s).continuous,12000);
});
test('incomplete and invalid inputs cannot silently produce a final result',()=>{
 const s=base();s.appliances=[{label:'Dishwasher',qty:1,va:''}];assert.match(E.calculate(s).errors.join(' '),/Complete quantity/);
 s.appliances=[{qty:1.5,va:1000}];assert.match(E.calculate(s).errors.join(' '),/whole number/);
 s.hvac=[{mode:'',cool:3500,coolMotor:'',heat:0}];assert.match(E.calculate(s).errors.join(' '),/arrangement/);assert.match(E.calculate(s).errors.join(' '),/compressor/);
});
test('sample whole dwelling total and 208V conversion',()=>{
 const s=base();s.cooking=[{qty:1,va:12000}];s.dryers=[{qty:1,va:5000}];s.appliances=[{qty:1,va:1200,fixed:true},{qty:1,va:800,fixed:true},{qty:1,va:1000,fixed:true},{qty:1,va:4500,fixed:true}];s.hvac=[{mode:'noncoincident',cool:4000,coolMotor:3200,heat:5000,heatMotor:0}];s.continuous=[{qty:1,va:7200,ev:true,factor:1.25}];const r=E.calculate(s);assert.equal(r.total,38250);assert.equal(r.amps,159.375);assert.deepEqual(r.errors,[]);s.voltage=208;assert.equal(E.calculate(s).amps,38250/208);
});
test('cooking rows are separated into their applicable Table 220.55 groups',()=>{
 const s=base();s.cooking=[{label:'Range',qty:2,va:6500},{label:'Range 2',qty:1,va:3000},{label:'Wall Oven',qty:1,va:5000},{label:'Counter Mounted Oven',qty:2,va:3400},{label:'Cooktop',qty:1,va:5000}];
 const r=E.calculate(s);assert.deepEqual(r.cooking.rows.map(x=>x.connected),[13000,3000,5000,6800,5000]);assert.equal(r.cooking.connected,32800);assert.equal(r.cooking.total,18360);assert.equal(r.total,5625+18360);assert.equal(r.appliances,0);
});
test('adding or removing a cooking row immediately changes the combined demand',()=>{
 const s=base();s.cooking=[{label:'Range',qty:1,va:12000}];assert.equal(E.calculate(s).cooking.total,8000);
 s.cooking.push({label:'Wall Oven',qty:1,va:5000});assert.equal(E.calculate(s).cooking.total,12000);
 s.cooking.pop();assert.equal(E.calculate(s).cooking.total,8000);
});
test('three 12 kW ranges plus two 3.3 kW ovens total 18,950 VA',()=>{
 const s=base();s.cooking=[{label:'Range',qty:3,va:12000},{label:'Wall Oven',qty:2,va:3300}];const r=E.calculate(s);
 assert.equal(r.cooking.connected,42600);assert.equal(r.cooking.total,18950);assert.equal(r.cooking.method,'Table 220.55 — Column C + Column A');
});
test('Table 220.55 rating and quantity boundaries',()=>{
 for(const [qty,rating,demand] of [[1,1750,1750],[1,1751,1400.8],[1,3500,2800],[1,8750,7000],[1,8751,8000],[1,12400,8000],[1,12600,8400],[1,27000,14000],[6,12000,21000],[16,5000,22400],[26,5000,31200],[41,12000,55750],[61,12000,70750]])assert.ok(Math.abs(E.cooking([{qty,va:rating}]).total-demand)<.001,`${qty} at ${rating}`);
});

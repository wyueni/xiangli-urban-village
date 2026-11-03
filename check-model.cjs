// CPU verification only: real Three.js geometry, mocked renderer and canvas.
// Does not verify GPU appearance, screenshots or frame rate.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/management.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate DOM IDs');for(const m of fs.readFileSync('dist/scene.js','utf8').matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),'Missing DOM ID '+m[1]);
const storage=new Map();const listeners=new Map(),elements=new Map();
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
function element(id=''){if(elements.has(id))return elements.get(id);const e={id,children:[],style:{},dataset:{},firstChild:{textContent:''},classList:{add(){},remove(){},toggle(){}},addEventListener(type,cb){listeners.set(id+':'+type,cb);},getContext(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{}});},toBlob(cb){cb(new Blob([png],{type:'image/png'}));},remove(){},focus(){},close(){},showModal(){},setAttribute(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900}),get children(){return [];}};elements.set(id,e);return e;}
const sandbox={structuredClone,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console:{...console,warn(){}},window:{addEventListener(){}},document:{createElement:()=>element(Math.random()+''),getElementById:element,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){},add(){},remove(){}}},activeElement:{tagName:'CANVAS'},hidden:false},innerWidth:1440,innerHeight:900,devicePixelRatio:1,performance,requestAnimationFrame(fn){sandbox.lastFrame=fn;},setTimeout,clearTimeout,Blob,TextEncoder,URL};sandbox.window.window=sandbox.window;
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('dist/vendor/three.min.js','utf8'),sandbox);
sandbox.THREE.WebGLRenderer=class {constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>4};}setPixelRatio(){}setSize(){}setScissorTest(){}setViewport(){}setScissor(){}render(){this.renders=(this.renders||0)+1;}};
vm.runInContext(fs.readFileSync('dist/export.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('dist/knowledge.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('dist/budget.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('dist/planning.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('dist/scene.js','utf8'),sandbox);
(async()=>{const api=sandbox.window.Xiangli;assert.equal(api.buildings.length,20);let instances=0;for(const b of api.buildings){assert.ok(b.h>7);b.root.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.count>0);for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));if(o.isInstancedMesh){instances+=o.count;for(const v of o.instanceMatrix.array)assert.ok(Number.isFinite(v));}}});}
// Separating-axis test for independently rotated building footprints.
function overlaps(a,b){
 const corners=c=>{const r=c.rotation,co=Math.cos(r),si=Math.sin(r);return [[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>[c.x+sx*c.w/2*co+sz*c.d/2*si,c.z-sx*c.w/2*si+sz*c.d/2*co]);};
 const aa=corners(a),bb=corners(b),axes=[a.rotation,b.rotation].flatMap(r=>[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]]);
 for(const [x,z] of axes){const ap=aa.map(p=>p[0]*x+p[1]*z),bp=bb.map(p=>p[0]*x+p[1]*z);if(Math.max(...ap)<=Math.min(...bp)||Math.max(...bp)<=Math.min(...ap))return false;}return true;
}
for(let i=0;i<api.buildings.length;i++)for(let j=i+1;j<api.buildings.length;j++)assert.ok(!overlaps(api.buildings[i].config,api.buildings[j].config),'Overlapping building bodies: '+i+', '+j);
assert.ok(new Set(api.buildings.map(b=>b.config.w.toFixed(2))).size>15);
assert.ok(new Set(api.buildings.map(b=>b.config.floors)).size>=6);
api.select(0);api.renovate();assert.equal(api.buildings[0].root.userData.renovated,true);assert.equal(api.buildings[0].weathering.visible,false);assert.notEqual(api.buildings[0].body.material,api.buildings[0].wall);api.planning.undo();assert.equal(api.buildings[0].body.material,api.buildings[0].wall);assert.equal(api.buildings[0].weathering.visible,true);
for(const view of ['lane','top','overview']){api.setView(view);assert.ok(api.camera.position.toArray().every(Number.isFinite));}
for(const light of ['day','soft','evening','rain'])api.lighting(light);
assert.ok(api.sceneNodes.size>45);
assert.equal(api.roadNetwork.length,5);
for(const id of ['waste','bikes','pit','drain']){api.inspectNode(id);const n=api.sceneNodes.get(id);api.resolveNode();assert.equal(n.resolved,true);assert.equal(n.dirty.visible,false);assert.equal(n.safe.visible,true);api.planning.undo();assert.equal(n.resolved,false);assert.equal(n.dirty.visible,true);}
for(const mode of ['risk','light','green','life'])api.setObservation(mode);
assert.equal(api.lightProfiles.length,20);assert.ok(api.lightProfiles.every(p=>p.rows.every(m=>m>=0&&m<=720)));assert.ok(api.lightProfiles.some(p=>p.rows[0]<p.rows.at(-1)));
const beforeGreen=api.greenCoverage();api.toggleGreening();const afterGreen=api.greenCoverage();assert.ok(afterGreen>beforeGreen);api.planning.undo();assert.equal(api.greenCoverage(),beforeGreen);
const game=api.planning.game;
assert.equal(game.state.balance,15000);
assert.ok(api.planning.validate('bench',0,10));assert.ok(api.planning.validate('bench',0,-28));assert.ok(api.planning.validate('bench',47,20));
assert.equal(api.planning.validate('bench',37,25),null);
let validSites=0;for(let x=-49;x<53;x+=3)for(let z=-57;z<61;z+=3)if(!api.planning.validate('bench',x,z))validSites++;assert.ok(validSites>60);
api.planning.start('new','bench');assert.equal(api.planning.place(37,25),true);assert.equal(game.state.balance,14980);assert.equal(game.state.items.length,1);assert.ok(api.planning.validate('bench',37,25));assert.ok(api.planning.roots.size===1);api.planning.undo();assert.equal(game.state.balance,15000);assert.equal(api.planning.roots.size,0);
for(const c of sandbox.window.VillageBudget.CATALOG){api.planning.start('new',c.id);assert.equal(api.planning.place(37,25),true,'Could not place '+c.id);const metrics=api.planning.metrics();assert.ok(Number.isFinite(metrics.reduced));assert.ok(api.planning.roots.size===1);api.planning.undo();assert.equal(game.state.balance,15000);}
assert.equal(game.setNote('plan','保留早餐档和街坊茶桌').ok,true);api.planning.renderControls();assert.equal(game.state.balance,15000);assert.equal(game.state.notes.plan,'保留早餐档和街坊茶桌');api.planning.undo();assert.equal(game.state.notes.plan,undefined);
const knowledge=sandbox.window.VillageKnowledge;
assert.equal(knowledge.terms.length,26);
for(const term of knowledge.terms){
 assert.equal(knowledge.lessons[term.id].length,2);
 knowledge.open(term.id);
 const content=element('theory-content').innerHTML;
 assert.ok(content.includes(knowledge.lessons[term.id][0]));
 assert.ok(content.includes(knowledge.lessons[term.id][1]));
 assert.ok(content.includes('<details class="term-deeper">'));
}
assert.ok(sandbox.window.VillageKnowledge.terms.every(t=>t.zh&&t.en&&t.definition&&t.status));
const prop=api.sceneNodes.get('prop-0'),original={x:prop.x,z:prop.z};
api.inspectNode(prop.id);element('move-stall').onclick();
assert.equal(api.planning.chooseSite(37,25),true);
element('site-prediction').value='change';element('site-confirm').onclick();
assert.equal(prop.x,37);assert.equal(game.state.balance,15000);
assert.ok(element('field-result').textContent.includes('搬迁'));
element('field-retry').onclick();assert.equal(prop.x,original.x);assert.equal(prop.z,original.z);api.planning.cancel();
api.inspectNode(prop.id);element('remove-original').onclick();assert.equal(prop.root.visible,false);assert.equal(game.state.balance,15000);
api.planning.undo();assert.equal(prop.root.visible,true);
api.planning.start('new','service');assert.equal(api.planning.chooseSite(37,25),true);
element('site-prediction').value='change';element('site-confirm').onclick();
assert.ok(element('field-result').textContent.includes('80 米步行覆盖'));
element('field-retry').onclick();api.planning.cancel();assert.equal(game.state.balance,15000);
api.select(0);element('relocate-building').onclick();
let movedBuilding=false;
for(let x=-46;x<=49&&!movedBuilding;x+=2)for(let z=-54;z<=57&&!movedBuilding;z+=2){
 if(api.planning.chooseSite(x,z)){element('site-confirm').onclick();movedBuilding=!!api.activeBuilding(0).relocated;}
}
assert.ok(movedBuilding,'At least one fitting relocation site must exist');
assert.notEqual(api.activeBuilding(0).config.z,api.baseBuildings[0].config.z);
api.planning.undo();assert.equal(api.activeBuilding(0),api.baseBuildings[0]);assert.equal(game.state.balance,15000);
for(const [mode,word] of [['water','下垫面'],['light','60 分钟'],['green','地面种植率']]){
 api.setObservation(mode);assert.equal(element('study-diagnosis').hidden,false);
 element('study-diagnosis').onclick();assert.ok(element('diagnosis-content').innerHTML.includes(word));
 assert.ok(element('diagnosis-content').innerHTML.includes('data-diagnose-action'));
 element('close-diagnosis').onclick();
}
api.setObservation('life');
const doubleOccupancy=api.planning.metrics().housing;
assert.equal(doubleOccupancy.before,2*doubleOccupancy.roomsBefore);
element('occupancy-scenario').onchange({target:{value:'1'}});
assert.equal(api.planning.metrics().housing.before,doubleOccupancy.roomsBefore);
assert.equal(game.state.balance,15000);api.planning.undo();
assert.equal(api.planning.metrics().housing.before,doubleOccupancy.before);
const beforePlan=api.planning.metrics();
const previousSun=api.lightProfiles.map(p=>p.rows.slice());
api.select(9);element('move-building').onclick();element('clear-building').onclick();
assert.equal(api.activeBuilding(9),null);assert.equal(api.lightProfiles[9].rows.length,0);
assert.ok(api.planning.metrics().housing.after<beforePlan.housing.after);
assert.ok(api.planning.metrics().housing.affected>0);
assert.ok(api.lightProfiles.some((p,i)=>i!==9&&p.rows.some((minutes,f)=>minutes>previousSun[i][f])));
api.planning.undo();
assert.deepEqual(api.lightProfiles.map(p=>p.rows),previousSun);
api.select(9);element('move-building').onclick();element('rebuild-building').onclick();
assert.ok(api.activeBuilding(9).config.floors<api.baseBuildings[9].config.floors);
assert.ok(api.planning.metrics().housing.gap>0);
api.planning.undo();assert.deepEqual(api.lightProfiles.map(p=>p.rows),previousSun);
assert.ok(element('culture-route').innerHTML.includes('Ancestral hall'));
assert.equal(game.changeBuilding(-1,"clear",100).ok,false);assert.equal(game.state.balance,15000);
for(const value of ['water','human','gis'])api.setObservation(value);
assert.ok(api.planning.metrics().coverage>=0&&api.planning.metrics().coverage<=100);
api.setCompare(true);const renders=api.renderer.renders;sandbox.lastFrame(performance.now()+30);assert.equal(api.renderer.renders,renders+2);api.setCompare(false);
api.select(0);
const blob=await sandbox.window.exportBuildingGLB(api.buildings[0].root),buffer=Buffer.from(await blob.arrayBuffer());assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);const jsonLength=buffer.readUInt32LE(12),gltf=JSON.parse(buffer.subarray(20,20+jsonLength).toString());assert.equal(gltf.asset.version,'2.0');assert.ok(gltf.nodes.length>300);assert.ok(gltf.images.length>=3);const binaryStart=28+jsonLength;assert.equal(binaryStart+gltf.buffers[0].byteLength,buffer.length);for(const view of gltf.bufferViews){assert.equal(view.byteOffset%4,0);assert.ok(view.byteOffset+view.byteLength<=gltf.buffers[0].byteLength);}for(const node of gltf.nodes)if(node.matrix)assert.ok(node.matrix.every(Number.isFinite));for(const m of gltf.meshes)for(const p of m.primitives){assert.ok(p.attributes.POSITION<gltf.accessors.length);assert.ok(p.material<gltf.materials.length);}console.log(JSON.stringify({passed:true,buildings:api.buildings.length,instances,exportNodes:gltf.nodes.length,exportMeshes:gltf.meshes.length,exportImages:gltf.images.length,exportBytes:buffer.length,observations:api.sceneNodes.size,validPlacementSites:validSites,greenBefore:beforeGreen,greenAfter:afterGreen,middleSunMinutesRange:[Math.min(...api.lightProfiles.map(p=>p.middle)),Math.max(...api.lightProfiles.map(p=>p.middle))],note:'CPU and GLB structure verified; canvas PNG is a test fixture, GPU appearance unverified.'}));})().catch(e=>{console.error(e);process.exitCode=1;});

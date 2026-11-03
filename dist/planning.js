/* Free placement, local game persistence and an interactive community map. */
window.installPlanning=function(h){
'use strict';
const {buildingCost}=window.VillageBudget;
const {api,THREE,Builder,M,mat,boxGeo,sphereGeo,scene,globals,buildings,sceneNodes,board,toast}=h,$=id=>document.getElementById(id),catalog=window.VillageBudget.CATALOG;
const knowledge=window.VillageKnowledge;if(knowledge)knowledge.init();
const money=v=>v===0?'0 元':(v/10).toFixed(1)+' 万',esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let stored=null;try{stored=JSON.parse(localStorage.getItem('xiangli-plan-v4'));}catch(_){}let game=window.VillageBudget.create(stored);
const roots=new Map(),originals=new Map([...sceneNodes].map(([id,n])=>[id,{x:n.x,z:n.z}])),baseGreens=h.greenSpaces.map(c=>({...c}));let tool=null,chosenItem=null,noteTarget='building-9',pinDraft=null,category='全部',search='',mapLayer='life',rainfall=60;let view={x:0,y:0,w:840,h:900};
const civicPrices={breakfast:[80,45],waste:[110,65],bikes:[25,18],'tea-corner':[22,12],'craft-home':[135,80],'story-corner':[28,15],'service-home':[95,55]};
const fixed={hall:'祠堂及前埕涉及文化保育和社区协商，本局保留原址。',creek:'河涌位置由水系决定，改造应从岸边空间入手。',pit:'检修坑接入地下设施，可改盖板。',drain:'雨水口接入地下管网，可清理杂物。'};
function objectSpec(id){
 if(id?.startsWith('building-')){
  const c=api.baseBuildings[Number(id.slice(9))]?.config;if(!c)return null;
  const co=Math.abs(Math.cos(c.rotation)),si=Math.abs(Math.sin(c.rotation));
  return {name:'民居 '+(c.id+1)+' 原型迁建',w:c.w*co+c.d*si,d:c.w*si+c.d*co,price:Math.ceil(c.w*c.d*(c.floors+1)*1.75)*10};
 }
 const n=sceneNodes.get(id),prices=civicPrices[id]||(n?.type==='prop'?[n.move,n.remove]:null);
 return prices?{name:n.title,w:n.size[0],d:n.size[2],price:prices[0],remove:prices[1]}:null;
}
function originalLocation(id,state){
 const edit=state.objectEdits?.[id];if(edit?.removed)return null;
 return edit||(id==='breakfast'?state.moved.breakfast:null)||originals.get(id);
}
const originalCanopy=api.greenCoverage();
function greenGround(state){
 // Soil and planted beds within the same fixed land boundary as the canopy layer.
 const beds=[...baseGreens.filter(c=>c.ground).flatMap(c=>{const at=c.id?originalLocation(c.id,state):c;return at?[{...c,...at}]:[];}),...(state.greening?h.trialCanopies.map(c=>({...c,w:1.2,d:1.2})):[]),...state.items.filter(i=>['tree','rain','planter'].includes(i.type)).map(i=>({...i,w:itemSpec(i.type).w-.2,d:itemSpec(i.type).d-.2}))];
 let area=0;
 for(let x=-34.75;x<42;x+=.5)for(let z=-53.75;z<62;z+=.5)if(beds.some(b=>Math.abs(b.x-x)<b.w/2&&Math.abs(b.z-z)<b.d/2))area+=.25;
 return +(area/(77*116)*100).toFixed(2);
}
const baselineGround=greenGround({items:[]});
const ghost=new THREE.Mesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshBasicMaterial({color:'#86b76e',transparent:true,opacity:.52,depthTest:false}));ghost.visible=false;ghost.renderOrder=20;scene.add(ghost);
function itemSpec(type){return catalog.find(c=>c.id===type);}
function blockedRect(x,z,w,d,r){return Math.abs(x-r.x)<(w+r.w)/2+.12&&Math.abs(z-r.z)<(d+r.d)/2+.12;}
function validate(type,x,z,skip=null){const spec=typeof type==='string'?itemSpec(type):type;if(!spec||!Number.isFinite(x)||!Number.isFinite(z))return '位置无效';const w=spec.w,d=spec.d;
 if(x-w/2< -51||x+w/2>55||z-d/2< -60||z+d/2>63)return '请在街区可规划范围内选址';
 if(blockedRect(x,z,w,d,{x:47,z:0,w:6.6,d:122}))return '河涌与岸线不能直接占用';
 if(blockedRect(x,z,w,d,{x:0,z:-37,w:28,d:30}))return '祠堂与前埕是保留的公共文化空间，请在边缘另选位置';
 if(blockedRect(x,z,w,d,{x:0,z:20,w:2.5,d:88})||blockedRect(x,z,w,d,{x:0,z:10,w:98,d:2.8})||blockedRect(x,z,w,d,{x:-43.7,z:0,w:3.3,d:125})||blockedRect(x,z,w,d,{x:40.8,z:0,w:1.5,d:120}))return '这里需要保留连续通行空间，请移到通道边缘';
 if(blockedRect(x,z,w,d,{x:-1.05,z:22,w:2,d:2}))return '请保留检修坑的维护空间';
 for(const b of buildings){if(!b.root.visible||skip==='building-'+b.config.id)continue;const c=b.config;const co=Math.abs(Math.cos(c.rotation)),si=Math.abs(Math.sin(c.rotation));if(blockedRect(x,z,w,d,{x:c.x,z:c.z,w:c.w*co+c.d*si,d:c.w*si+c.d*co}))return '这里已有民居，不能把新设施叠在楼里';}
 for(const n of sceneNodes.values()){if(!n.root.visible||n.id===skip||n.id==='creek'||n.id==='hall')continue;if(blockedRect(x,z,w,d,{x:n.x,z:n.z,w:n.size[0],d:n.size[2]}))return '这里已有生活设施或观察点，请留出使用空间';}
 for(const i of game.state.items){if(i.id===skip)continue;const c=itemSpec(i.type);if(blockedRect(x,z,w,d,{x:i.x,z:i.z,w:c.w,d:c.d}))return '与已建设施重叠，请换个位置';}
 return null;
}
function createModel(item,previewOnly=false){const c=itemSpec(item.type),root=new THREE.Group();root.name=item.id;const b=new Builder(root),wood=mat('#8b6c4c'),sage=mat('#637b59');
 if(item.type==='tree'||item.type==='planter'||item.type==='rain'){b.box(0,.16,0,c.w,.3,c.d,M.concrete);b.box(0,.32,0,c.w-.2,.03,c.d-.2,mat('#6b7651'));if(item.type==='tree'){b.cylinder(0,1.6,0,.18,3.1,.18,M.wood);for(let j=0;j<8;j++)b.add(sphereGeo,sage,Math.sin(j*2.4)*.55,3.1+(j%3)*.25,Math.cos(j*2.4)*.55,2,1.65,2);}else for(let j=0;j<10;j++)b.add(sphereGeo,sage,Math.sin(j*2.4)*(c.w*.28),.5+(j%3)*.14,Math.cos(j*2.4)*(c.d*.28),item.type==='rain'?.8:.5,.6,.6);}
 else if(item.type==='paving'){b.box(0,.065,0,4,.035,4,h.materials.paving);for(let x=-1.8;x<2;x+=.4)b.box(x,.09,0,.025,.01,3.8,sage);}
 else if(item.type==='bench'){b.box(0,.57,0,1.9,.15,.55,wood);b.box(0,.95,-.25,1.9,.6,.09,wood);for(const x of [-.7,.7])b.box(x,.3,0,.1,.5,.5,M.dark);}
 else if(item.type==='lamp'){b.cylinder(0,2.2,0,.075,4.4,.075,M.dark);b.box(.22,4.4,0,.7,.06,.35,new THREE.MeshStandardMaterial({color:'#e6ddac',emissive:'#ffe8b0',emissiveIntensity:.7}));const light=new THREE.PointLight('#ffe0a2',10,8,2);light.position.set(.2,4.1,0);if(!previewOnly)root.add(light);}
 else if(item.type==='story'){b.box(0,1.15,0,.12,2.2,.12,M.wood);board(b,'街坊故事 / STORIES',0,1.9,.12,1.4,.8,'#506a58');}
 else if(item.type==='parking'){for(const x of [-1.8,1.8])b.box(x,1.1,0,.07,2.2,.07,M.bar);b.box(0,2.3,0,4.1,.07,2.5,sage);for(let j=-2;j<=2;j++)b.box(j*.65,.32,0,.04,.6,1.4,M.bar);board(b,'邻里停放',0,1.9,1.24,2.3,.45,'#49644e');}
 else{for(const x of [-c.w*.43,c.w*.43])b.box(x,1.25,-c.d*.32,.065,2.5,.065,M.wood);b.box(0,2.6,0,c.w+.15,.09,c.d+.12,mat(item.type==='craft'?'#825647':'#607a6d'));b.box(0,.7,0,c.w*.88,1.2,c.d*.64,wood);const label={tea:'街坊凉茶',service:'社区便民驿站',craft:'广绣 · 广彩',studio:'湾区设计共创'}[item.type];board(b,label,0,2.23,c.d*.42,c.w*.92,.55,'#51634f');
 if(item.type==='craft'){for(let j=0;j<3;j++){b.cylinder(-.8+j*.75,1.42,.22,.28,.35,.28,mat(['#c3b398','#6f8b87','#b6a077'][j]));}b.box(0,1.7,-.25,1.1,.65,.035,mat('#ae8173'));}if(item.type==='tea'){for(let j=0;j<4;j++)b.cylinder(-.75+j*.45,1.35,.2,.16,.15,.16,mat('#cfc9ac'));}}
 b.finish();root.position.set(item.x,0,item.z);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.planItem=item.id;}});if(!previewOnly)globals.add(root);return root;
}
function apply(quiet=false){const s=game.state;h.applyOriginalState(s,quiet);for(const [id,n] of sceneNodes){const at=originalLocation(id,s),fallback=originals.get(id);h.positionObject(n,(at||fallback).x,(at||fallback).z,!!at);}
 if(!quiet){const ids=new Set(s.items.map(i=>i.id));for(const [id,r] of roots)if(!ids.has(id)){globals.remove(r);roots.delete(id);}for(const i of s.items){if(!roots.has(i.id))roots.set(i.id,createModel(i));roots.get(i.id).position.set(i.x,0,i.z);}}
 h.greenSpaces.splice(0,h.greenSpaces.length,...baseGreens.flatMap(c=>{const at=c.id?originalLocation(c.id,s):c;return at?[{...c,...at}]:[];}));for(const i of s.items)if(['tree','planter','rain'].includes(i.type))h.greenSpaces.push({x:i.x,z:i.z,r:i.type==='tree'?1.55:i.type==='rain'?1.2:.5});if(!quiet){h.refreshGreen();save();render();}}
function save(){try{localStorage.setItem('xiangli-plan-v4',JSON.stringify(game.state));}catch(_){} }
function finish(result){
 if(typeof result==='function') {
  if(typeof VillageScore==='undefined') return finish(result());
  const action=result, live=game;
  const before={s:live.state,m:metrics()};
  before.next=VillageOps.project(before.s,before.m);
  let after, trial;
  try {
   game=window.VillageBudget.create(before.s);
   trial=action();
   if(trial.ok){apply(true);after={s:game.state,m:metrics()};after.next=VillageOps.project(after.s,after.m);}
  } finally {game=live;apply(true);}
  if(!trial.ok){toast(trial.error);return false;}
  VillageScore.preview(before,after,()=>{
   if(JSON.stringify(live.state)!==JSON.stringify(before.s)){toast('方案已变化，请重新预览。');return;}
   if(finish(action())){
    cancel();
    for(const id of ['building-dialog','item-dialog','map-dialog']) if($(id).open) $(id).close();
   }
  });
  return false;
 }
 if(!result.ok){toast(result.error);return false;}apply();toast('方案已更新。剩余预算 '+money(game.state.balance)+'。');return true;}
let candidate=null,blockedLampSite=null,lampPreview=null;
function start(type,id=null){
 if(type==='new'&&!itemSpec(id))return;
 cancel();tool={type,id};
 if(h.comparison())api.setCompare(false);
 $('placement-bar').hidden=false;
 const c=type==='new'?itemSpec(id):type==='object'?objectSpec(id):{name:'迁建设施',price:10};
 $('shop-dialog').close();
 if(type==='new'){
  $('placement-instruction').textContent=c.name+' · '+money(c.price)+' · 点击场景中的地面选址';
  $('placement-map').hidden=false;
  return;
 }
 h.setView('top');
 if(type==='object'&&sceneNodes.get(id)?.type==='prop'){mapLayer='objects';$('map-layer').value='objects';}
 $('placement-instruction').textContent=c.name+' · '+money(c.price)+' · 在地图上选址';
 renderMap();$('map-dialog').showModal();
}
function cancel(){
 const had=!!tool;
 tool=null;candidate=null;blockedLampSite=null;ghost.visible=false;
 if(lampPreview)lampPreview.visible=false;
 $('placement-study').hidden=true;$('placement-bar').hidden=true;
 $('placement-map').hidden=true;$('confirm-placement').hidden=true;$('nearby-placement').hidden=true;
 return had;
}
function pickSite(x,z){
 if(tool?.type!=='new')return false;
 candidate=null;
 x=Math.round(x*2)/2;z=Math.round(z*2)/2;
 const spec=specForTool(),error=validate(spec,x,z);
 preview({x,z});
 const button=$('confirm-placement');
 blockedLampSite=error&&tool.id==='lamp'?{x,z}:null;
 $('nearby-placement').hidden=!blockedLampSite;
 button.hidden=!!error;
 if(error){$('placement-instruction').textContent=error+'。可以点旁边的空地重选。';return false;}
 candidate={x,z};
 $('placement-instruction').textContent=spec.name+' · ('+x+', '+z+') · '+money(spec.price)+' · 可点击地面重选';
 return true;
}
$('nearby-placement').onclick=()=>{
 if(!blockedLampSite||tool?.type!=='new'||tool.id!=='lamp')return;
 const from=blockedLampSite;
 let best=null,distance=Infinity;
 for(let dx=-3;dx<=3;dx+=.5)for(let dz=-3;dz<=3;dz+=.5){
  const d=dx*dx+dz*dz,x=from.x+dx,z=from.z+dz;
  if(d<=9&&d<distance&&!validate('lamp',x,z)){best={x,z};distance=d;}
 }
 if(best)pickSite(best.x,best.z);
 else toast('这附近三米内没有合适的位置，请到前后路段试试。');
};
$('confirm-placement').onclick=()=>{if(candidate)place(candidate.x,candidate.z);};
$('placement-map').onclick=()=>{renderMap();$('map-dialog').showModal();};
function specForTool(){return tool?.type==='new'?itemSpec(tool.id):tool?.type==='object'?objectSpec(tool.id):itemSpec(game.state.items.find(i=>i.id===tool?.id)?.type);}
function place(x,z){if(!tool)return false;if(tool.type==='note'){if(x< -55||x>55||z< -65||z>65){toast('请在街区地图范围内添加便签');return false;}pinDraft={x:Math.round(x*2)/2,z:Math.round(z*2)/2};cancel();openPin();return true;}x=Math.round(x*2)/2;z=Math.round(z*2)/2;const spec=specForTool(),skip=tool.type==='object'||tool.type==='move'?tool.id:null;const error=validate(spec,x,z,skip);if(error){toast(error);$('map-explanation').textContent=error;return false;}
 const choice={...tool};const result=()=>choice.type==='new'?game.buy(choice.id,x,z):choice.type==='object'?game.editObject(choice.id,spec.name,spec.price,{x,z}):game.moveItem(choice.id,x,z);if(finish(result)){cancel();renderMap();return true;}return false;}
function preview(point){
 if(!tool)return;
 const c=specForTool();if(!c)return;
 const at=candidate||point,x=Math.round(at.x*2)/2,z=Math.round(at.z*2)/2;
 const error=validate(c,x,z,tool.type==='new'?null:tool.id);
 ghost.visible=true;ghost.position.set(x,.17,z);ghost.scale.set(c.w,1,c.d);
 ghost.material.color.set(error?'#bc6857':'#86b76e');
 if(tool.type==='new'&&tool.id==='lamp'){
  if(!lampPreview){lampPreview=createModel({id:'lamp-preview',type:'lamp',x,z},true);scene.add(lampPreview);}
  lampPreview.position.set(x,0,z);lampPreview.visible=!error;
 }
}
function inspectBuilding(id){
 if ($('place-facts')) $('place-facts').hidden=true;
 if ($('place-record-label')) $('place-record-label').textContent='建筑档案';
noteTarget='building-'+id;$('selection-note').value=game.state.notes[noteTarget]||'';knowledge?.inline('node-theory','light');const paid=game.state.renovated.includes(id);$('renovate').disabled=paid;$('renovate').textContent=paid?'已整修 · 可撤销上一步':'立面整修 · 18万';const original=api.livingCapacity(api.baseBuildings[id]), current=api.livingCapacity(api.activeBuilding(id));
 $('building-capacity').hidden=false;$('building-capacity').textContent='估算出租房间 '+api.roomCount(api.baseBuildings[id])+' → '+api.roomCount(api.activeBuilding(id))+' 间；按 '+game.state.occupancy+' 人/间，容量 '+original+' → '+current+' 人。';
 $('move-building').hidden=false;$('move-building').disabled=!!game.state.buildingWorks[id]||!!game.state.objectEdits['building-'+id];$('relocate-building').hidden=!!game.state.buildingWorks[id];$('relocate-building').textContent='原型迁建 · '+money(objectSpec('building-'+id).price);

 const config = api.baseBuildings[id].config;
 const area = config.w * config.d * (config.floors + 1);
 const unavailable = !!game.state.buildingWorks[id] || !!game.state.objectEdits['building-'+id];
 for (const [buttonId, work, title] of [['panel-clear-building','clear','拆除腾地'], ['panel-rebuild-building','rebuild','退界重建']]) {
  const button = $(buttonId);
  if (!button) continue;
  const cost = buildingCost(area, work);
  button.hidden = false;
  button.textContent = title + ' · ' + money(cost);
  button.disabled = unavailable || cost > game.state.balance;
  button.title = unavailable ? '已实施拆建或迁建，可撤销后重新选择' : cost > game.state.balance ? '预算不足' : '查看方案并确认施工';
 }
 $('relocate-building').disabled = unavailable || objectSpec('building-'+id).price > game.state.balance;
 $('export').hidden=!api.activeBuilding(id);$('renovate').disabled=paid||!!game.state.buildingWorks[id];$('move-stall').hidden=true;$('remove-original').hidden=true;$('object-policy').hidden=true;}
function inspectNode(id){
 for (const buttonId of ['panel-clear-building','panel-rebuild-building']) { if ($(buttonId)) $(buttonId).hidden = true; }
noteTarget='node-'+id;$('selection-note').value=game.state.notes[noteTarget]||'';knowledge?.inline('node-theory',['drain','pit'].includes(id)?'water':id==='bikes'?'hazard':id==='craft-home'?'economy':['hall','story-corner'].includes(id)?'culture':'human');const note=sceneNodes.get(id);if(note?.storyEn)$('node-detail').innerHTML='<b>'+esc(note.kind)+'</b>'+esc(note.lesson)+'<div class="culture-translation"><small>SHARE THE EVERYDAY</small><p>'+esc(note.storyEn)+'</p></div>';$('building-capacity').hidden=true;$('move-building').hidden=true;$('relocate-building').hidden=true;const n=sceneNodes.get(id),spec=objectSpec(id),removed=!n.root.visible;

 if ($('place-record-label')) $('place-record-label').textContent='地点档案';
 if ($('place-facts')) {
  const state = removed ? '已撤除' : n.type === 'hazard' ? (game.state.resolved.includes(id) ? '已改善' : '待改善') : game.state.objectEdits[id] || game.state.moved[id] ? '已迁移' : '原有设施';
  const facts = [['地点类型',n.kind], ['当前状态',state], ['占地尺寸',n.size[0].toFixed(1)+' × '+n.size[2].toFixed(1)+' m'], ['调整方式',spec ? '可搬迁、撤除' : n.type==='hazard' ? '原地改善' : '保留原址']];
  $('place-facts').innerHTML=facts.map(([label,value])=>'<div><small>'+esc(label)+'</small><b>'+esc(value)+'</b></div>').join('');
  $('place-facts').hidden=false;
 }
 $('move-stall').disabled=!!spec && spec.price>game.state.balance;
 $('remove-original').disabled=!!spec && spec.remove>game.state.balance;
 $('move-stall').hidden=$('remove-original').hidden=!spec||removed;
 $('object-policy').hidden=!!spec&&!removed;$('object-policy').textContent=removed?'已撤除，可撤销后重新布置。':fixed[id]||'';
 if(spec){$('move-stall').textContent='搬迁 · '+money(spec.price);$('remove-original').textContent='撤除 · '+money(spec.remove);}
 if(removed)$('resolve').hidden=true;if(n?.type==='hazard'){$('resolve').disabled=game.state.resolved.includes(id)||{waste:80,bikes:120,pit:40,drain:30}[id]>game.state.balance;$('resolve').textContent=game.state.resolved.includes(id)?'已改善 · 可撤销上一步':n.action+' · '+money({waste:80,bikes:120,pit:40,drain:30}[id]);}}
function buyRenovation(){const id=api.selected;const ok=finish(()=>game.renovate(id));if(ok)toast('已支出18万整修立面；楼高与楼间距不变，逐层直射日照不变。');return ok;}function buyHazard(){const id=h.activeNode();return finish(()=>game.resolve(id));}function buyGreening(){return finish(()=>game.green());}
function selectItem(id){const i=game.state.items.find(i=>i.id===id);if(!i)return;chosenItem=id;$('item-note').value=game.state.notes['item-'+id]||'';const c=itemSpec(i.type);$('item-title').textContent=c.name;$('item-description').textContent=c.lesson+' 位置：('+i.x+', '+i.z+')，购置 '+money(c.price)+'。';knowledge?.inline('item-theory',['rain','paving'].includes(i.type)?'water':i.type==='service'?'gis':['craft','story'].includes(i.type)?'culture':i.type==='studio'?'economy':'planning');$('item-dialog').showModal();}
// Weighted resident access to baseline and added community service, along a small road graph.
const graphPoints=[[-42,10],[-17,10],[0,10],[18,10],[47,10],[0,-28],[0,63],[-42,-58],[-42,65],[-17,-44],[-17,59],[18,-44],[18,59]],edges=[[0,1],[1,2],[2,3],[3,4],[2,5],[2,6],[0,7],[0,8],[1,9],[1,10],[3,11],[3,12]];
const dist=graphPoints.map((_,i)=>graphPoints.map((_,j)=>i===j?0:Infinity));for(const [a,b] of edges)dist[a][b]=dist[b][a]=Math.hypot(graphPoints[a][0]-graphPoints[b][0],graphPoints[a][1]-graphPoints[b][1]);for(let k=0;k<dist.length;k++)for(let i=0;i<dist.length;i++)for(let j=0;j<dist.length;j++)dist[i][j]=Math.min(dist[i][j],dist[i][k]+dist[k][j]);
function project(p){let best=null;for(const [a,b] of edges){const aa=graphPoints[a],bb=graphPoints[b],dx=bb[0]-aa[0],dz=bb[1]-aa[1],len=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((p.x-aa[0])*dx+(p.z-aa[1])*dz)/(len*len))),x=aa[0]+t*dx,z=aa[1]+t*dz,d=Math.hypot(p.x-x,p.z-z);if(!best||d<best.d)best={a,b,t,len,d};}return best;}
function walkDistance(a,b){const p=project(a),q=project(b);let ans=Infinity;for(const [i,di] of [[p.a,p.t*p.len],[p.b,(1-p.t)*p.len]])for(const [j,dj] of [[q.a,q.t*q.len],[q.b,(1-q.t)*q.len]])ans=Math.min(ans,p.d+q.d+di+dist[i][j]+dj);if(p.a===q.a&&p.b===q.b)ans=Math.min(ans,p.d+q.d+Math.abs(p.t-q.t)*p.len);return ans;}
function serviceLocations(state){return [originalLocation('service-home',state),...state.items.filter(i=>i.type==='service')].filter(Boolean);}
function reach(points){
 let served=0,total=0;
 for(const b of buildings){
  if(!b.root.visible)continue;
  const c=b.config,n=api.livingCapacity(b),entrance={x:c.x+Math.sin(c.rotation)*c.d/2,z:c.z+Math.cos(c.rotation)*c.d/2};
  total+=n;if(points.some(point=>walkDistance(entrance,point)<=80))served+=n;
 }
 return {served,total,percent:total?Math.round(100*served/total):0};
}
function lessonDialog(title,result,next,observe,retry){
 $('field-title').textContent=title;$('field-result').textContent=result;$('field-next').textContent=next;
 $('field-retry').onclick=()=>{$('field-dialog').close();if(finish(game.undo()))retry?.();};
 $('field-view').onclick=()=>{$('field-dialog').close();if(observe)api.setObservation(observe);if(observe==='gis'){mapLayer='service';$('map-layer').value='service';renderMap();$('map-dialog').showModal();}};
 $('field-dialog').showModal();
}
$('close-field').onclick=()=>$('field-dialog').close();
function reviewObject(id,before,old,at,prediction){
 const after=metrics(),n=sceneNodes.get(id);
 if(id.startsWith('building-')){
  const current=api.lightProfiles[Number(id.slice(9))];
  lessonDialog('换个位置，日照和步行路线都会变','迁建后临街中层冬至直射日照 '+current.middle+' 分钟。全区居住容量 '+before.housing.after+' → '+after.housing.after+' 人，80 米步行服务覆盖 '+before.coverage+'% → '+after.coverage+'%。','比较楼层日照，再看居民到便民设施的路线。迁建也需要施工周转。','light',()=>start('object',id));return;
 }
 if(['breakfast','waste','craft-home','service-home','tea-corner'].includes(id)){
  const prior=reach(old?[old]:[]).served,next=reach(at?[at]:[]).served;
  lessonDialog('沿路能走到的人，变了吗？',n.title+' 80 米步行可达的估算人口 '+prior+' → '+next+' 人。便民服务总体覆盖 '+before.coverage+'% → '+after.coverage+'%。'+(prediction?((prior!==next)===(prediction==='change')?' 结果与你的预测一致。':' 结果与你的预测不同。'):''),'试换到横巷与主路的交会点。比较路网距离，再考虑路口是否会挡住居民或清运车辆。','gis',()=>start('object',id));
 }else if(baseGreens.some(c=>c.id===id)){
  lessonDialog('树冠和种植地是两件事','冠层投影 '+before.green+'% → '+after.green+'%，地面种植率 '+before.ground.after+'% → '+after.ground.after+'%。','试沿通道边缘重新选址。留出通行宽度，再观察绿量统计。','green',()=>start('object',id));
 }else lessonDialog('通行空间与生活设施',n.title+'已'+(at?'搬迁':'撤除')+'。选址避开模型标出的连续通行带。','沿巷走一次，看看出口和转角是否留有空间。需要时重新选址。','risk',()=>start('object',id));
}
function chooseSite(x,z){
 if(!tool||tool.type==='note')return place(x,z);
 if(tool.type==='new'&&tool.id==='lamp'){
  const valid=pickSite(x,z);
  if(valid)$('map-dialog').close();
  else $('map-explanation').textContent=$('placement-instruction').textContent;
  return valid;
 }
 x=Math.round(x*2)/2;z=Math.round(z*2)/2;
 const choice=tool,position={x,z},spec=specForTool(),panel=$('placement-study');
 const error=validate(spec,x,z,choice.type==='new'?null:choice.id);
 if(error){panel.hidden=true;$('map-explanation').textContent=error;toast(error);return false;}
 const movingType=choice.type==='move'?game.state.items.find(i=>i.id===choice.id)?.type:choice.id;
 const service=movingType==='service'||movingType==='service-home';
 const water=['rain','paving'].includes(movingType);
 const local=choice.type==='object'&&['breakfast','waste','craft-home','tea-corner'].includes(choice.id);
 const theme=service||local?'路网可达性':water?'下垫面与产流':choice.type==='object'?'设施与生活空间':'选址与公共空间';
 let question=local?'迁到这个位置后，80 米步行可达的人数会变吗？':service?'同一座设施放在这里，80 米步行覆盖会增加吗？':water?'同样一场雨，透水地面与硬地的产流会相同吗？':'这处设施搬入后，会给通行和日常使用带来什么变化？';
 panel.innerHTML='<b>'+theme+'</b><p>'+question+'</p><label>先猜一猜 <select id="site-prediction"><option value="">可跳过</option><option value="change">会变</option><option value="same">变化不明显</option></select></label> <button id="site-confirm" class="pill">确认在这里施工</button>';
 panel.hidden=false;
 $('site-confirm').onclick=()=>{
  if(tool!==choice)return;
  const before=metrics(),prior=choice.type==='object'&&!choice.id.startsWith('building-')?originalLocation(choice.id,game.state):null,prediction=$('site-prediction').value;
  if(!place(x,z))return;
  $('map-dialog').close();
  if(choice.type==='object'){reviewObject(choice.id,before,prior,position,prediction);return;}
  const after=metrics(),change=service?after.coverage!==before.coverage:water?after.reduced!==before.reduced:null;
  const result=service?'80 米步行覆盖 '+before.coverage+'% → '+after.coverage+'%。直线近的住宅也可能需要沿巷绕行。':water?'当前降雨情境下，示意产流减少量 '+before.reduced+' → '+after.reduced+' m³。效果与设施面积、降雨量及渗透假设有关。':'已通过通行带和重叠检查。你可以回到街巷走访，检查这个位置是否便于实际使用。';
  lessonDialog(theme,result+(prediction&&change!==null?(change===(prediction==='change')?' 结果与你的预测一致。':' 结果与你的预测不同。'):''),service?'再试一个路口，用同一座设施比较可达性。':water?'切换降雨情境，比较降雨量如何影响产流估算。':'换一个地点，比较设施与巷口、住宅和公共空间的关系。',service?'gis':water?'water':null,()=>start(choice.type,choice.id));
 };
 return true;
}
function sunCoverage(profiles){const floors=profiles.flatMap(rows=>rows);return floors.length?Math.round(100*floors.filter(min=>min>=60).length/floors.length):0;}
const diagnosis={
 water:{
  title:'下雨后，为什么偏偏这里积水？',
  explain:'雨洪敏感性表示在给定情境下，哪些位置更容易汇集积水。硬地让更多雨水留在地表，低处汇水，雨水口堵塞或下游管网排不及时，会使水暂时排不走。还要看人和设施是否处在积水范围内。',
  measures:[['雨水口堵塞','清理并定期巡查；如果清完仍积水，要核对高程和下游管网。','drain'],['屋面、广场硬地多','设置雨水花园或透水铺装。前者要能接到汇水并预留溢流，后者需要合适的基层和防堵维护。','rain'],['暴雨超出管网能力','组合调蓄、管网和安全行泄通道，必要时设置预警与绕行。单一小设施只能改善一部分。','water']],
  keywords:'下垫面 · 产流与汇流 · 低影响开发（LID） · 雨洪模型（SWMM）',
  links:[['广州市水务局《海绵城市建设—洪涝安全评估技术指引》','https://swj.gz.gov.cn/gkmlpt/content/9/9983/post_9983905.html'],['美国环保署：雨水花园、透水铺装及其工作方式','https://www.epa.gov/green-infrastructure/types-green-infrastructure']]
 },
 light:{
  title:'楼层为什么晒不到太阳？',
  explain:'太阳的高度和方位随季节、时刻变化。低楼层、较高的对面建筑、狭窄楼距和背向太阳的立面，都可能减少直射。窗户面积、室内进深与天空散射光还会影响室内亮度。',
  measures:[['对楼太高或距离太近','在设计或更新时比较退界、降层、错位布置和保留采光间隙。优先查受影响的低层，也要看周转安置。','building'],['同一栋楼各朝向差异大','在可改建条件下调整朝向与居住空间布置，把主要使用空间留给较有日照的立面。','light'],['室内白天仍暗','评估窗洞、遮挡和室内进深；具体改法需要结构与采光校核。','light']],
  keywords:'太阳高度角与方位角 · 日照间距 · 高宽比（H/W） · 天空可视因子（SVF）',
  links:[['住房城乡建设部：《城市居住区规划设计标准》公告','https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_238590.html']]
 },
 green:{
  title:'树冠多，地面绿化率就高吗？',
  explain:'地面种植率看种植床和树池实际占地，树冠覆盖看从上往下投影的面积。两者都除以同一教学区域面积。树冠可以伸到硬地上方；小花槽能增加地面种植面积，但遮阴范围有限。',
  measures:[['街口缺少遮阴','先保留成熟树，再在有树池空间的候车点或步行路边种乔木，预留根系和通行宽度。','tree'],['门口空间小','选花槽或在公共空间边缘补绿。它们能增加绿量，遮阴效果与乔木不同。','planter'],['有可接雨水的低处','比较雨水花园与单纯花槽，同时看种植面积和产流。评估溢流去向。','rain']],
  keywords:'树冠投影 · 绿地率与绿化覆盖率 · 蒸散 · 热舒适 · 绿色基础设施',
  links:[['广州市林业和园林局《广州市海绵城市绿地建设指引（2024年版）》','https://lyylj.gz.gov.cn/gkmlpt/content/9/9564/post_9564254.html']]
 }
};
function openDiagnosis(kind){
 const d=diagnosis[kind];if(!d)return;
 const m=metrics(),live=kind==='water'?'当前 '+rainfall+' mm/小时情境，设施示意减少 '+m.reduced+' m³ 地表产流。敏感性颜色为教学情境，不代表实际积水深度。':kind==='light'?'≥60 分钟的楼层占比 '+m.sun.before+'% → '+m.sun.after+'%。60 分钟为游戏比较阈值，当前按仍存在的楼层统计；同时看逐层分钟和容量。':'地面种植率 '+m.ground.before+'% → '+m.ground.after+'%，树冠覆盖 '+m.canopyBefore+'% → '+m.green+'%。二者使用固定范围，树冠重叠只计一次。';
 $('diagnosis-title').textContent=d.title;
 $('diagnosis-content').innerHTML='<p>'+d.explain+'</p><p><b>当前方案</b> '+live+'</p><h3>常用办法与适用条件</h3>'+d.measures.map(([caseName,explain,action])=>'<article><b>'+caseName+'</b><p>'+explain+'</p><button class="pill" data-diagnose-action="'+action+'">在街区试一试 →</button></article>').join('')+'<h3>深入阅读</h3><p>'+d.keywords+'</p><ul>'+d.links.map(([label,url])=>'<li><a href="'+url+'" target="_blank" rel="noopener">'+label+'</a></li>').join('')+'</ul>';
 $('diagnosis-dialog').showModal();
}
$('close-diagnosis').onclick=()=>$('diagnosis-dialog').close();
$('diagnosis-content').onclick=e=>{
 const action=e.target.closest('[data-diagnose-action]')?.dataset.diagnoseAction;if(!action)return;
 $('diagnosis-dialog').close();$('map-dialog').close();
 if(itemSpec(action)){start('new',action);return;}
 if(action==='drain'){api.inspectNode('drain');h.focus();return;}
 if(action==='building'){api.select(api.selected);api.setObservation('light');if(!$('move-building').disabled)$('move-building').onclick();else toast('请选择一栋尚未拆建或迁建的民居。');return;}
 api.setObservation(action);
};
$('map-diagnosis').onclick=()=>openDiagnosis(mapLayer);
$('study-diagnosis').onclick=()=>openDiagnosis(h.observation());
// Compare the same original households in both scenarios, using each doorway's route.
const doorway = c => ({x:c.x+Math.sin(c.rotation)*c.d/2,z:c.z+Math.cos(c.rotation)*c.d/2});
const originalDoors = api.baseBuildings.map(b=>doorway(b.config));
function accessChange(services){
 const gained=[],lost=[],outside=[];
 let newlyServed=0,noLongerServed=0;
 api.baseBuildings.forEach((base,i)=>{
  const current=buildings[i],was=walkDistance(originalDoors[i],originals.get('service-home'))<=80;
  const active=current.root.visible,covered=active&&services.some(p=>walkDistance(doorway(current.config),p)<=80);
  const oldCapacity=api.livingCapacity(base),kept=active?Math.min(oldCapacity,api.livingCapacity(current)):0;
  if(!was&&covered&&kept){gained.push(i);newlyServed+=kept}
  if(was){const loss=oldCapacity-(covered?kept:0);if(loss){lost.push(i);noLongerServed+=loss}}
  if(active&&!covered)outside.push(i);
 });
 return {gained,lost,outside,newlyServed,noLongerServed};
}
function metrics(){const s=game.state,services=serviceLocations(s);let served=0,total=0;for(const b of buildings){if(!b.root.visible)continue;const c=b.config,n=api.livingCapacity(b),totalDistance=Math.min(...services.map(v=>walkDistance({x:c.x+Math.sin(c.rotation)*c.d/2,z:c.z+Math.cos(c.rotation)*c.d/2},v)));total+=n;if(totalDistance<=80)served+=n;}
 const reduced=s.items.reduce((sum,i)=>{const c=itemSpec(i.type);return sum+(i.type==='rain'?c.w*c.d*.65:i.type==='paving'?c.w*c.d*.4:0);},0)*rainfall/1000;
 const before=api.baseBuildings.reduce((sum,b)=>sum+api.livingCapacity(b),0);
 const affected=api.baseBuildings.reduce((sum,b)=>sum+(s.buildingWorks[b.config.id]||s.objectEdits['building-'+b.config.id]?api.livingCapacity(b):0),0);
 let gain=0,loss=0;
 for(const p of api.lightProfiles)if(!s.buildingWorks[p.id])p.rows.forEach((v,i)=>{if(v>api.baselineSun[p.id][i])gain++;if(v<api.baselineSun[p.id][i])loss++;});
 return {served,access:accessChange(services),housing:{peoplePerRoom:s.occupancy,roomsBefore:api.baseBuildings.reduce((sum,b)=>sum+api.roomCount(b),0),roomsAfter:buildings.reduce((sum,b)=>sum+api.roomCount(b.root.visible?b:null),0),before,after:total,affected,gap:Math.max(0,before-total)},sun:{gain,loss,before:sunCoverage(api.baselineSun),after:sunCoverage(api.lightProfiles.map(p=>p.rows))},ground:{before:baselineGround,after:greenGround(s)},canopyBefore:originalCanopy,green:api.greenCoverage(),coverage:total?Math.round(served/total*100):0,reduced:+reduced.toFixed(2),culture:s.items.filter(i=>['craft','story','studio','tea'].includes(i.type)).length,solved:s.resolved.length,retained:buildings.length-Object.keys(s.buildingWorks).length};}
function render(){const s=game.state;$('study-diagnosis').hidden=!diagnosis[h.observation()];$('budget-left').textContent=money(s.balance);$('budget-spent').textContent='已用 '+money(s.initial-s.balance)+' / 总额'+money(s.initial);$('undo-plan').disabled=!game.canUndo;$('undo-plan').title=game.canUndo?'撤销全局最近一步：'+(s.ledger.at(-1)?.label||'方案操作'):'暂无可撤销操作';inspectBuilding(api.selected);if(h.activeNode())inspectNode(h.activeNode());$('greening').disabled=s.greening;$('greening').textContent=s.greening?'已补绿 · 12万已计入':'三处补绿 · 12万';renderShop();renderMap();renderReport();knowledge?.inline('theory-context',h.observation());if(['water','human','gis'].includes(h.observation()))showStudy(h.observation());}
function openIndicatorMap(layer){
 if(tool)cancel();search='';$('map-search').value='';mapLayer=layer;$('map-layer').value=layer;view={x:0,y:0,w:840,h:900};renderMap();if(!$('map-dialog').open)$('map-dialog').showModal();
}
const shopIndicators = {
 tree: {tags:['树冠覆盖 ↑','地面种植 ↑'], score:'生态环境', timing:'施工后更新', note:'新增树冠与树池面积计入绿化；重叠部分不重复计算，达到评分目标后不再加分。'},
 rain: {tags:['地面种植 ↑','树冠覆盖 ↑','模拟产流减少 ↑'], score:'生态环境', timing:'施工后更新', note:'种植面积与模型中的植被冠层参与生态计分；产流改善随降雨情境变化，作为独立指标展示。'},
 paving: {tags:['模拟产流减少 ↑'], score:'当前不直接计分', timing:'施工后更新', note:'减少这块铺装的模拟产流，不增加地面种植或树冠覆盖。'},
 bench: {tags:['预计幸福度 ↑','人口变化（间接）'], score:'居民生活', timing:'月末结算', cap:'bench', note:'长椅改善月度生活体验；幸福度可能带动迁入，仍受住房容量限制。'},
 tea: {tags:['文化交往设施 +1'], score:'社区延续', timing:'施工后更新', culture:true, note:'计入文化与交往设施数量；当前规则不直接增加幸福度或商业收入。'},
 service: {tags:['步行服务覆盖 ↑','原住受益容量 ↑','预计幸福度 ↑'], score:'公共服务 · 居民生活', timing:'覆盖即时 / 生活月末', note:'按沿街巷 80 米步行范围计算。覆盖已有服务区可能没有新增收益，选址后核算实际变化。'},
 parking: {tags:['预计整洁度 ↑','预计幸福度（间接）'], score:'居民生活', timing:'月末结算', cap:'parking', note:'规范停放改善月度整洁度，再间接影响幸福度。已有乱停阻路隐患仍需现场整治。'},
 lamp: {tags:['预计幸福度 ↑','人口变化（间接）'], score:'居民生活', timing:'月末结算', cap:'lamp', note:'夜间照明改善生活体验，不增加白天日照，也不自动消除重点隐患。'},
 craft: {tags:['文化交往设施 +1'], score:'社区延续', timing:'施工后更新', culture:true, note:'计入文化与交往设施数量；当前规则不单独计算游客或经营收入。'},
 story: {tags:['文化交往设施 +1'], score:'社区延续', timing:'施工后更新', culture:true, note:'计入文化与交往设施数量；当前规则不单独计算文化传播范围。'},
 studio: {tags:['文化交往设施 +1'], score:'社区延续', timing:'施工后更新', culture:true, note:'计入文化与交往设施数量；当前规则尚未单独计算就业和产业收入。'},
 planter: {tags:['地面种植 ↑','树冠覆盖 ↑'], score:'生态环境', timing:'施工后更新', note:'花槽种植面积与模型中的小型植被冠层计入绿化；重叠面积不重复计入。'}
};
function shopIndicatorCard(item, state) {
 const info=shopIndicators[item.id];
 const count=info.culture ? state.items.filter(i=>['craft','story','studio','tea'].includes(i.type)).length : state.items.filter(i=>i.type===info.cap).length;
 const limit=info.culture ? '文化设施计分 '+Math.min(count,3)+'/3 处；'+(count>=3?'已达上限，继续建设只增加设施数量。':'每新增一处可增加社区延续 1 分，合计最多 3 分。') : info.cap ? '本类生活增益 '+Math.min(count,3)+'/3 处；'+(count>=3?'已达上限，继续建设不再叠加该项生活增益。':'同类前 3 处参与月度生活预测，最终变化受取整与指标上限影响。') : '';
 const upkeep=Math.ceil((state.items.length+1)/3)-Math.ceil(state.items.length/3);
 return '<section class="shop-indicators" aria-label="关联指标"><div class="shop-indicator-tags">'+info.tags.map(tag=>'<span>'+esc(tag)+'</span>').join('')+'</div><dl><div><dt>关联评分</dt><dd>'+esc(info.score)+'</dd></div><div><dt>生效时间</dt><dd>'+esc(info.timing)+'</dd></div></dl><p>'+esc(info.note)+'</p>'+(limit?'<p class="shop-limit">'+esc(limit)+'</p>':'')+'<p class="shop-cost-effect">运营影响 · 预计月维护费增加 '+upkeep+' 万（每累计 3 处设施计 1 万，不足 3 处按 1 组）。实际总分以选址后预览为准。</p></section>';
}
function renderShop(){
 const categories=['全部','自然与生态','街坊生活','广府与湾区'];
 const state=game.state;
 $('shop-categories').innerHTML=categories.map(v=>'<button class="'+(v===category?'active':'')+'" data-category="'+v+'">'+v+'</button>').join('');
 $('shop-items').innerHTML=catalog.filter(c=>category==='全部'||c.category===category).map(c=>'<article><small>'+c.category+'</small><h3>'+c.name+'</h3><p>'+c.description+'</p>'+shopIndicatorCard(c,state)+'<div><b>'+money(c.price)+'</b><span>'+c.w+'×'+c.d+'m</span></div><button data-buy="'+c.id+'" '+(state.balance<c.price?'disabled':'')+'>'+(state.balance<c.price?'预算不足':'选择并选址 →')+'</button></article>').join('');
}
$('occupancy-scenario').onchange=e=>finish(game.setOccupancy(+e.target.value));
function renderReport(){const s=game.state,m=metrics();if(typeof VillageOps!=='undefined')VillageOps.update(s,m,openIndicatorMap,(book,income,cost)=>{if(!game.settleMonth(book,income,cost))return false;save();render();return true;});$('occupancy-scenario').value=String(s.occupancy);$('report-summary').innerHTML='<div class="report-stats"><div><small>剩余预算</small><b>'+money(s.balance)+'</b></div><div><small>新增设施</small><b>'+s.items.length+' 处</b></div><div><small>示意步行服务覆盖</small><b>'+m.coverage+'%</b></div><div><small>示意树冠覆盖</small><b>'+m.green+'%</b></div></div><h3>同一个决定，几种影响</h3><table class="impact-table"><thead><tr><th>学科视角</th><th>原状 → 现方案</th><th>讨论什么</th></tr></thead><tbody><tr><td>人口地理 × 住房规划</td><td>'+m.housing.before+' → '+m.housing.after+' 人</td><td>周转涉及 '+m.housing.affected+' 人；原地容量缺口 '+m.housing.gap+' 人。租户和经营者如何参与？</td></tr><tr><td>自然地理 × 建筑物理</td><td>≥60 分钟楼层占比 '+m.sun.before+'% → '+m.sun.after+'%；保留民居 '+m.sun.gain+' 层变长、'+m.sun.loss+' 层变短</td><td>谁得到了阳光？腾地的收益有没有落到原来最暗的楼层？</td></tr><tr><td>景观生态 × 水文</td><td>地面种植率 '+m.ground.before+'% → '+m.ground.after+'%；冠层投影 '+m.canopyBefore+'% → '+m.green+'%</td><td>对比遮阴、土壤下渗和占用面积。腾空的硬地需要实际补绿才计入。</td></tr><tr><td>经济地理 × 社区治理</td><td>模拟支出 '+money(s.initial-s.balance)+'</td><td>改造期间怎样维持早餐、租住和制衣网络？谁承担搬迁与维护成本？</td></tr></tbody></table><p>房间数 '+m.housing.roomsBefore+' → '+m.housing.roomsAfter+' 间。每住宅层按建筑面积 × 72% ÷ 24 m²/间向下取整，再乘住宅层数。首层按商用。容量和周转人数按 '+s.occupancy+' 人/间估算。面积与入住人数都是情境假设。绿化分母固定为地图中部 77 × 116 m 的教学范围，地面种植率只计种植床和树池。</p><p>原有民居保留 '+m.retained+' / 20。祠堂保留原址。早餐档'+(originalLocation('breakfast',s)?'继续营业':'已撤除')+'。已改善'+m.solved+'处观察点，新增'+m.culture+'处文化或交往设施。</p><p>按'+rainfall+'毫米/1小时的教学降雨情境，新增雨水花园和透水铺装的示意产流差值为 '+m.reduced+' m³。它只比较这些小地块的下垫面，不预测街区积水深度。</p>';$('plan-note').value=s.notes.plan||'';$('report-notes').innerHTML='<h3>位置与设施便签</h3>'+Object.entries(s.notes).filter(([k])=>k!=='plan').map(([k,v])=>'<p><b>'+esc(noteLabel(k))+'</b><br>'+esc(v).replace(/\n/g,'<br>')+'</p>').join('')+s.pins.map(p=>'<p><b>位置便签 ('+p.x+', '+p.z+')</b><br>'+esc(p.text).replace(/\n/g,'<br>')+'</p>').join('');$('report-ledger').innerHTML=s.ledger.length?'<table><thead><tr><th>操作</th><th>模拟费用</th></tr></thead><tbody>'+s.ledger.map(l=>'<tr><td>'+esc(l.label)+'</td><td>'+money(l.cost)+'</td></tr>').join('')+'</tbody></table>':'<p>还没有支出。先走访街坊，再决定怎么花这笔钱。</p>';}
function showStudy(value){knowledge?.inline('theory-context',value);const m=metrics();$('study-card').hidden=false;document.body.classList.add('observing');$('greening').hidden=true;const data=value==='water'?['自然地理 · 下垫面 · 灾害风险','雨下得一样，水为什么不同？','改变一块地面的透水性，会改变它的产流。地图上的高低与敏感性是教学合成情境；真实内涝还需地形、管网、降雨、暴露与脆弱性。','<label>一小时降雨情境 <select id="rain-scenario"><option value="30">30毫米</option><option value="60">60毫米</option><option value="100">100毫米</option></select></label><p>新增铺装/雨水花园的示意产流差值：'+m.reduced+' m³</p>']:value==='gis'?['地理信息技术 · 网络分析 · 规划','设施，放在哪里更方便？','同一个驿站，位置不同，沿路走到它的距离就不同。用简化路网最短距离，比较80米步行阈值内的示意住户覆盖。','示意服务覆盖 '+m.coverage+'%<br><small>按估算居住容量加权，不是真实人口统计。距离含入口到路网的近似接入。</small>']:['人文地理 · 产业 · 广府文化','街坊的日常，也是社区的价值。','早餐的便利、较低的生活门槛、邻里互助与制衣产业网络，都是值得延续的资源。广府文化连接本地日常，也通过粤语、手艺和设计与湾区及世界交流。','住宅保留 '+m.retained+'/20 · 早餐档'+(originalLocation('breakfast',game.state)?'继续营业':'已撤除')+'<br>新增文化/交往设施 '+m.culture+' 处'];$('study-domain').textContent=data[0];$('study-title').textContent=data[1];$('study-body').textContent=data[2];$('study-metrics').innerHTML=data[3];if(value==='water'){$('rain-scenario').value=String(rainfall);$('rain-scenario').onchange=e=>{rainfall=+e.target.value;showStudy('water');renderMap();renderReport();};}}
function mapData(){const out=[];for(const n of sceneNodes.values())if(n.root.visible&&(n.type!=='prop'||mapLayer==='objects'||search))out.push({id:n.id,kind:'node',x:n.x,z:n.z,label:n.title,color:n.type==='hazard'?(game.state.resolved.includes(n.id)?'#70975b':'#b77b46'):'#3e715c'});for(const b of buildings)out.push({id:String(b.config.id),kind:'building',x:b.config.x,z:b.config.z,label:'民居'+String(b.config.id+1).padStart(2,'0')+(!b.root.visible?' · 已腾地':''),color:'#849284'});for(const i of game.state.items)out.push({id:i.id,kind:'item',x:i.x,z:i.z,label:itemSpec(i.type).name,color:'#4b88a4'});for(const p of game.state.pins)out.push({id:p.id,kind:'note',x:p.x,z:p.z,label:'便签·'+p.text.slice(0,8)+(p.text.length>8?'…':''),color:'#9a7bb0'});return out;}
const px=x=>(x+60)*6.6,py=z=>(z+68)*6.3;
function renderMap(){if(!tool)$('map-explanation').textContent=mapLayer==='green'?'浅绿轮廓是树冠投影，深绿矩形是地面种植床或树池。点「怎么看这张图」查看改造前后比例。':'地图与场景共享游戏位置数据。';$('map-diagnosis').hidden=!diagnosis[mapLayer]||!!tool;const data=mapData().filter(v=>mapLayer==='hazards'?sceneNodes.get(v.id)?.type==='hazard'&&!game.state.resolved.includes(v.id):mapLayer==='housing'?v.kind==='building':true).filter(v=>!search||v.label.toLowerCase().includes(search.toLowerCase()));let svg='<svg id="map-svg" viewBox="'+[view.x,view.y,view.w,view.h].join(' ')+'" role="img" aria-label="可缩放的街区地图，含道路、建筑、祠堂、商铺和新设施"><rect width="840" height="900" fill="#eeeee3"/><rect x="'+px(44)+'" y="'+py(-60)+'" width="40" height="756" fill="#9dc1b5"/>';
 if(mapLayer==='water')for(let x=-48;x<44;x+=8)for(let z=-56;z<64;z+=8){let pressure=(z+60)/128*.55+.2+(game.state.resolved.includes('drain')?0:.2*Math.exp(-((x-1.7)**2+(z+8)**2)/300));for(const i of game.state.items)if(['rain','paving'].includes(i.type))pressure-=.16*Math.exp(-((x-i.x)**2+(z-i.z)**2)/70);const alpha=Math.max(.02,Math.min(.5,pressure*rainfall/120));svg+='<rect x="'+px(x)+'" y="'+py(z)+'" width="53" height="51" fill="#c49472" opacity="'+alpha.toFixed(2)+'"/>';}
 for(const road of api.roadNetwork){svg+='<polyline points="'+road.points.map(p=>px(p[0])+','+py(p[1])).join(' ')+'" fill="none" stroke="#d0d0bd" stroke-width="'+road.width*6.5+'" stroke-linecap="round"/><polyline points="'+road.points.map(p=>px(p[0])+','+py(p[1])).join(' ')+'" fill="none" stroke="#fffdf2" stroke-width="'+Math.max(2,road.width*6.5-3)+'"/>';}
 svg+='<rect x="'+px(-14)+'" y="'+py(-36)+'" width="185" height="95" fill="#d7d4b7" stroke="#b6b391"/><rect x="'+px(-8)+'" y="'+py(-50)+'" width="106" height="76" fill="#c4b696" stroke="#8f8061"/><text x="'+px(0)+'" y="'+py(-29)+'" class="map-road">祠堂前埕 / 街坊活动</text>';
 const serviceItems=serviceLocations(game.state);for(const b of buildings){const c=b.config,co=Math.cos(c.rotation),si=Math.sin(c.rotation);let fill=b.root.visible?'#b7beb0':'#eae5cf';if(mapLayer==='housing' && (!b.root.visible||api.livingCapacity(b)<api.livingCapacity(api.baseBuildings[c.id])))fill='#d58e70';if(b.root.visible&&mapLayer==='light')fill=new THREE.Color().setHSL(.03+Math.min(api.lightProfiles[c.id].middle/300,1)*.22,.4,.67).getStyle();if(b.root.visible&&mapLayer==='service')fill=Math.min(...serviceItems.map(i=>walkDistance({x:c.x+Math.sin(c.rotation)*c.d/2,z:c.z+Math.cos(c.rotation)*c.d/2},i)))<=80?'#9ebca0':'#c7b6a0';svg+='<polygon data-kind="building" data-id="'+c.id+'" tabindex="0" role="button" aria-label="选择民居 '+(c.id+1)+'" style="cursor:pointer" points="'+[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,d])=>px(c.x+a*c.w/2*co+d*c.d/2*si)+','+py(c.z-a*c.w/2*si+d*c.d/2*co)).join(' ')+'" fill="'+fill+'" stroke="#8d9988" stroke-width="1"/>';}
 if(mapLayer==='green'){
  for(const c of [...h.greenSpaces,...(game.state.greening?h.trialCanopies:[])])svg+='<ellipse cx="'+px(c.x)+'" cy="'+py(c.z)+'" rx="'+c.r*6.6+'" ry="'+c.r*6.3+'" fill="#739f57" fill-opacity=".35" stroke="#4d773b"/>';
  for(const c of [...h.greenSpaces.filter(c=>c.ground),...game.state.items.filter(i=>['tree','planter','rain'].includes(i.type)).map(i=>({...i,w:itemSpec(i.type).w-.2,d:itemSpec(i.type).d-.2})),...(game.state.greening?h.trialCanopies.map(c=>({...c,w:1.2,d:1.2})):[])])svg+='<rect x="'+px(c.x-c.w/2)+'" y="'+py(c.z-c.d/2)+'" width="'+c.w*6.6+'" height="'+c.d*6.3+'" fill="#365b36"/>';
 }
 for(const [x,z,label,rotate] of [[-42,-3,'外缘主路',-90],[0,1,'商业生活巷',-90],[23,10,'东西横巷',0],[18,46,'东侧支巷',-90],[47,-27,'河涌',-90]])svg+='<text x="'+px(x)+'" y="'+py(z)+'" class="map-road" transform="rotate('+rotate+' '+px(x)+' '+py(z)+')">'+label+'</text>';
 for(const v of data){const x=px(v.x),y=py(v.z),small=v.kind==='building';let labelY=y+(small?4:-12);if(v.id==='pit')labelY=y+25;if(v.id==='bikes')labelY=y+23;svg+='<g data-kind="'+v.kind+'" data-id="'+v.id+'" tabindex="0" role="button" aria-label="'+esc(v.label)+'"><circle cx="'+x+'" cy="'+y+'" r="'+(small?2.5:6)+'" fill="'+v.color+'"/><text x="'+(small?x:x+9)+'" y="'+labelY+'" class="'+(small?'map-building':'map-poi')+'">'+esc(v.label)+'</text></g>';}
 svg+='</svg>';$('district-map').innerHTML=svg;$('map-directory').innerHTML=data.map(v=>'<button data-kind="'+v.kind+'" data-id="'+v.id+'"><i style="background:'+v.color+'"></i>'+esc(v.label)+'</button>').join('');$('map-explanation').textContent=tool?.type==='note'?'点击任意地点写便签；便签免费，不改变土地用途。':tool?$('placement-instruction').textContent+'。空白处点击选址，红线区域与既有设施不可重叠。':mapLayer==='water'?'雨洪层是合成情境：用南端低洼趋势与排水口维护状态示意敏感性，不是康乐村灾害风险图。':mapLayer==='light'?'颜色根据简化楼体遮挡代理生成，并非真实日照小时数。':mapLayer==='service'?'绿色表示简化路网80米阈值内的示意服务覆盖；不是法定配置标准。':mapLayer==='housing'?'橙色楼块表示居住容量较开局减少，可点选查看。':mapLayer==='hazards'?'地图目录仅列出尚待现场改善的重点隐患。':'缩放、搜索和点击定位。此图与游戏位置一致，并非真实导航地图。';
 const mini=$('mini-map');mini.innerHTML=svg.replace('id="map-svg"','').replace(/tabindex="0"/g,'');}
function zoom(f){const nw=Math.max(170,Math.min(840,view.w*f)),nh=nw*900/840;view.x+=(view.w-nw)/2;view.y+=(view.h-nh)/2;view.w=nw;view.h=nh;const s=$('map-svg');if(s)s.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));}
function targetFromMap(target){const el=target.closest('[data-kind]');if(!el)return false;const {kind,id}=el.dataset;if(kind==='note'){pinDraft={...game.state.pins.find(p=>p.id===id)};openPin();return true;}if(kind==='node')api.inspectNode(id);else if(kind==='building'){api.select(+id);if($('panel').classList.contains('compact-tools'))$('toolFold')?.click();}else{selectItem(id);return true;}h.focus();$('map-dialog').close();return true;}
let pan=null;
$('district-map').addEventListener('pointerdown',e=>{pan={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,moved:false,target:e.target};$('district-map').setPointerCapture(e.pointerId);});$('district-map').addEventListener('pointermove',e=>{if(!pan||tool)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(Math.hypot(dx,dy)>5)pan.moved=true;const rect=$('district-map').getBoundingClientRect();view.x=pan.vx-dx*view.w/Math.max(1,rect.width);view.y=pan.vy-dy*view.h/Math.max(1,rect.height);$('map-svg')?.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));});$('district-map').addEventListener('pointerup',e=>{if(pan?.moved){pan=null;return;}const clicked=pan?.target||e.target;pan=null;if(tool){const svg=$('map-svg'),point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const p=point.matrixTransform(svg.getScreenCTM().inverse());chooseSite(p.x/6.6-60,p.y/6.3-68);}else targetFromMap(clicked);});$('district-map').addEventListener('pointercancel',()=>{pan=null;});$('district-map').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.2:1/1.2);},{passive:false});
const cultureStops=[
 {id:'hall',en:'Ancestral hall and forecourt',word:'前埕 · cin4 cing4',question:'如果把前埕围起来，节庆和街坊聊天还能在哪里发生？'},
 {id:'breakfast',en:'Rice rolls and congee for breakfast',word:'肠粉 · coeng4 fan2',question:'早餐档搬离上班路口后，谁最不方便？'},
 {id:'tea-corner',en:'Neighbourhood tea table',word:'饮茶 · jam2 caa4',question:'榕树下哪些人需要座位和遮阴？'},
 {id:'craft-home',en:'Garment-making workshop',word:'街坊 · gaai1 fong1',question:'小工坊搬走后，附近的布料、加工与送货还能怎样协作？'}
];
const cultureHeading='广府生活导览 / A Walk Through Cantonese Neighbourhood Life';
$('culture-route').innerHTML=cultureStops.map((stop,i)=>{
 const n=sceneNodes.get(stop.id);
 return '<article><h3>'+ (i+1)+' · '+esc(n.title)+' / '+stop.en+'</h3><small>'+stop.word+'（粤拼 / Jyutping）</small><p>'+esc(n.detail)+'</p><p lang="en">'+esc(n.storyEn||'Garment workshops rely on nearby suppliers, skilled workers and short delivery trips. Upgrading the neighbourhood means making room for those ties to continue.')+'</p><p>'+stop.question+'</p><button class="pill" data-culture-stop="'+stop.id+'">前往这个地点 →</button></article>';
}).join('');
$('open-culture').onclick=()=>$('culture-dialog').showModal();
$('close-culture').onclick=()=>$('culture-dialog').close();
$('culture-route').onclick=e=>{const id=e.target.closest('[data-culture-stop]')?.dataset.cultureStop;if(id){$('culture-dialog').close();api.setView('lane');api.inspectNode(id);h.focus();}};
$('download-culture').onclick=()=>{
 const stops=cultureStops.map((stop,i)=>{const n=sceneNodes.get(stop.id);return '## '+(i+1)+' · '+n.title+' / '+stop.en+'\n\n'+stop.word+'\n\n'+n.detail+'\n\n'+(n.storyEn||'Nearby suppliers, workers and deliveries help garment workshops operate as a network.')+'\n\n'+stop.question;});
 const url=URL.createObjectURL(new Blob(['# '+cultureHeading+'\n\n虚构教学街区 / Fictional learning district\n\n'+stops.join('\n\n')],{type:'text/markdown;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='xiangli-cantonese-walk.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
$('mini-map').onclick=e=>targetFromMap(e.target);$('district-map').addEventListener('keydown',e=>{if(!tool&&['Enter',' '].includes(e.key)){e.preventDefault();targetFromMap(e.target);}});$('map-directory').onclick=e=>targetFromMap(e.target);$('map-search').oninput=e=>{search=e.target.value.trim();renderMap();};$('map-layer').onchange=e=>{mapLayer=e.target.value;renderMap();};$('map-zoom-in').onclick=()=>zoom(1/1.3);$('map-zoom-out').onclick=()=>zoom(1.3);$('map-fit').onclick=()=>{view={x:0,y:0,w:840,h:900};renderMap();};
$('expand-map').onclick=()=>{renderMap();$('map-dialog').showModal();};$('close-map').onclick=()=>$('map-dialog').close();$('open-shop').onclick=()=>{renderShop();$('shop-dialog').showModal();};$('close-shop').onclick=()=>$('shop-dialog').close();$('shop-categories').onclick=e=>{const v=e.target.closest('[data-category]');if(v){category=v.dataset.category;renderShop();}};$('shop-items').onclick=e=>{const b=e.target.closest('[data-buy]');if(b&&!b.disabled)start('new',b.dataset.buy);};$('cancel-placement').onclick=cancel;
$('renovate').onclick=buyRenovation;$('resolve').onclick=buyHazard;$('greening').onclick=buyGreening;$('undo-plan').onclick=()=>finish(game.undo());let workId=null;
function openBuildingWork(selectedWork=null){
 workId=api.selected;$('sun-prediction').value='';
 const base=api.baseBuildings[workId],c=base.config,area=c.w*c.d*(c.floors+1),next=api.replacementConfig(c);
 const before=api.livingCapacity(base),after=api.livingCapacity({config:next});
 $('building-options').innerHTML='<p>民居 '+(workId+1)+' · 原有估算容量 '+before+' 人。两种方案均需要为约 '+before+' 人安排施工周转。原地重建约容纳 '+after+' 人。腾地方案的原地住宅容量为 0。</p><p>拆除腾地按原建筑面积 × 0.65 万元/㎡；退界重建按原建筑面积 × 1.35 万元/㎡，均向上取整至万元，合并示意拆建和安置支出。1500 万是小街区的教学额度，参考广州项目的资金量级设定。现实还需逐户协商、核算和审批。</p><p>讨论关键词 · 居住容量（Housing Capacity） · 周转安置（Temporary Relocation） · 产业集聚（Industrial Agglomeration）</p>';
 for(const [button,work,title] of [['clear-building','clear','拆除腾地'],['rebuild-building','rebuild','退界重建']]){
  $(button).hidden=!!selectedWork&&selectedWork!==work;$(button).textContent=(selectedWork?'确认':'')+title+' · '+money(buildingCost(area,work));$(button).disabled=buildingCost(area,work)>game.state.balance;
  $(button).onclick=()=>{const before=metrics(),prior=api.lightProfiles.map(p=>p.rows.slice()),prediction=$('sun-prediction').value;
   if(!finish(()=>game.changeBuilding(workId,work,area)))return;
   $('building-dialog').close();const after=metrics();
   const improved=api.lightProfiles.filter(p=>p.id!==workId&&p.rows.some((v,f)=>v>(prior[p.id][f]??Infinity)));
   const fits=prediction?(improved.length>0)===(prediction==='gain')?' 结果与你的预测一致。':' 结果与你的预测不同。':'';
   lessonDialog('打开楼距，阳光会去哪里？',improved.length+' 栋邻楼至少一层冬至直射日照变长。估算容量 '+before.housing.after+' → '+after.housing.after+' 人。'+fits,'看哪一栋、哪一层变化最大。再撤销试试另一种拆建方案，比较日照收益和安置缺口。','light',()=>{api.select(workId);$('move-building').onclick();});
   if(improved.length){const gain=p=>Math.max(...p.rows.map((v,f)=>v-(prior[p.id][f]??v)));improved.sort((a,b)=>gain(b)-gain(a));api.select(improved[0].id);}};
 }
 $('building-dialog').showModal();
};
$('move-building').onclick=()=>openBuildingWork();
for (const [buttonId, work] of [['panel-clear-building','clear'], ['panel-rebuild-building','rebuild']]) {
 if ($(buttonId)) $(buttonId).onclick=()=>openBuildingWork(work);
}
$('relocate-building').onclick=()=>start('object','building-'+api.selected);
$('close-building').onclick=()=>$('building-dialog').close();$('move-stall').onclick=()=>start('object',h.activeNode());
$('remove-original').onclick=()=>{
 const id=h.activeNode(),spec=objectSpec(id);
 if(!spec)return;
 const before=metrics(),old=originalLocation(id,game.state);
 if(finish(()=>game.editObject(id,spec.name,spec.remove,null)))reviewObject(id,before,old,null);
};$('close-item').onclick=()=>$('item-dialog').close();$('move-item').onclick=()=>{$('item-dialog').close();start('move',chosenItem);};$('remove-item').onclick=()=>{if(finish(()=>game.removeItem(chosenItem)))$('item-dialog').close();};$('plan-report').onclick=()=>{renderReport();$('report-dialog').showModal();};$('close-report').onclick=()=>$('report-dialog').close();$('download-plan').onclick=()=>{const blob=new Blob([JSON.stringify({title:'巷里社区提案',state:game.state,metrics:metrics(),winterSunByBuilding:api.lightProfiles.map(p=>({id:p.id+1,before:api.baselineSun[p.id],after:p.rows})),coordinateSystem:'虚构局部平面坐标（米），不能直接定位真实场地',learningTerms:window.VillageKnowledge?.terms.map(t=>({zh:t.zh,en:t.en,scope:t.status})),limits:'所有价格、住户和雨洪参数均为教学设定；不是实际工程报价或风险评估。'},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='xiangli-community-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
function noteLabel(key){if(key==='plan')return '整份方案';if(key.startsWith('building-'))return '民居'+(Number(key.slice(9))+1);if(key.startsWith('node-'))return sceneNodes.get(key.slice(5))?.title||key;if(key.startsWith('item-')){const i=game.state.items.find(i=>i.id===key.slice(5));return i?itemSpec(i.type).name+' ('+i.x+', '+i.z+')':'已撤回设施的便签';}return key;}
function openPin(){$('pin-note-location').textContent='游戏坐标：('+pinDraft.x+', '+pinDraft.z+')';$('pin-note-text').value=pinDraft.text||'';$('delete-pin-note').hidden=!pinDraft.id;$('pin-note-dialog').showModal();}
$('map-add-note').onclick=()=>{tool={type:'note'};ghost.visible=false;$('placement-bar').hidden=false;$('placement-instruction').textContent='添加位置便签 · 免费 · 点击任意地点';$('map-explanation').textContent='点击任意地点写便签：可以是新点子，也可以是值得保留的生活。便签不改变土地用途。';};
$('close-pin-note').onclick=()=>$('pin-note-dialog').close();$('save-pin-note').onclick=()=>{const t=$('pin-note-text').value;const result=pinDraft.id?game.editPin(pinDraft.id,t):game.addPin(pinDraft.x,pinDraft.z,t);if(finish(result))$('pin-note-dialog').close();};$('delete-pin-note').onclick=()=>{if(pinDraft?.id&&finish(game.deletePin(pinDraft.id)))$('pin-note-dialog').close();};
$('save-selection-note').onclick=()=>finish(game.setNote(noteTarget,$('selection-note').value));$('save-item-note').onclick=()=>finish(game.setNote('item-'+chosenItem,$('item-note').value));$('save-plan-note').onclick=()=>finish(game.setNote('plan',$('plan-note').value));
$('download-review').onclick=()=>{const s=game.state,m=metrics();let text='# 巷里社区更新提案（供讨论）\n\n这是一份公众构想记录，尚未经场地核验或专业评估。场景、费用和指标均为教学设定，不能直接用于施工。\n\n## 总体想法\n\n'+(s.notes.plan||'未填写，可在讨论时补充。')+'\n\n## 预算\n\n初始'+money(s.initial)+'；已用'+money(s.initial-s.balance)+'；剩余'+money(s.balance)+'。\n\n## 改造清单\n\n'+s.ledger.map(l=>'- '+l.label+'：'+money(l.cost)).join('\n')+'\n\n## 新建设施与位置\n\n'+s.items.map(i=>'- '+itemSpec(i.type).name+'，模拟坐标('+i.x+', '+i.z+')；理由：'+(s.notes['item-'+i.id]||'未填写')).join('\n')+'\n\n## 地点便签\n\n'+Object.entries(s.notes).filter(([k])=>k!=='plan'&&!k.startsWith('item-')).map(([k,v])=>'### '+noteLabel(k)+'\n\n'+v).join('\n\n')+'\n\n'+s.pins.map(p=>'### 模拟坐标('+p.x+', '+p.z+')\n\n'+p.text).join('\n\n')+'\n\n## 教学对照\n\n估算出租房间 '+m.housing.roomsBefore+' → '+m.housing.roomsAfter+' 间；按 '+m.housing.peoplePerRoom+' 人/间，居住容量 '+m.housing.before+' → '+m.housing.after+' 人；周转涉及 '+m.housing.affected+' 人；容量缺口 '+m.housing.gap+' 人。\n\n保留民居 '+m.sun.gain+' 个楼层冬至日照变长、'+m.sun.loss+' 个变短。地面种植率 '+m.ground.before+'% → '+m.ground.after+'%；树冠覆盖 '+m.canopyBefore+'% → '+m.green+'%；示意步行服务覆盖'+m.coverage+'%；新增小地块示意产流差值'+m.reduced+'m³。\n\n## 供规划人员与居民讨论的问题\n\n- 场地现状、产权、地下管线和可用空间是否支持？\n- 谁受益、谁可能受到影响，是否充分协商？\n- 真实造价、维护主体与后续费用如何落实？\n- 需要哪些补充调研、测绘和专业评估？\n\n本应用不自动收集或上传本提案，由作者决定是否分享。\n';const blob=new Blob([text],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='xiangli-community-proposal.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
function reset(){cancel();game.reset();apply();h.returnToStart();toast('已开始新方案，预算恢复1500万。');}$('reset').onclick=reset;
apply();return {game,roots,undo(){return finish(game.undo());},renderControls:render,chooseSite,openBuildingMap(){
 if(tool)cancel();
 search='';$('map-search').value='';mapLayer='life';$('map-layer').value='life';
 view={x:0,y:0,w:840,h:900};this.showMap();
 $('map-explanation').textContent='点击楼栋轮廓或建筑编号，即可定位并展开这栋楼的操作。';
},showMap(){renderMap();if(!$("map-dialog").open)$("map-dialog").showModal();},pickMeshes(){const a=[];for(const root of roots.values())root.traverse(o=>{if(o.isMesh)a.push(o);});return a;},validate,place,start,cancel,preview,pickSite,inspectBuilding,inspectNode,buyRenovation,buyHazard,buyGreening,selectItem,showStudy,metrics,walkDistance,renderMap,reset,get tool(){return tool;}};
};

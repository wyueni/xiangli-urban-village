const VillageOps = (() => {
 const clamp = n => Math.min(100,Math.max(0,Math.round(n)));
 const policies = {regular:{name:'日常巡街',fee:2,clean:0,happy:0},clean:{name:'加派保洁',fee:6,clean:9,happy:1},visit:{name:'街坊走访',fee:5,clean:0,happy:6}};
 const signed = n => (n>0?'+':'')+n;
 function forecast(book,s,m,policy){
  const service=policies[policy],fixed=id=>s.resolved.includes(id),count=id=>Math.min(3,s.items.filter(i=>i.type===id).length);
  const capacity=m.housing.after,pop=Math.min(book.pop,capacity);
  const upkeep=Math.ceil(s.items.length/3);
  const grant=100;
  const income=grant+3+Math.floor(pop/100);
  const cleanliness=clamp(book.clean*.72+.28*(43+20*fixed('waste')+8*fixed('drain')+6*fixed('bikes')+2*count('parking'))+service.clean);
  const happy=clamp(book.happy*.65+.35*(30+.38*cleanliness+.12*m.coverage+3*count('lamp')+2*count('bench')+4*fixed('pit')+Math.min(5,s.renovated.length))+service.happy);
  const movement=Math.round((happy-50)*Math.max(3,capacity*.012));
  return {month:book.month+1,pop:Math.min(capacity,Math.max(0,pop+movement)),happy,clean:cleanliness,cash:Math.max(0,s.balance/10+income-upkeep-service.fee),grant,income,upkeep,fee:service.fee};
 }

 let book, policy='regular', now, metrics, locate, settle;
 let guide=0, presented=-1, best=0, hasRecord=false;
 try { guide=Math.max(0,Math.min(2,Number(localStorage.getItem('xiangli-guide-v2'))||0)); const savedBest=localStorage.getItem('xiangli-best-score-v1'); hasRecord=savedBest!=null&&Number.isFinite(Number(savedBest)); best=hasRecord?Math.max(0,Math.min(100,Number(savedBest))):0; } catch {}
 if (document.documentElement.classList.contains('returning-player')) {
  guide = 2;
  presented = 2;
 }
 const guides=[
  {title:'上任导览 · 先看看旧楼',story:'“老王，钱就这么多，你可得掂量着花。”芳姨把账本往你面前一放。你望向巷子里的旧楼：有的只需修整门面，有的需要腾出空间。这一世，每一笔钱，都要换来街坊生活里看得见的变化。',goal:'点击一栋民居，查看立面整修、拆除腾地、退界重建和原型迁建。先看预算与得分预览，再决定做不做。',action:'查看一栋民居'},
  {title:'上任导览 · 给巷子添点新东西',story:'“旧楼能修，空地方也别浪费。”芳姨给你指了指巷边。添一把长椅，还是建一处便民驿站？你翻开改造商店，把每样东西的价格和能带来的变化一一对照。',goal:'打开改造商店，查看商品关联指标；选好位置后比较得分预览。无需购买也可以继续导览。',action:'打开改造商店'},
  {title:'自由经营 · 这本账，你来做主',story:'芳姨把钥匙留在桌上：“老王，这条巷子就交给你了。”你合上手里的清单。先修哪里、添什么、花多少钱，都由你决定。等准备妥当，再看看这个月究竟交出了怎样的成绩。',goal:'先摊开街区位置图，看看哪里有隐患、哪里的街坊走到驿站最远。选一处你想改善的地方，在预算内争取更高总分。',action:'打开街区位置图'}
 ];
 const $=id=>document.getElementById(id);
 function saveGuide(){try{localStorage.setItem('xiangli-guide-v2',String(guide));}catch{}}
 function openGuideMap(){
  const tip = $('map-guide-tip');
  tip.hidden = false;
  $('map-dialog').addEventListener('close', () => { tip.hidden = true; }, {once:true});
  $('expand-map').click();
 }
 function presentGuide(){
  if(presented===guide)return;
  presented=guide;
  const panel=$('ops');
  document.body.classList.add('mission-intro');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  const locked=[...document.body.children].filter(el=>!['ops','mission-backdrop'].includes(el.id)&&!['SCRIPT','STYLE','LINK'].includes(el.tagName));
  const prior=locked.map(el=>el.inert);locked.forEach(el=>{el.inert=true;});
  const start=$('missionStart');start.disabled=false;start.textContent='现在开始';
  start.onclick=()=>{
   const from=panel.getBoundingClientRect();
   document.body.classList.remove('mission-intro');panel.removeAttribute('role');panel.removeAttribute('aria-modal');
   locked.forEach((el,i)=>{el.inert=prior[i];});
   const to=panel.getBoundingClientRect();
   if(panel.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)panel.animate([{transform:`translate(${from.left-to.left}px, ${from.top-to.top}px) scale(${from.width/to.width})`,transformOrigin:'top left',opacity:.7},{transform:'none',opacity:1}],{duration:360,easing:'ease-out'});
   $('opsGo').focus();
   if (guide === 2) openGuideMap();
  };
  start.focus();
 }
 function update(s,m,openMap=locate,commitMonth=settle){
  settle=commitMonth;
  locate=openMap;now=s;metrics=m;
  book=s.monthBook||{month:1,happy:48,clean:42,pop:Math.floor(m.housing.before*.78)};
  const next=forecast(book,s,m,policy),net=next.income-next.upkeep-next.fee;
  const pending=['waste','drain','pit','bikes'].filter(id=>!s.resolved.includes(id));
  VillageDashboard.update(s,m,book,next,pending,[],locate);
  VillageScore.render(s,m,next);
  $('opsMonth').textContent='第 '+book.month+' 月';
  $('opsStats').textContent='经营目标 · 在预算内争取最高总分';
  $('missionTitle').textContent=guides[guide].title;
  $('missionStory').textContent=guides[guide].story;
  $('opsTask').textContent=guides[guide].goal;
  $('opsAudit').textContent='总预算剩余 '+(s.balance/10).toFixed(1)+' 万。\n当前方案预估 '+VillageScore.calculate(s,m,next).total+' / 100 分。\n历史最高月末得分 '+best.toFixed(2)+' 分。'+(hasRecord?' 历史最高称号：'+VillageRanks.tier(best).name+'。':'')+'\n人口与生活指标在点击结算后更新，每次月末结算将政府拨款和经营收入计入总预算，再扣除维护与排班费。';
  const panel=$('panel'),fold=$('toolFold');
  function expandTools(open){panel.classList.toggle('compact-tools',!open);fold.setAttribute('aria-expanded',String(open));fold.textContent=open?'收起地点操作 ▴':'展开地点操作 ▾';}
  fold.onclick=()=>expandTools(panel.classList.contains('compact-tools'));
  $('opsGo').disabled=false;$('opsGo').textContent=guides[guide].action;
  $('opsGo').onclick=()=>{
   if(guide===0){expandTools(true);window.Xiangli.select(0);$('focus').click();}
   else if(guide===1)$('open-shop').click();
   else openGuideMap();
  };
  $('guideNext').hidden=guide===2;
  $('guideNext').textContent=guide===0?'了解了 · 看看改造商店 →':'了解了 · 开始自由经营 →';
  $('guideNext').onclick=()=>{guide=Math.min(2,guide+1);saveGuide();update(now,metrics);};
  $('guideReplay').onclick=()=>{guide=0;presented=-1;saveGuide();update(now,metrics);};
  $('opsPolicy').value=policy;$('opsPolicy').onchange=e=>{policy=e.target.value;update(now,metrics);};
  $('opsForecast').textContent='预计下月　幸福度 '+signed(next.happy-book.happy)+'　整洁度 '+signed(next.clean-book.clean)+'　人口 '+signed(next.pop-book.pop)+' 人';
  $('opsMoney').textContent='总预算 '+(s.balance/10)+' 万 · 政府拨款 '+next.grant+' 万 · 经营收入 '+(next.income-next.grant)+' 万 · 维护 '+next.upkeep+' 万 · 排班 '+next.fee+' 万';
  const button=$('opsNext');button.disabled=s.balance/10+net<0;
  button.title=button.disabled?'运营资金不足，请调整排班或设施维护规模':'主动结束本月，核算得分和居民变化';
  button.onclick=()=>{
   const before=book;
   const score=VillageScore.calculate(now,metrics,next);
   const previousBest=hasRecord?best:null;
   const previousScore=Number.isFinite(book.lastScore)?book.lastScore:null;
   const rankHtml=VillageRanks.render(score,previousScore,previousBest);
   const settled={...next,lastScore:score.total};
   if(!settle(settled,next.income*10,(next.upkeep+next.fee)*10))return;
   best=Math.max(best,score.total);hasRecord=true;
   book={...next,lastScore:score.total};policy='regular';
   $('opsLast').textContent='第 '+before.month+' 月结算 '+score.total+' 分 · '+VillageRanks.tier(score.total).name+' · 历史最高 '+best.toFixed(2)+' 分';
   try{localStorage.setItem('xiangli-best-score-v1',String(best));}catch{$('opsLast').textContent+=' · 当前浏览器无法保存';}
   $('month-result-title').textContent='第 '+before.month+' 月 · 经营结算';
   $('month-result-body').innerHTML=rankHtml+'<p>总预算剩余 '+(now.balance/10).toFixed(1)+' 万 · 累计投入 '+((now.initial-now.balance)/10).toFixed(1)+' 万</p><p>居民 '+before.pop+' → '+book.pop+' 人 · 幸福度 '+before.happy+' → '+book.happy+' · 整洁度 '+before.clean+' → '+book.clean+'</p><p>政府拨款 '+next.grant+' 万 · 经营收入 '+(next.income-next.grant)+' 万 · 维护 '+next.upkeep+' 万 · 排班 '+next.fee+' 万 · 本月净收支 '+signed(net)+' 万</p><div class="score-parts">'+score.parts.map(p=>'<div class="score-part"><span>'+p.name+'</span><b>'+p.value+' / '+p.max+'</b></div>').join('')+'</div><p>下一月继续使用现有街区与剩余预算。你可以调整方案，再挑战更高得分。</p>';
   update(now,metrics);
   $('month-result-dialog').showModal();
  };
  $('month-result-close').onclick=()=>$('month-result-dialog').close();
  presentGuide();
 }
 return {update,forecast,project(s,m){return forecast(book || {month:1,happy:48,clean:42,pop:Math.floor(m.housing.before*.78),cash:25},s,m,policy);}};
})();

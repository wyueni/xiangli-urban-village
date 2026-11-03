const el=id=>document.getElementById(id);
const lanes=[[[40,250],[40,70],[460,70],[460,250]],[[40,250],[40,155],[460,155],[460,250]],[[40,250],[460,250]]];
const lamps=[{name:'校门口',x:70,y:237,hint:'校门已有门灯。看看新增照明能延伸多远。'},{name:'茶档转角',x:232,y:169,hint:'围墙紧贴灯位南侧，墙背后的光被遮住了。'},{name:'两巷之间',x:281,y:204,hint:'站在这里能同时望见后巷和近路。'}];
const shadowPoints=[[],[[222,155],[240,155]],[[222,250],[240,250]]];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const length=r=>r.slice(1).reduce((sum,p,i)=>sum+distance(r[i],p),0);
const path=r=>'M'+r.map(p=>p.join(',')).join(' L');
function lit(lamp,x,y){
 if(distance([lamp.x,lamp.y],[x,y])>95)return false;
 for(let i=1;i<=80;i++){const a=lamp.x+(x-lamp.x)*i/80,b=lamp.y+(y-lamp.y)*i/80;if(a>=212&&a<=250&&b>=192&&b<=201)return false}
 return true;
}
function route(lamp){return lanes.filter((_,i)=>shadowPoints[i].every(([x,y])=>lit(lamp,x,y))).sort((a,b)=>length(a)-length(b))[0]}
let frame,selected=-1,stage='intro';
function button(parent,label,action){const b=document.createElement('button');b.textContent=label;b.onclick=action;el(parent).append(b);return b}
function controls(phase,note){el('phase').textContent=phase;el('note').textContent=note;el('actions').replaceChildren();el('sites').replaceChildren()}
function walk(r,done){
 cancelAnimationFrame(frame);const start=performance.now(),total=length(r);
 function tick(now){let at=Math.min(total,(now-start)*.23),p=r[0];
 for(let i=1;i<r.length;i++){const span=distance(r[i-1],r[i]);if(at<=span){p=r[i].map((v,k)=>r[i-1][k]+(v-r[i-1][k])*at/span);break}at-=span}
 el('child').setAttribute('cx',p[0]);el('child').setAttribute('cy',p[1]);
 if((now-start)*.23<total)frame=requestAnimationFrame(tick);else done()}
 frame=requestAnimationFrame(tick)
}
function choose(){cancelAnimationFrame(frame);stage='choose';selected=-1;el('after').removeAttribute('d');el('before').setAttribute('d',path(lanes[0]));el('glow').replaceChildren();el('child').setAttribute('cx',40);el('child').setAttribute('cy',250);
 controls('选址　/　今晚可装 1 盏灯','点地图上的编号或下方灯位，看看光能照到哪条巷。');
 lamps.forEach((l,i)=>button('sites',(i+1)+'　'+l.name,()=>preview(i)));button('actions','确认安装，看阿禾回家',install).disabled=true;drawPins()}
function drawPins(){el('pins').innerHTML=lamps.map((l,i)=>'<g class="site" data-site="'+i+'"><circle cx="'+l.x+'" cy="'+l.y+'" r="11" fill="'+(i===selected?'#e6a637':'#446763')+'"/><text x="'+l.x+'" y="'+(l.y+4)+'" text-anchor="middle">'+(i+1)+'</text></g>').join('');el('pins').querySelectorAll('g').forEach((g,i)=>g.onclick=()=>{if(stage==='choose')preview(i)})}
function preview(i){selected=i;const l=lamps[i];drawPins();let d='';for(let x=l.x-95;x<l.x+95;x+=4)for(let y=l.y-95;y<l.y+95;y+=4)if(lit(l,x,y))d+='M'+x+' '+y+'h4v4h-4z';el('glow').innerHTML='<path d="'+d+'" fill="#ffd66c" opacity=".38" filter="url(#soft)"/>';el('note').textContent=l.hint;Array.from(el('sites').children).forEach((b,k)=>b.setAttribute('aria-pressed',String(i===k)));el('actions').firstChild.disabled=false}
function install(){stage='walk';const r=route(lamps[selected]),saved=length(lanes[0])-length(r);controls('回家　/　观察阿禾的选择','路灯亮了。');el('after').setAttribute('d',path(r));function finish(){cancelAnimationFrame(frame);stage='result';el('child').setAttribute('cx',460);el('child').setAttribute('cy',250);
 controls('今夜的路线　/　'+length(r)+' 米','原先 780 米，现在 '+length(r)+' 米。'+(saved?'少走 '+saved+' 米。'+(r===lanes[2]?'近路的暗段都亮了。':'后巷亮了，围墙后的近路仍有暗段。'):'校门更亮了，但两条近巷的暗段仍在，阿禾还是绕市场街。'));
 button('actions','换个位置试试',choose);button('actions','保留这个方案',()=>{try{localStorage.setItem('xiangli-lamp-story-v1',String(selected));el('note').textContent='已保存「'+lamps[selected].name+'」方案，下次进入可以重看。'}catch{el('note').textContent='当前浏览器无法保存。'}})}
 button('actions','跳过步行动画',finish);walk(r,finish)}
el('streets').innerHTML=lanes.map(r=>'<path d="'+path(r)+'" fill="none" stroke="#263d40" stroke-width="20" stroke-linejoin="round"/>').join('')+shadowPoints.flat().map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="8" fill="#14272d"/>').join('');
controls('街坊委托　/　只够一盏灯','把灯装在哪儿，她才能少绕一点路？');button('actions','进村，玩第一关',()=>{controls('放学了　/　先跟她走一趟','阿禾走上有灯的市场街。');el('before').setAttribute('d',path(lanes[0]));button('actions','跳过，直接选址',choose);walk(lanes[0],choose)});
try{const v=localStorage.getItem('xiangli-lamp-story-v1');if(['0','1','2'].includes(v))button('actions','重看上次方案',()=>{choose();preview(Number(v));install()})}catch{}

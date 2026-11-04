/* Teaching-game rubric. All projections use the same scene metrics as settlement. */
const VillageScore = (() => {
  const cap = n => Math.max(0, Math.min(1, n));
  const round = n => Math.round(n * 100) / 100;
  const fmt = n => Number(n).toLocaleString('zh-CN', {maximumFractionDigits:2});
  const signed = n => (n > 0 ? '+' : '') + fmt(n);
  function calculate(s, m, next) {
    const fixed = ['waste','drain','pit','bikes'].filter(id => s.resolved.includes(id)).length;
    const parts = [
      ['住房保障',20,cap(m.housing.after / Math.max(1,m.housing.before)), '现有容量 ÷ 原有容量，达到原有容量即满分'],
      ['安全整治',20,fixed/4,'四处重点隐患，每处理一处得 5 分'],
      ['公共服务',15,cap(m.coverage/100),'80 米步行覆盖率 × 15'],
      ['生态环境',10,(cap(m.green/20)+cap(m.ground.after/15))/2,'树冠覆盖达到 20%、地面种植达到 15%，各占 5 分'],
      ['居住日照',10,cap(m.sun.after/100),'达到游戏 60 分钟阈值的楼层占比 × 10'],
      ['社区延续',10,.7*cap(m.retained/20)+.3*cap(m.culture/3),'原有民居保留占 7 分，新增文化交往设施最多 3 分'],
      ['居民生活',10,cap((next.happy+next.clean)/200),'预计下月幸福度与整洁度的平均值 × 10%'],
      ['运营持续',5,cap(next.income/Math.max(1,next.upkeep+next.fee)),'预计月收入 ÷ 维护与排班支出，收支平衡即满分']
    ].map(([name,max,ratio,rule]) => ({name,max,value:round(max*ratio),rule}));
    return {total:round(parts.reduce((sum,p)=>sum+p.value,0)),parts};
  }
  function breakdown(score) {
    return score.parts.map(p=>`<div class="score-part" title="${p.rule}"><span>${p.name}</span><b>${fmt(p.value)} / ${p.max}</b><meter min="0" max="${p.max}" value="${p.value}" aria-label="${p.name}"></meter></div>`).join('');
  }
  function render(s,m,next) {
    const target=document.getElementById('dashboard-score');
    if (!target) return;
    const score=calculate(s,m,next);
    const current=document.getElementById('current-total-score');
    if(current) current.textContent=fmt(score.total)+' / 100';
    target.innerHTML=`<div class="score-summary"><span>改造核算总分</span><strong>${fmt(score.total)}<small> / 100</small></strong><span>居民生活与运营按下月预测核算</span></div><div class="score-parts">${breakdown(score)}</div><details class="score-rules"><summary>评分口径 · 游戏规则</summary>${score.parts.map(p=>`<p>${p.name} ${p.max} 分 · ${p.rule}</p>`).join('')}<p>权重与目标为游戏设定。住房缺口、安全隐患和居民周转仍需单独查看。产流、人口等指标展示变化，不重复计分。</p></details>`;
  }
  function values(s,m,n) {
    return {
      '总预算余额 / 万':s.balance/10,'住房容量 / 人':m.housing.after,'住房缺口 / 人':m.housing.gap,'涉及周转容量 / 人':m.housing.affected,'出租房间 / 间':m.housing.roomsAfter,
      '步行服务覆盖 / %':m.coverage,'覆盖居住容量 / 人':m.served,'原住新增受益 / 人':m.access.newlyServed,'原住失去覆盖 / 人':m.access.noLongerServed,'未覆盖原住楼 / 栋':m.access.outside.length,
      '已处理重点隐患 / 处':['waste','drain','pit','bikes'].filter(id=>s.resolved.includes(id)).length,'树冠覆盖 / %':m.green,'地面种植 / %':m.ground.after,'模拟产流减少 / m³':m.reduced,
      '日照达标楼层 / %':m.sun.after,'日照变长 / 层':m.sun.gain,'日照变短 / 层':m.sun.loss,'保留民居 / 栋':m.retained,'新增文化交往设施 / 处':m.culture,'新增设施 / 处':s.items.length,
      '预计下月幸福度':n.happy,'预计下月整洁度':n.clean,'预计下月居民 / 人':n.pop,'预计结算后总预算 / 万':n.cash,'本月收入 / 万':n.income,'维护支出 / 万':n.upkeep,'排班支出 / 万':n.fee,'预计运营净收支 / 万':n.income-n.upkeep-n.fee
    };
  }
  function preview(before,after,commit) {
    const a=calculate(before.s,before.m,before.next), b=calculate(after.s,after.m,after.next);
    const av=values(before.s,before.m,before.next), bv=values(after.s,after.m,after.next);
    const rows=Object.keys(av).filter(k=>round(av[k])!==round(bv[k]));
    const change=round(b.total-a.total);
    document.getElementById('score-preview-body').innerHTML=`<div class="score-summary"><span>核算总分预估</span><strong>${fmt(a.total)} → ${fmt(b.total)}</strong><b>${signed(change)} 分</b></div><p>本次预算 ${fmt((before.s.balance-after.s.balance)/10)} 万 · 确认后才扣款施工</p><div class="score-parts">${b.parts.map((p,i)=>`<div class="score-part"><span>${p.name}</span><b>${fmt(a.parts[i].value)} → ${fmt(p.value)}</b><small>${signed(round(p.value-a.parts[i].value))} 分</small></div>`).join('')}</div><h3>具体指标变化</h3><table class="impact-table"><thead><tr><th>指标</th><th>当前 → 改造后</th><th>变化</th></tr></thead><tbody>${rows.map(k=>`<tr><td>${k}</td><td>${fmt(av[k])} → ${fmt(bv[k])}</td><td>${signed(round(bv[k]-av[k]))}</td></tr>`).join('')}</tbody></table><p>未列出的指标保持不变。月度指标按同一排班预测，人口与幸福度不会立即结算。${change===0?'本次总分不变，请结合具体指标决定是否施工。':''}</p>`;
    const dialog=document.getElementById('score-preview-dialog');
    document.getElementById('score-preview-confirm').onclick=()=>{dialog.close();commit();};
    document.getElementById('score-preview-cancel').onclick=()=>dialog.close();
    dialog.showModal();
  }
  return {calculate,render,preview,values};
})();

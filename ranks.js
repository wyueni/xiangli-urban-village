const VillageRanks = (() => {
  const tiers = [
    {min:0, name:'接了个烫手村', quote:'老王，钥匙交给你了，街坊心里还没底呢。'},
    {min:30, name:'巷口实习村长', quote:'知道往哪儿使劲了，再办几件实在事。'},
    {min:45, name:'街坊办事人', quote:'有事找老王，他是真往巷子里跑。'},
    {min:60, name:'旧巷改造能手', quote:'路好走了，日子也方便了，这钱花得值。'},
    {min:75, name:'街坊主心骨', quote:'老王办事，我们放心。'},
    {min:90, name:'城中村之王', quote:'这声大王，是街坊们认的。'}
  ];
  const round = n => Math.round(n * 100) / 100;
  function tier(score) {
    return tiers.filter(t => score >= t.min).at(-1) || tiers[0];
  }
  function result(score, previousScore, previousBest) {
    const current = tier(score.total);
    const best = previousBest === null ? score.total : Math.max(previousBest, score.total);
    const next = tiers.find(t => t.min > score.total);
    const weakest = score.parts.map(p => ({...p, room:round(p.max-p.value)}))
      .sort((a,b) => b.room-a.room)[0];
    return {
      current, best:tier(best), next,
      gap:next ? round(next.min-score.total) : 0,
      change:previousScore === null ? null : round(score.total-previousScore),
      unlocked:previousBest === null || current.min > tier(previousBest).min,
      weakest
    };
  }
  function render(score, previousScore, previousBest) {
    const r=result(score,previousScore,previousBest);
    const change=r.change === null ? '首次记录 · 从这个月开始积累成绩'
      : '较上月 '+(r.change>0?'+':'')+r.change.toFixed(2)+' 分';
    const next=r.next ? '距离「'+r.next.name+'」还差 '+r.gap.toFixed(2)+' 分'
      : '已获得最高称号 · 继续挑战更高总分';
    const room=r.weakest && r.weakest.room>0
      ? '当前得分空间最大：'+r.weakest.name+'，'+r.weakest.value+' / '+r.weakest.max+' 分。距该项满分还有 '+r.weakest.room.toFixed(2)+' 分，改造前请结合预算比较预览。'
      : '各项评分已达满分，继续维持街坊的生活品质。';
    return '<section class="settlement-rank"><small>'+(r.unlocked?'新称号解锁':'本月结算称号')+'</small><h3>'+r.current.name+'</h3><div class="rank-score">'+score.total.toFixed(2)+'<span> / 100 分</span></div><p class="rank-change">'+change+'</p><blockquote>“'+r.current.quote+'”</blockquote><p class="rank-best">历史最高称号 · '+r.best.name+'</p></section><section class="rank-next"><strong>'+next+'</strong><p>'+room+'</p></section>';
  }
  return {tier,result,render};
})();

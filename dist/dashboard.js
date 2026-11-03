const VillageDashboard = (() => {
  const drawer = document.getElementById('village-dashboard');
  const toggle = document.getElementById('dashboard-toggle');
  const content = document.getElementById('dashboard-content');
  let expanded = false;
  let pointerStart = null;
  let dragged = false;

  function setExpanded(value) {
    expanded = value;
    if (!value && content.contains(document.activeElement)) toggle.focus();
    drawer.classList.toggle('is-open', value);
    toggle.setAttribute('aria-expanded', String(value));
    content.inert = !value;
    content.setAttribute('aria-hidden', String(!value));
    document.getElementById('dashboard-toggle-label').textContent = value
      ? '指标总览 · 向下收起' : '指标总览 · 向上展开';
  }

  toggle.addEventListener('click', () => {
    if (!dragged) setExpanded(!expanded);
    dragged = false;
  });
  toggle.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerStart = { y: event.clientY, id: event.pointerId };
    dragged = false;
    toggle.setPointerCapture(event.pointerId);
  });
  toggle.addEventListener('pointerup', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const distance = event.clientY - pointerStart.y;
    pointerStart = null;
    dragged = Math.abs(distance) > 25;
    if (dragged) setExpanded(distance < 0);
  });
  toggle.addEventListener('pointercancel', () => { pointerStart = null; dragged = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) setExpanded(false);
  });
  const number = value => Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  const signed = value => (value > 0 ? '+' : '') + number(value);
  const row = (label, value) => `<div class="metric-row"><span>${label}</span><b>${value}</b></div>`;
  const bar = (label, value) => `<div class="metric-bar"><span>${label}</span><b>${number(value)}%</b><meter min="0" max="100" value="${value}" aria-label="${label}"></meter></div>`;
  const card = (label, body, layer) => `<article class="metric-card"><h3>${label}${layer ? ` <button data-metric-map="${layer}" aria-label="查看${label}分布">定位 ↗</button>` : ''}</h3>${body}</article>`;

  function update(s, m, book, next, pending, checks, openMap) {
    const root = document.getElementById('village-dashboard');
    if (!root) return;
    const net = next.income - next.upkeep - next.fee;
    document.getElementById('dashboard-checks').textContent = '经营目标 · 在预算内争取最高总分';
    document.getElementById('dashboard-grid').innerHTML = [
      card('居民生活',
        row('现有居民', `${number(book.pop)} 人 <em>下月 ${signed(next.pop-book.pop)}</em>`) +
        bar('幸福度', book.happy) + bar('整洁度', book.clean) +
        row('下月变化', `幸福 ${signed(next.happy-book.happy)} · 整洁 ${signed(next.clean-book.clean)}`)),
      card('住房保障',
        row('居住容量 / 人', `${number(m.housing.before)} → ${number(m.housing.after)}`) +
        row('住房缺口', `${number(m.housing.gap)} 人`) +
        row('涉及周转容量', `${number(m.housing.affected)} 人`) +
        row('房间 / 间', `${number(m.housing.roomsBefore)} → ${number(m.housing.roomsAfter)}`), 'housing'),
      card('公共服务', bar('步行服务覆盖', m.coverage) +
        row('覆盖居住容量', `${number(m.served)} 人`) +
        row('原住容量受益 / 失去', `+${number(m.access.newlyServed)} / −${number(m.access.noLongerServed)} 人`) +
        row('原住楼新增 / 未覆盖', `${m.access.gained.length} / ${m.access.outside.length} 栋`), 'service'),
      card('安全与设施', bar('重点隐患处理', (4-pending.length)/4*100) +
        `<div class="risk-flags">${Object.entries({waste:'垃圾外溢',drain:'排水堵塞',pit:'路面坑洼',bikes:'乱停阻路'}).map(([id,label])=>`<span class="${s.resolved.includes(id)?'met':''}">${s.resolved.includes(id)?'✓':'○'} ${label}</span>`).join('')}</div>` +
        row('新增设施 / 改善点', `${s.items.length} / ${m.solved} 处`), 'hazards'),
      card('生态与雨洪', bar('树冠覆盖', m.green) + bar('地面种植', m.ground.after) +
        row('原有树冠 / 种植', `${m.canopyBefore}% / ${m.ground.before}%`) +
        row('模拟产流减少', `${number(m.reduced)} m³`)),
      card('居住日照', bar('日照 ≥60 分钟楼层', m.sun.after) +
        row('改造前占比', `${m.sun.before}%`) +
        row('日照变长', `${m.sun.gain} 层`) + row('日照变短', `${m.sun.loss} 层`)),
      card('社区延续', bar('原有民居保留', m.retained/20*100) +
        row('保留民居', `${m.retained} / 20 栋`) +
        row('文化与交往设施', `${m.culture} 处`) +
        row('容量估算口径', `${m.housing.peoplePerRoom} 人 / 间`)),
      card('资金与运营', row('总预算余额 / 已用', `${number(s.balance/10)} / ${number((s.initial-s.balance)/10)} 万`) +
        row('政府拨款 / 经营收入', `${next.grant} / ${next.income-next.grant} 万`) +
        row('维护 / 排班', `${next.upkeep} / ${next.fee} 万`) +
        row('预计本月净收支', `<span class="${net<0?'metric-warning':'metric-positive'}">${signed(net)} 万</span>`))
    ].join('');
    root.querySelectorAll('[data-metric-map]').forEach(button => {
      button.onclick = () => openMap(button.dataset.metricMap);
    });
  }
  return { update };
})();

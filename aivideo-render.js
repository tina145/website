// ============================================================
// AI视频页的渲染（只有 aivideo.html 加载它）
//
// 数据在 aivideo.js 里：window.AIVIDEO_TIMELINE = [{ date, title, text, tags, url, source }, ...]
//
// 页面的内容是「LLM 发展时间线」：每个节点一条，右侧可以挂一段视频。
//   数据里填了 url  → 显示「看视频 ↗」（新窗口打开）
//   没填 url        → 显示「待填视频」（灰的，不是死链）
// 年份筛选按钮由数据里的日期自动生成，不用手写。
// ============================================================

(function initAivideoTimeline() {
  const listEl = document.getElementById('avTimeline');
  const chipsEl = document.getElementById('avYearChips');
  const statsEl = document.getElementById('avStats');
  const emptyEl = document.getElementById('avEmpty');
  const fallbackEl = document.getElementById('avFallback');
  if (!listEl) return; // 只有 aivideo.html 有这些容器

  const isLink = (v) => /^https?:\/\//i.test(String(v || '').trim()); // 不是 http 开头的一律当没填，免得出现死链

  const all = (window.AIVIDEO_TIMELINE || []).filter((x) => x && String(x.title || '').trim());

  // 一条数据都没有：回到「待填写」占位（其余控件藏起来）
  if (!all.length) {
    if (fallbackEl) fallbackEl.hidden = false;
    listEl.hidden = true;
    if (chipsEl) chipsEl.hidden = true;
    if (statsEl) statsEl.innerHTML = '';
    return;
  }
  if (fallbackEl) fallbackEl.hidden = true;

  // 按日期从早到晚；没写日期的排最后（保持数组里的先后顺序，sort 稳定）
  const items = all
    .map((x, i) => ({ x: x, i: i }))
    .sort((a, b) => {
      const ad = String(a.x.date || '');
      const bd = String(b.x.date || '');
      if (!ad && !bd) return a.i - b.i;
      if (!ad) return 1;
      if (!bd) return -1;
      return ad < bd ? -1 : ad > bd ? 1 : a.i - b.i;
    })
    .map((o) => o.x);

  // '2017-06' → '2017.06'；'2017' 就还是 '2017'
  const dateText = (d) => String(d || '').trim().replace(/-/g, '.');
  const yearOf = (d) => (String(d || '').trim().match(/^(\d{4})/) || [, ''])[1];

  const years = [];
  items.forEach((it) => {
    const y = yearOf(it.date);
    if (y && years.indexOf(y) < 0) years.push(y);
  });
  years.sort();

  let state = { year: null };

  function makeChip(text, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = text;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', onClick);
    return b;
  }

  const chips = new Map();
  let allChip = null;
  if (chipsEl) {
    allChip = makeChip('全部年份', () => { state.year = null; render(); });
    chipsEl.appendChild(allChip);
    years.forEach((y) => {
      const chip = makeChip(y, () => {
        state.year = state.year === y ? null : y;
        render();
      });
      chips.set(y, chip);
      chipsEl.appendChild(chip);
    });
  }

  function makeItem(it) {
    const li = document.createElement('li');
    li.className = 'av-item';

    const head = document.createElement('div');
    head.className = 'av-item-head';

    const date = document.createElement('span');
    date.className = 'av-item-date';
    date.textContent = dateText(it.date) || '时间待填写';
    if (!String(it.date || '').trim()) date.classList.add('is-todo');
    head.appendChild(date);

    const h = document.createElement('h3');
    h.className = 'av-item-title';
    h.textContent = String(it.title);
    head.appendChild(h);
    li.appendChild(head);

    if (it.text) {
      const p = document.createElement('p');
      p.className = 'av-item-text';
      p.textContent = String(it.text);
      li.appendChild(p);
    }

    const meta = document.createElement('div');
    meta.className = 'av-item-meta';

    if (it.tags && it.tags.length) {
      const wrap = document.createElement('span');
      wrap.className = 'av-item-tags';
      it.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'av-tag';
        tag.textContent = t;
        wrap.appendChild(tag);
      });
      meta.appendChild(wrap);
    }

    if (isLink(it.source)) {
      const src = document.createElement('a');
      src.className = 'av-src';
      src.href = String(it.source).trim();
      src.target = '_blank';
      src.rel = 'noopener';
      src.title = '打开这条节点的资料来源（新窗口）';
      src.textContent = '来源 ↗';
      meta.appendChild(src);
    }

    // 视频：填了就是一个链接，没填就是灰字「待填视频」
    if (isLink(it.url)) {
      const go = document.createElement('a');
      go.className = 'av-go';
      go.href = String(it.url).trim();
      go.target = '_blank';
      go.rel = 'noopener';
      go.title = '打开这段视频（新窗口）';
      go.setAttribute('aria-label', '打开《' + it.title + '》对应的视频（新窗口）');
      go.textContent = '看视频 ↗';
      meta.appendChild(go);
    } else {
      const todo = document.createElement('span');
      todo.className = 'av-go is-todo';
      todo.textContent = '待填视频';
      meta.appendChild(todo);
    }

    li.appendChild(meta);
    return li;
  }

  function render() {
    if (allChip) allChip.setAttribute('aria-pressed', String(state.year === null));
    chips.forEach((chip, y) => chip.setAttribute('aria-pressed', String(state.year === y)));

    const shown = items.filter((it) => !state.year || yearOf(it.date) === state.year);

    listEl.innerHTML = '';
    shown.forEach((it) => listEl.appendChild(makeItem(it)));

    if (emptyEl) {
      if (shown.length) {
        emptyEl.hidden = true;
      } else {
        emptyEl.hidden = false;
        emptyEl.innerHTML = '这个年份还没有节点。<button type="button" class="chip" id="avReset">显示全部</button>';
        const reset = document.getElementById('avReset');
        if (reset) reset.addEventListener('click', () => { state.year = null; render(); });
      }
    }

    if (statsEl) {
      const linked = items.filter((it) => isLink(it.url)).length;
      let html = '<span class="av-stat"><b>' + items.length + '</b>个节点</span>';
      html += '<span class="av-stat">已配视频 <b>' + linked + '</b>个</span>';
      if (shown.length !== items.length) html += '<span class="av-stat">筛选出 <b>' + shown.length + '</b>个</span>';
      statsEl.innerHTML = html;
    }
  }

  render();
})();

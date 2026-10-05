// ============================================================
// 学习视频 卡片墙渲染
//
// 数据在 learning.js（必须排在 script.js 之前），本文件排在 script.js 之后。
// 只有 learning.html 加载它。
//
// 整张卡点开就是那条 B站 视频；没填 url 的卡不可点、右下角写「待填链接」，不会出死链。
// 没填 cover 的卡走渐变色块 + 标题首字，避免缺图就开天窗（跟 galgame 卡片同一套做法）。
//
// 2026-10-06 改：卡片里要能再放一个「官网 ↗」链接（tina 要求给学习视频挂官网）。
// **HTML 不允许链接套链接**，所以卡本身从 <a> 改成 <article>，整张卡的可点区域改由
// 一张铺满卡片的「覆盖链接」.lv-card-hit 提供（z-index:1），卡片里的「B站 ↗」「官网 ↗」
// 是真的 <a>，抬到 z-index:2 —— 点卡片任意空白处 → B站，点「官网 ↗」→ 官网，两者不冲突。
// 这段做法与 aigenvideo-render.js 刻意保持一致（两页是两份平行代码，改一边记得看另一边）。
// ============================================================
(function initLearningWall() {
  const grid = document.getElementById('lvGrid');
  if (!grid) return; // 只有 learning.html 有这块

  const stats = document.getElementById('lvStats');
  const todo = document.getElementById('lvTodo');

  const all = (window.LEARNING || []).filter((v) => v && v.title);

  // 没填 cover 时用的渐变封面（与 galgame 收藏区同一套配色）
  const COVER_STYLES = [
    'linear-gradient(150deg, #3a3a7a, #6f4fa8)',
    'linear-gradient(150deg, #2c4a86, #6fa8ff)',
    'linear-gradient(150deg, #4a2f6b, #b06fb0)',
    'linear-gradient(150deg, #1f4b5e, #4fa8a8)',
    'linear-gradient(150deg, #5a3a5a, #b06f7f)',
    'linear-gradient(150deg, #2e3a6b, #7f8fd8)',
  ];

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function initialOf(title) {
    return (String(title).trim().charAt(0) || '★').toUpperCase();
  }

  // 外链小工具：统一 target=_blank + rel=noopener + 可读的 aria-label
  function makeLink(className, href, text, label) {
    const a = document.createElement('a');
    a.className = className;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = text;
    a.setAttribute('aria-label', label);
    return a;
  }

  // ---- 单张卡片 ----
  function makeCard(v) {
    const url = String(v.url || '').trim();
    const site = String(v.site || '').trim();

    // 卡本身永远是 <article>（链接不能套链接，见文件头说明）
    const card = document.createElement('article');
    card.className = 'lv-card' + (url ? '' : ' is-todo');

    // 铺满整张卡的覆盖链接：点卡片任意空白处都开 B站
    if (url) {
      const hit = makeLink('lv-card-hit', url, '', '打开《' + v.title + '》的 B站视频（新窗口）');
      hit.title = '打开 B站视频（新窗口）';
      card.appendChild(hit);
    }

    const cover = document.createElement('div');
    cover.className = 'lv-cover';

    if (v.cover) {
      const img = document.createElement('img');
      img.src = v.cover;
      img.alt = v.title + ' 封面';
      img.loading = 'lazy';
      cover.appendChild(img);
    } else {
      cover.style.background = COVER_STYLES[hashCode(v.title) % COVER_STYLES.length];
      const init = document.createElement('span');
      init.className = 'lv-cover-init';
      init.textContent = initialOf(v.title);
      cover.appendChild(init);
    }

    if (v.sample) {
      const sp = document.createElement('span');
      sp.className = 'lv-sample';
      sp.textContent = '示例';
      cover.appendChild(sp);
    }
    card.appendChild(cover);

    const body = document.createElement('div');
    body.className = 'lv-body';

    const title = document.createElement('h3');
    title.className = 'lv-title';
    title.textContent = v.title;
    body.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'lv-meta';
    const up = document.createElement('span');
    up.className = 'lv-up';
    up.textContent = [v.up, v.collection, v.date].filter(Boolean).join(' · ');
    if (v.up) up.title = v.up;
    meta.appendChild(up);

    // 右边那排：B站 ↗（填了 url 时）/ 官网 ↗（填了 site 时）/ 待填链接（两样都没有时）
    const links = document.createElement('span');
    links.className = 'lv-links';
    if (url) links.appendChild(makeLink('lv-go', url, 'B站 ↗', '打开《' + v.title + '》的 B站视频（新窗口）'));
    if (site) links.appendChild(makeLink('lv-site', site, '官网 ↗', '打开《' + v.title + '》的官网（新窗口）'));
    if (!url && !site) {
      const t = document.createElement('span');
      t.className = 'lv-go is-todo';
      t.textContent = '待填链接';
      links.appendChild(t);
    }
    meta.appendChild(links);
    body.appendChild(meta);

    if (v.tags && v.tags.length) {
      const wrap = document.createElement('div');
      wrap.className = 'lv-tags';
      // 标签只是卡片上的展示，不参与筛选
      v.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'lv-tag';
        tag.textContent = t;
        wrap.appendChild(tag);
      });
      body.appendChild(wrap);
    }

    if (v.note) {
      const note = document.createElement('p');
      note.className = 'lv-note';
      note.textContent = v.note;
      body.appendChild(note);
    }

    card.appendChild(body);
    return card;
  }

  function renderStats() {
    if (!stats) return;
    if (!all.length) {
      stats.innerHTML = '';
      return;
    }
    const linked = all.filter((v) => String(v.url || '').trim()).length;
    stats.innerHTML =
      '<span class="lv-stat"><b>' + all.length + '</b>个视频</span>' +
      '<span class="lv-stat">已填链接 <b>' + linked + '</b>个</span>';
  }

  function render() {
    grid.innerHTML = '';
    all.forEach((v) => grid.appendChild(makeCard(v)));
    renderStats();

    // 一条数据都没有时：隐藏网格与统计条，露出「待填写」占位框（现在有真数据，平时看不到）
    grid.hidden = all.length === 0;
    if (stats) stats.hidden = all.length === 0;
    if (todo) todo.hidden = all.length > 0;
  }

  render();
})();

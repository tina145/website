// ============================================================
// 学习视频 卡片墙渲染
//
// 数据在 learning.js（必须排在 script.js 之前），本文件排在 script.js 之后。
// 只有 learning.html 加载它。
//
// 2026-10-04 新建：整张卡就是一个 B站 链接（填了 url 时）；
// 没填 url 的卡渲染成不可点的 <article>，右下角写「待填链接」，不会出死链。
// 没填 cover 的卡走渐变色块 + 标题首字，避免缺图就开天窗（跟 galgame 卡片同一套做法）。
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

  // ---- 单张卡片 ----
  function makeCard(v) {
    const url = String(v.url || '').trim();

    // 填了 url 就是整张可点的 <a>，没填就是普通的 <article>（不可点）
    const card = document.createElement(url ? 'a' : 'article');
    card.className = 'lv-card' + (url ? '' : ' is-todo');
    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.title = '打开 B站视频（新窗口）';
      card.setAttribute('aria-label', '打开《' + v.title + '》的 B站视频（新窗口）');
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

    // 右边那行：填了 url 写「B站 ↗」，没填写灰字「待填链接」
    const go = document.createElement('span');
    go.className = 'lv-go' + (url ? '' : ' is-todo');
    go.textContent = url ? 'B站 ↗' : '待填链接';
    meta.appendChild(go);
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

    // 一条数据都没有时：隐藏网格与统计条，露出「待填写」占位框（现在有一条真数据，平时看不到）
    grid.hidden = all.length === 0;
    if (stats) stats.hidden = all.length === 0;
    if (todo) todo.hidden = all.length > 0;
  }

  render();
})();

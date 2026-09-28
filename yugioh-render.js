// ============================================================
// 游戏王分区的渲染（只有 yugioh.html 加载它）
// 数据在 yugioh.js 里；这里只负责把数据画成「标签栏 + 时间线」
//
// 为什么单独一个文件：数据文件要保持「能单独跑起来」（静态自检会直接
// new Function('window', 源码) 跑一遍数据文件查内容），渲染放在里面会报
// document is not defined。站里 galgame / 卡拉OK 也是数据与渲染分开的。
// ============================================================

(function initYugiohSections() {
  const tabsEl = document.getElementById('ygoTabs');
  const panelsEl = document.getElementById('ygoPanels');
  if (!tabsEl || !panelsEl) return; // 只有 yugioh.html 有这两个容器

  const sections = (window.YUGIOH_SECTIONS || []).filter((s) => s && s.id && s.name);
  if (!sections.length) {
    const note = document.createElement('p');
    note.className = 'ygo-empty-note';
    note.textContent = '这一页还没有配置子栏目：打开 yugioh.js 看看最上面那段说明。';
    panelsEl.appendChild(note);
    return;
  }

  // 按年份从早到晚排；没写年份的排在最后，且保持数组里的先后顺序（sort 是稳定的）
  function sortedItems(list) {
    return list
      .map((it, i) => ({ it: it, i: i }))
      .sort((a, b) => {
        const ay = typeof a.it.year === 'number' && isFinite(a.it.year) ? a.it.year : Infinity;
        const by = typeof b.it.year === 'number' && isFinite(b.it.year) ? b.it.year : Infinity;
        if (ay !== by) return ay - by;
        return a.i - b.i;
      })
      .map((x) => x.it);
  }

  function makeItem(it) {
    const li = document.createElement('li');
    li.className = 'ygo-item';

    const year = document.createElement('p');
    year.className = 'ygo-item-year';
    if (typeof it.year === 'number' && isFinite(it.year)) {
      year.textContent = String(it.year);
    } else {
      year.textContent = '年份待填写';
      year.classList.add('is-todo');
    }
    li.appendChild(year);

    const body = document.createElement('div');
    body.className = 'ygo-item-body';

    const h = document.createElement('h3');
    h.className = 'ygo-item-title';
    h.textContent = String(it.title);
    body.appendChild(h);

    if (it.text) {
      const p = document.createElement('p');
      p.className = 'ygo-item-text';
      p.textContent = String(it.text);
      body.appendChild(p);
    }

    if (it.tags && it.tags.length) {
      const ul = document.createElement('ul');
      ul.className = 'ygo-item-tags';
      it.tags.forEach((t) => {
        const tag = document.createElement('li');
        tag.className = 'tag';
        tag.textContent = t;
        ul.appendChild(tag);
      });
      body.appendChild(ul);
    }

    li.appendChild(body);
    return li;
  }

  // 一栏还空着时显示的占位：说明去哪填，再给一条可以直接抄的模板（不是假数据）
  function makePlaceholder() {
    const box = document.createElement('div');
    box.className = 'ygo-empty';

    const title = document.createElement('p');
    title.className = 'ygo-empty-title';
    title.textContent = '待填写';
    box.appendChild(title);

    const hint = document.createElement('p');
    hint.className = 'ygo-empty-hint';
    hint.textContent = '这一栏还空着。打开 yugioh.js，往这个子栏目的 items 里加条目，就会显示在这里（按年份排）。';
    box.appendChild(hint);

    const tpl = document.createElement('p');
    tpl.className = 'ygo-empty-tpl';
    tpl.textContent = '{ year: 1999, title: "标题", text: "一句话", tags: ["标签"] }';
    box.appendChild(tpl);

    return box;
  }

  function makePanel(s) {
    const panel = document.createElement('div');
    panel.className = 'ygo-panel';
    panel.id = 'ygoPanel-' + s.id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'ygoTab-' + s.id);
    panel.tabIndex = 0;

    if (s.lead) {
      const lead = document.createElement('p');
      lead.className = 'ygo-lead';
      lead.textContent = String(s.lead);
      panel.appendChild(lead);
    }

    const items = Array.isArray(s.items) ? s.items.filter((it) => it && String(it.title || '').trim()) : [];
    if (!items.length) {
      panel.appendChild(makePlaceholder());
      return panel;
    }

    const ol = document.createElement('ol');
    ol.className = 'ygo-timeline';
    sortedItems(items).forEach((it) => ol.appendChild(makeItem(it)));
    panel.appendChild(ol);
    return panel;
  }

  // ---- 标签栏 + 面板 ----
  const tabs = [];
  const panels = [];

  function select(idx, focus) {
    tabs.forEach((tab, i) => {
      const on = i === idx;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[idx].focus();
  }

  sections.forEach((s, idx) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'chip ygo-tab';
    tab.id = 'ygoTab-' + s.id;
    tab.textContent = String(s.name);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'ygoPanel-' + s.id);
    tab.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    tab.tabIndex = idx === 0 ? 0 : -1;
    tab.addEventListener('click', () => select(idx));
    tabsEl.appendChild(tab);
    tabs.push(tab);

    const panel = makePanel(s);
    panel.hidden = idx !== 0;
    panelsEl.appendChild(panel);
    panels.push(panel);
  });

  // 键盘：左右方向键换栏，Home / End 跳到第一栏 / 最后一栏
  tabsEl.addEventListener('keydown', (e) => {
    const cur = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    if (cur < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (cur + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (cur - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  });
})();

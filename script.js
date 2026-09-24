// 移动端导航折叠 + 滚动淡入 + 点击复制（轻量交互）
//
// 2026-09-24：站点从「单页滚动」拆成「每个分区一个页面」，
// 原来末尾那段 initSideIndex（滚动时高亮当前区块 + 点击钉住）整段删掉了 ——
// 现在「在哪一页」由每个 HTML 里的 is-active / aria-current 写死，不需要 JS 判断。

// 1. 汉堡菜单
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  // 点击菜单项后自动收起
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

// 2. 卡片滚动淡入
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// 3. 点击复制 QQ 号（不依赖 QQ 临时会话权限）
const copyBtn = document.querySelector('[data-copy]');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// 兜底复制：旧浏览器或非安全上下文没有 navigator.clipboard 时使用
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (err) {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // 权限被拒时继续走兜底
    }
  }
  return fallbackCopy(text);
}

if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const text = copyBtn.dataset.copy || '';
    const ok = await copyText(text);
    showToast(ok ? '已复制QQ号' : '复制失败，请手动记下：' + text);
  });
}

// 4. galgame 收藏清单（数据手写在 games.js，改那个文件即更新本区块）
(function initGalgameList() {
  const grid = document.getElementById('galGrid');
  if (!grid) return;

  const stats = document.getElementById('galStats');
  const empty = document.getElementById('galEmpty');
  const brandRow = document.getElementById('galBrandChips');
  const search = document.getElementById('galSearch');
  const controls = document.querySelector('.gal-controls');

  const all = (window.GALGAMES || []).filter((g) => g && g.title);

  // 没填 cover 时用的渐变封面
  const COVER_STYLES = [
    'linear-gradient(150deg, #3a3a7a, #6f4fa8)',
    'linear-gradient(150deg, #2c4a86, #6fa8ff)',
    'linear-gradient(150deg, #4a2f6b, #b06fb0)',
    'linear-gradient(150deg, #1f4b5e, #4fa8a8)',
    'linear-gradient(150deg, #5a3a5a, #b06f7f)',
    'linear-gradient(150deg, #2e3a6b, #7f8fd8)',
  ];

  const state = { brand: null, q: '' };

  function num(v) {
    return typeof v === 'number' && isFinite(v) ? v : -1;
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function initialOf(title) {
    return (String(title).trim().charAt(0) || '★').toUpperCase();
  }

  // 排序功能 2026-09-23 按 tina 要求整个删除，列表固定按 games.js 里书写的顺序显示

  // ---- 筛选按钮：只在初始化时建一次，render 里只改按下状态 ----
  const brandChips = new Map();
  let allBrandChip = null;

  function makeChip(text, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = text;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', onClick);
    return b;
  }

  // 厂商栏：先摆 games.js 里写死的预设厂商，再补上作品数据里出现的其它厂商
  const brandPresets = Array.isArray(window.GAL_BRAND_PRESETS) ? window.GAL_BRAND_PRESETS : [];

  if (all.length && brandRow) {
    // 作品数据里出现过的厂商，按作品数量从多到少
    const counts = new Map();
    all.forEach((g) => {
      const b = String(g.brand || '').trim();
      if (b) counts.set(b, (counts.get(b) || 0) + 1);
    });
    // 预设厂商排在最前（保持写死时的先后顺序），剩下的按数量排
    const fromData = [...counts.keys()]
      .filter((b) => !brandPresets.includes(b))
      .sort((a, b) => counts.get(b) - counts.get(a) || String(a).localeCompare(String(b), 'ja'));
    const brands = [...brandPresets, ...fromData];

    allBrandChip = makeChip('全部厂商', () => {
      state.brand = null;
      render();
    });
    brandRow.appendChild(allBrandChip);

    brands.forEach((b) => {
      const chip = makeChip(b, () => {
        state.brand = state.brand === b ? null : b;
        render();
      });
      brandChips.set(b, chip);
      brandRow.appendChild(chip);
    });
  }

  // 一条数据都没有时，筛选条没必要显示
  if (!all.length && controls) controls.hidden = true;

  // ---- 单张卡片 ----
  function makeCard(g) {
    const card = document.createElement('article');
    card.className = 'gal-card';

    const cover = document.createElement('div');
    cover.className = 'gal-cover';

    if (g.cover) {
      const img = document.createElement('img');
      img.src = g.cover;
      img.alt = g.title + ' 封面';
      img.loading = 'lazy';
      cover.appendChild(img);
    } else {
      cover.style.background = COVER_STYLES[hashCode(g.title) % COVER_STYLES.length];
      const init = document.createElement('span');
      init.className = 'gal-cover-init';
      init.textContent = initialOf(g.title);
      cover.appendChild(init);
    }

    const badges = document.createElement('div');
    badges.className = 'gal-badge-row';
    if (g.sample) {
      const sp = document.createElement('span');
      sp.className = 'gal-sample';
      sp.textContent = '示例';
      badges.appendChild(sp);
    }
    if (badges.childNodes.length) cover.appendChild(badges);
    card.appendChild(cover);

    const body = document.createElement('div');
    body.className = 'gal-body';

    const title = document.createElement('h3');
    title.className = 'gal-title';
    title.textContent = g.title;
    body.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'gal-meta';
    const brand = document.createElement('span');
    brand.className = 'gal-brand';
    brand.textContent = [g.brand, g.year].filter(Boolean).join(' · ');
    if (g.brand) brand.title = g.brand;
    meta.appendChild(brand);
    // 官网链接：可选字段 site，没填就完全不渲染（字段说明见 games.js）
    if (g.site) {
      const site = document.createElement('a');
      site.className = 'gal-site';
      site.href = String(g.site);
      site.target = '_blank';
      site.rel = 'noopener';
      site.title = '打开官网（新窗口）';
      site.setAttribute('aria-label', '打开《' + g.title + '》官网（新窗口）');
      site.textContent = '官网 ↗';
      meta.appendChild(site);
    }
    // 没打分就完全不显示评分块（原来会显示一个「未评分」占位，2026-09-23 按 tina 要求删掉）
    if (num(g.score) >= 0) {
      const score = document.createElement('span');
      score.className = 'gal-score';
      score.textContent = '★ ' + g.score;
      meta.appendChild(score);
    }
    body.appendChild(meta);

    if (g.tags && g.tags.length) {
      const wrap = document.createElement('div');
      wrap.className = 'gal-tags';
      // 标签现在只是卡片上的展示标签，不再点击筛选（筛选栏已改成按厂商）
      g.tags.forEach((t) => {
        const span = document.createElement('span');
        span.className = 'gal-tag';
        span.textContent = t;
        wrap.appendChild(span);
      });
      body.appendChild(wrap);
    }

    if (g.note) {
      const note = document.createElement('p');
      note.className = 'gal-note';
      note.textContent = g.note;
      body.appendChild(note);
    }

    card.appendChild(body);
    return card;
  }

  function renderStats(shown) {
    if (!stats) return;
    if (!all.length) {
      stats.innerHTML = '';
      return;
    }
    // 统计条不显示平均分（2026-09-23 按 tina 要求删除）；作品自己的评分仍在卡片上显示
    let html = '<span class="gal-stat"><b>' + all.length + '</b>部收藏</span>';
    if (shown !== all.length) {
      html += '<span class="gal-stat">筛选出 <b>' + shown + '</b>部</span>';
    }
    stats.innerHTML = html;
  }

  function render() {
    if (allBrandChip) allBrandChip.setAttribute('aria-pressed', String(state.brand === null));
    brandChips.forEach((chip, b) => chip.setAttribute('aria-pressed', String(state.brand === b)));

    let list = all.filter((g) => {
      if (state.brand && String(g.brand || '').trim() !== state.brand) return false;
      if (state.q) {
        const hay = [g.title, g.brand, (g.tags || []).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      return true;
    });

    grid.innerHTML = '';
    list.forEach((g) => grid.appendChild(makeCard(g)));

    if (empty) {
      if (list.length) {
        empty.hidden = true;
      } else {
        empty.hidden = false;
        if (all.length) {
          empty.innerHTML =
            '没有符合条件的作品。<button type="button" class="chip" id="galReset">清空筛选</button>';
          const reset = document.getElementById('galReset');
          if (reset) {
            reset.addEventListener('click', () => {
              state.brand = null;
              state.brand = null;
              state.q = '';
              if (search) search.value = '';
              render();
            });
          }
        } else {
          empty.textContent = '清单还是空的：打开 games.js 往里加作品就行。';
        }
      }
    }

    renderStats(list.length);
  }

  if (search) {
    search.addEventListener('input', () => {
      state.q = search.value.trim().toLowerCase();
      render();
    });
  }

  render();
})();

// 6. 卡拉OK 歌单（数据手写在 karaoke.js，改那个文件即更新本页）
//    每条点开就是一条 B站链接；没填 url 的条目显示「待填链接」，不会变成死链
(function initKaraokeList() {
  const list = document.getElementById('karaList');
  if (!list) return; // 只有 karaoke.html 有这块

  const stats = document.getElementById('karaStats');
  const empty = document.getElementById('karaEmpty');
  const chipRow = document.getElementById('karaCollectionChips');
  const search = document.getElementById('karaSearch');
  const controls = document.querySelector('.kara-controls');

  const all = (window.KARAOKE || []).filter((k) => k && k.title);
  const state = { collection: null, q: '' };

  // ---- 合集筛选按钮：预设排最前（按预设顺序），其余按条目数从多到少 ----
  const presets = Array.isArray(window.KARAOKE_COLLECTION_PRESETS) ? window.KARAOKE_COLLECTION_PRESETS : [];
  const chips = new Map();
  let allChip = null;

  function makeChip(text, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = text;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', onClick);
    return b;
  }

  if (all.length && chipRow) {
    const counts = new Map();
    all.forEach((k) => {
      const c = String(k.collection || '').trim();
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    });
    // 预设置写但一条数据都没用到的，不生成按钮（免得出现永远筛出 0 条的空按钮）
    const head = presets.filter((c) => counts.has(c));
    const rest = [...counts.keys()]
      .filter((c) => !presets.includes(c))
      .sort((a, b) => counts.get(b) - counts.get(a) || String(a).localeCompare(String(b), 'ja'));

    allChip = makeChip('全部合集', () => {
      state.collection = null;
      render();
    });
    chipRow.appendChild(allChip);

    [...head, ...rest].forEach((c) => {
      const chip = makeChip(c, () => {
        state.collection = state.collection === c ? null : c;
        render();
      });
      chips.set(c, chip);
      chipRow.appendChild(chip);
    });
  }

  // 一条数据都没有时，筛选条没必要显示
  if (!all.length && controls) controls.hidden = true;

  // ---- 单条 ----
  function makeItem(k) {
    const url = String(k.url || '').trim();
    const item = document.createElement(url ? 'a' : 'div');
    item.className = 'kara-item' + (url ? '' : ' is-todo');
    if (url) {
      item.href = url;
      item.target = '_blank';
      item.rel = 'noopener';
      item.title = '打开 B站视频（新窗口）';
      item.setAttribute('aria-label', '打开《' + k.title + '》的 B站视频（新窗口）');
    }

    const idx = document.createElement('span');
    idx.className = 'kara-idx';
    // 序号按整份歌单里的位置算，筛来筛去不会跳号
    const no = all.indexOf(k) + 1;
    idx.textContent = no < 10 ? '0' + no : String(no);
    item.appendChild(idx);

    const main = document.createElement('span');
    main.className = 'kara-main';

    const title = document.createElement('span');
    title.className = 'kara-title';
    title.textContent = k.title;
    if (k.sample) {
      const sp = document.createElement('span');
      sp.className = 'kara-sample';
      sp.textContent = '示例';
      title.appendChild(sp);
    }
    main.appendChild(title);

    const subText = [k.artist, k.source, k.collection].filter(Boolean).join(' · ');
    if (subText) {
      const sub = document.createElement('span');
      sub.className = 'kara-sub';
      sub.textContent = subText;
      main.appendChild(sub);
    }

    if (k.tags && k.tags.length) {
      const wrap = document.createElement('span');
      wrap.className = 'kara-tags';
      // 标签只是展示，不参与筛选（筛选是上面的合集按钮 + 搜索框）
      k.tags.forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'kara-tag';
        tag.textContent = t;
        wrap.appendChild(tag);
      });
      main.appendChild(wrap);
    }

    if (k.note) {
      const note = document.createElement('span');
      note.className = 'kara-note';
      note.textContent = k.note;
      main.appendChild(note);
    }
    item.appendChild(main);

    const go = document.createElement('span');
    go.className = 'kara-go' + (url ? '' : ' is-todo');
    go.textContent = url ? 'B站 ↗' : '待填链接';
    item.appendChild(go);

    return item;
  }

  function renderStats(shown) {
    if (!stats) return;
    if (!all.length) {
      stats.innerHTML = '';
      return;
    }
    const linked = all.filter((k) => String(k.url || '').trim()).length;
    let html = '<span class="kara-stat"><b>' + all.length + '</b>首在册</span>';
    html += '<span class="kara-stat">已填链接 <b>' + linked + '</b>首</span>';
    if (shown !== all.length) html += '<span class="kara-stat">筛选出 <b>' + shown + '</b>首</span>';
    stats.innerHTML = html;
  }

  function render() {
    if (allChip) allChip.setAttribute('aria-pressed', String(state.collection === null));
    chips.forEach((chip, c) => chip.setAttribute('aria-pressed', String(state.collection === c)));

    const shown = all.filter((k) => {
      if (state.collection && String(k.collection || '').trim() !== state.collection) return false;
      if (state.q) {
        // 曲名里常有排版空格（B站 上很常见，比如「耀 上 圣 素」），所以两边都把空格去掉再比，
        // 这样搜「圣素」「耀上圣素」都能命中（只影响匹配，显示还是原样）
        const hay = [k.title, k.artist, k.source, k.collection, (k.tags || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .replace(/\s+/g, '');
        if (hay.indexOf(state.q.replace(/\s+/g, '')) === -1) return false;
      }
      return true;
    });

    list.innerHTML = '';
    shown.forEach((k) => list.appendChild(makeItem(k)));

    if (empty) {
      if (shown.length) {
        empty.hidden = true;
      } else {
        empty.hidden = false;
        if (all.length) {
          empty.innerHTML =
            '没有符合条件的歌。<button type="button" class="chip" id="karaReset">清空筛选</button>';
          const reset = document.getElementById('karaReset');
          if (reset) {
            reset.addEventListener('click', () => {
              state.collection = null;
              state.q = '';
              if (search) search.value = '';
              render();
            });
          }
        } else {
          empty.textContent = '歌单还是空的：打开 karaoke.js 往里加条目就行。';
        }
      }
    }

    renderStats(shown.length);
  }

  if (search) {
    search.addEventListener('input', () => {
      state.q = search.value.trim().toLowerCase();
      render();
    });
  }

  render();
})();

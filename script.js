// 移动端导航折叠 + 滚动淡入（轻量交互）

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
  const sortSel = document.getElementById('galSort');
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

  const state = { brand: null, q: '', sort: 'default' };

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

  const SORTERS = {
    default: null,
    yearDesc: (a, b) => (b.year || 0) - (a.year || 0),
    yearAsc: (a, b) => (a.year || 9999) - (b.year || 9999),
    scoreDesc: (a, b) => num(b.score) - num(a.score),
    titleAsc: (a, b) => String(a.title).localeCompare(String(b.title), 'ja'),
  };

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
    const score = document.createElement('span');
    if (num(g.score) >= 0) {
      score.className = 'gal-score';
      score.textContent = '★ ' + g.score;
    } else {
      score.className = 'gal-score gal-score--none';
      score.textContent = '未评分';
    }
    meta.append(brand, score);
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
    const scored = all.map((g) => num(g.score)).filter((n) => n >= 0);
    const avg = scored.length ? (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1) : '—';

    let html =
      '<span class="gal-stat"><b>' + all.length + '</b>部收藏</span>' +
      '<span class="gal-stat"><b>' + avg + '</b>平均分</span>';
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

    const cmp = SORTERS[state.sort];
    if (cmp) list = list.slice().sort(cmp);

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
  if (sortSel) {
    sortSel.addEventListener('change', () => {
      state.sort = sortSel.value;
      render();
    });
  }

  render();
})();

// 5. 左侧索引：滚动时高亮当前区块（点索引跳转时以点击的那一项为准）
(function initSideIndex() {
  const box = document.getElementById('sideIndex');
  if (!box) return;

  // 判定线：视口顶端往下 96px（比锚点跳转留白 80px 更低一点，才不会判漏）
  const LINE = 96;

  // 只收「href 指向的区块真的存在」的条目，写错 id 不会把整块拖垮
  const items = [];
  box.querySelectorAll('.side-index-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    const section = document.getElementById(href.slice(1));
    if (section) items.push({ link, section });
  });
  if (!items.length) return;

  let queued = false;

  // 点了哪一项就先钉住哪一项。页面底部两个区块挤在一起，
  // 点「现在」和点「联系」最后会停在完全相同的位置，光看滚动位置分不出来
  let pinned = null;

  function activate(current) {
    items.forEach((it) => {
      const on = it === current;
      it.link.classList.toggle('is-active', on);
      if (on) it.link.setAttribute('aria-current', 'true');
      else it.link.removeAttribute('aria-current');
    });
  }

  function update() {
    queued = false;

    // 钉住期间不用管位置，点了谁就亮谁
    if (pinned) {
      activate(pinned);
      return;
    }

    // 拖到底时最后一屏露不全，判定线走不到「联系」，直接点亮最后一项，
    // 否则那一项永远高亮不起来
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) {
      activate(items[items.length - 1]);
      return;
    }

    // 判定线放在顶栏下沿附近：区块顶端越过这条线，才算「进入」这个区块
    // 值必须比 scroll-margin-top 大，否则刚好停在锚点位置时判不出来
    const line = window.scrollY + LINE;
    let current = items[0];
    items.forEach((it) => {
      if (it.section.getBoundingClientRect().top + window.scrollY <= line) current = it;
    });
    activate(current);
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  items.forEach((it) => {
    it.link.addEventListener('click', () => {
      pinned = it;
      activate(it);
    });
  });

  // 自己动了页面就取消钉住，交回给位置判断（滚轮 / 触摸 / 拖滚动条 / 翻页键）
  function unpin() {
    if (!pinned) return;
    pinned = null;
    onScroll();
  }
  const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
  window.addEventListener('wheel', unpin, { passive: true });
  window.addEventListener('touchstart', unpin, { passive: true });
  window.addEventListener('mousedown', unpin, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (SCROLL_KEYS.indexOf(e.key) !== -1) unpin();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
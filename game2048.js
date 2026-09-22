// ============================================================
// 小游戏：2048
// 逻辑、渲染、存档都在这一个文件里；index.html 里只有一个空容器
//
// 存档（localStorage，失败就静默跳过，不影响玩）：
//   tina2048.save  {"tiles":[{"v":2,"r":0,"c":0}, ...],"score":0}  —— 刷新后接着玩
//   tina2048.best  最高分
//
// 操作：点一下棋盘 → 方向键或 WASD；手机在棋盘上滑动。
// 方向键只在棋盘获得焦点时才拦截，免得抢走整页的滚动。
// ============================================================

(function initGame2048() {
  const root = document.getElementById('game2048');
  if (!root) return;

  const SIZE = 4;
  const WIN = 2048;
  const SAVE_KEY = 'tina2048.save';
  const BEST_KEY = 'tina2048.best';

  const boardEl = document.getElementById('g2048Board');
  const gridEl = document.getElementById('g2048Grid');
  const tilesEl = document.getElementById('g2048Tiles');
  const scoreEl = document.getElementById('g2048Score');
  const bestEl = document.getElementById('g2048Best');
  const overlayEl = document.getElementById('g2048Overlay');
  const overlayTextEl = document.getElementById('g2048OverlayText');
  const againEl = document.getElementById('g2048Again');
  const keepEl = document.getElementById('g2048Keep');
  const restartEl = document.getElementById('g2048Restart');

  if (!boardEl || !gridEl || !tilesEl) return;

  // 背景 16 个空格子，纯装饰
  for (let i = 0; i < SIZE * SIZE; i++) gridEl.appendChild(document.createElement('div'));

  // tiles 是唯一的真实状态：每个方块自己记着现在在哪、上一轮在哪
  let tiles = [];
  let score = 0;
  let best = 0;
  let nextId = 1;
  let finished = false; // 已经无处可动
  let won = false;      // 已经达成过 2048
  let flushTimer = 0;

  /* ---------------- 存档 ---------------- */

  function readBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY), 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeBest() {
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        tiles: tiles.filter((t) => !t.dead).map((t) => ({ v: t.value, r: t.r, c: t.c })),
        score: score,
      }));
    } catch (e) {}
  }

  function isPow2(v) {
    const l = Math.log2(v);
    return Number.isFinite(l) && Math.pow(2, Math.round(l)) === v;
  }

  // 存档可能是手改过的、旧版的、坏的，一律校验，不合格就当没有
  function loadSave() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
    if (!data || !Array.isArray(data.tiles) || !data.tiles.length) return null;
    if (data.tiles.length > SIZE * SIZE) return null;

    const seen = {};
    for (const t of data.tiles) {
      if (!t || !isPow2(t.v)) return null;
      if (!Number.isInteger(t.r) || !Number.isInteger(t.c)) return null;
      if (t.r < 0 || t.r >= SIZE || t.c < 0 || t.c >= SIZE) return null;
      const k = t.r + ',' + t.c;
      if (seen[k]) return null;
      seen[k] = true;
    }

    const s = typeof data.score === 'number' && isFinite(data.score) && data.score >= 0 ? data.score : 0;
    return { tiles: data.tiles, score: s };
  }

  /* ---------------- 画出来 ---------------- */

  function tileNode(t) {
    const el = document.createElement('div');
    el.className = 'g2048-tile';
    el.dataset.val = String(t.value);
    el.dataset.len = String(t.value).length;
    el.style.setProperty('--g-r', t.r);
    el.style.setProperty('--g-c', t.c);
    const inner = document.createElement('div');
    inner.className = 'g2048-tile-inner';
    inner.textContent = String(t.value);
    el.appendChild(inner);
    return el;
  }

  function place(el, t) {
    el.style.setProperty('--g-r', t.r);
    el.style.setProperty('--g-c', t.c);
  }

  function paint() {
    for (const t of tiles) {
      if (!t.el) {
        t.el = tileNode(t);
        tilesEl.appendChild(t.el);
      } else {
        place(t.el, t);
        t.el.dataset.val = String(t.value);
        t.el.dataset.len = String(t.value).length;
        if (t.el.firstChild) t.el.firstChild.textContent = String(t.value);
        t.el.classList.toggle('is-dead', !!t.dead);
      }

      // 动画类要先摘掉再挂上，否则第二次不会重新播
      if (t.isNew || t.merged) {
        t.el.classList.remove('is-new', 'is-merged');
        void t.el.offsetWidth;
        t.el.classList.add(t.isNew ? 'is-new' : 'is-merged');
      } else {
        t.el.classList.remove('is-new', 'is-merged');
      }
      t.el.classList.toggle('is-huge', t.value > WIN);
      t.isNew = false;
    }

    // 被吃掉的那个方块要滑到目标格再消失，所以延迟删
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flushDead, 200);
  }

  function flushDead() {
    let has = false;
    for (const t of tiles) if (t.dead) { has = true; break; }
    if (!has) return;
    for (const t of tiles) {
      if (t.dead && t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el);
    }
    tiles = tiles.filter((t) => !t.dead);
  }

  function paintScore() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (bestEl) bestEl.textContent = String(best);
  }

  /* ---------------- 状态查询 ---------------- */

  function emptyCells() {
    const used = {};
    for (const t of tiles) if (!t.dead) used[t.r * SIZE + t.c] = true;
    const out = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      if (!used[i]) out.push({ r: Math.floor(i / SIZE), c: i % SIZE });
    }
    return out;
  }

  function toGrid() {
    const g = [];
    for (let r = 0; r < SIZE; r++) g.push(new Array(SIZE).fill(0));
    for (const t of tiles) if (!t.dead) g[t.r][t.c] = t.value;
    return g;
  }

  function maxValue() {
    let m = 0;
    for (const t of tiles) if (!t.dead && t.value > m) m = t.value;
    return m;
  }

  function canMove() {
    if (emptyCells().length) return true;
    const g = toGrid();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = g[r][c];
        if (c + 1 < SIZE && g[r][c + 1] === v) return true;
        if (r + 1 < SIZE && g[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  /* ---------------- 新方块 / 移动 ---------------- */

  function spawn() {
    const free = emptyCells();
    if (!free.length) return;
    const at = free[Math.floor(Math.random() * free.length)];
    tiles.push({
      id: nextId++,
      value: Math.random() < 0.9 ? 2 : 4,
      r: at.r, c: at.c, prevR: at.r, prevC: at.c,
      merged: false, isNew: true, dead: false, el: null,
    });
  }

  const DIRS = {
    left: { horizontal: true, forward: true },
    right: { horizontal: true, forward: false },
    up: { horizontal: false, forward: true },
    down: { horizontal: false, forward: false },
  };

  function move(dir) {
    const d = DIRS[dir];
    // 弹层挡着（赢了还没点「继续玩」/ 已经输）时不响应
    if (!d || finished || !overlayEl.hidden) return false;
    flushDead();

    let gained = 0;
    for (const t of tiles) {
      t.merged = false;
      t.dead = false;
      t.prevR = t.r;
      t.prevC = t.c;
    }

    // 逐行（或逐列）处理：先按推进方向排序，再压缩 + 合并，最后写回新位置
    for (let line = 0; line < SIZE; line++) {
      const list = [];
      for (const t of tiles) {
        if ((d.horizontal ? t.r : t.c) === line) list.push(t);
      }
      list.sort((a, b) => {
        const av = d.horizontal ? a.c : a.r;
        const bv = d.horizontal ? b.c : b.r;
        return d.forward ? av - bv : bv - av;
      });

      const kept = [];
      for (const t of list) {
        const last = kept[kept.length - 1];
        // 同一轮里已经合并过的方块不能再吃一次，所以 [2,2,2,2] 是 4+4 不是 8
        if (last && last.value === t.value && !last.merged) {
          last.value *= 2;
          last.merged = true;
          gained += last.value;
          t.dead = true; // 被吃掉的这个滑过去再消失
          if (d.horizontal) t.c = last.c; else t.r = last.r;
        } else {
          kept.push(t);
        }
      }

      for (let i = 0; i < kept.length; i++) {
        const p = d.forward ? i : SIZE - 1 - i;
        if (d.horizontal) kept[i].c = p; else kept[i].r = p;
      }
    }

    let changed = false;
    for (const t of tiles) {
      if (t.dead || t.r !== t.prevR || t.c !== t.prevC) { changed = true; break; }
    }
    if (!changed) return false; // 这一步什么也没动，不生成新方块也不计分

    score += gained;
    if (score > best) {
      best = score;
      writeBest();
    }
    spawn();
    paint();
    paintScore();
    save();
    checkOver();
    return true;
  }

  /* ---------------- 结束 / 达成 ---------------- */

  function checkOver() {
    if (!won && maxValue() >= WIN) {
      won = true;
      showOverlay('达成 ' + WIN + '！想继续刷分也行。', true);
      return;
    }
    if (!canMove()) {
      finished = true;
      showOverlay('没有可以移动的方向了，本局 ' + score + ' 分。', false);
    }
  }

  function showOverlay(text, withKeep) {
    if (!overlayEl) return;
    if (overlayTextEl) overlayTextEl.textContent = text;
    if (keepEl) keepEl.hidden = !withKeep;
    overlayEl.hidden = false;
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.hidden = true;
  }

  function newGame() {
    flushDead();
    tilesEl.innerHTML = '';
    tiles = [];
    score = 0;
    finished = false;
    won = false;
    hideOverlay();
    spawn();
    spawn();
    paint();
    paintScore();
    save();
  }

  function restore() {
    const data = loadSave();
    if (!data) {
      newGame();
      return;
    }
    tiles = data.tiles.map((t) => ({
      id: nextId++,
      value: t.v,
      r: t.r, c: t.c, prevR: t.r, prevC: t.c,
      merged: false, isNew: false, dead: false, el: null,
    }));
    score = data.score;
    won = maxValue() >= WIN;
    finished = false;
    hideOverlay();
    paint();
    paintScore();
    if (!canMove()) {
      finished = true;
      showOverlay('没有可以移动的方向了，本局 ' + score + ' 分。', false);
    }
  }

  /* ---------------- 尺寸：跟着棋盘宽度算格子大小 ---------------- */

  function resize() {
    const w = boardEl.clientWidth;
    if (!w) return;
    const gap = Math.max(7, Math.round(w * 0.026));
    boardEl.style.setProperty('--g-gap', gap + 'px');
    boardEl.style.setProperty('--g-cell', (w - gap * (SIZE + 1)) / SIZE + 'px');
  }

  /* ---------------- 输入 ---------------- */

  const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', a: 'left', s: 'down', d: 'right',
    W: 'up', A: 'left', S: 'down', D: 'right',
  };

  boardEl.addEventListener('keydown', (e) => {
    const dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault(); // 焦点在棋盘里时方向键算操作，不滚页面
    move(dir);
  });

  function focusBoard() {
    try {
      boardEl.focus({ preventScroll: true });
    } catch (e) {
      boardEl.focus();
    }
  }

  boardEl.addEventListener('click', focusBoard);

  // 手机：滑动
  let touchStart = null;
  boardEl.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { touchStart = null; return; }
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  boardEl.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return; // 太短当作点击
    if (ax >= ay) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }, { passive: true });

  if (againEl) againEl.addEventListener('click', () => { newGame(); focusBoard(); });
  if (restartEl) restartEl.addEventListener('click', () => { newGame(); focusBoard(); });
  if (keepEl) keepEl.addEventListener('click', () => { hideOverlay(); focusBoard(); });

  /* ---------------- 起手 ---------------- */

  best = readBest();
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(boardEl);
  else window.addEventListener('resize', resize);
  restore();
})();

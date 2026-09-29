// ============================================================
// 小游戏：俄罗斯方块（10 × 20）
// 逻辑、渲染、存档都在这个文件里；minigames.html 里只有一个容器
//
// 操作：
//   键盘（先点一下棋盘，让焦点在棋盘上）：
//     ← →  左右移动      ↓  软降（每格 +1 分）
//     ↑ 或 X  顺时针转    Z  逆时针转
//     空格  硬降（直接落到底，每格 +2 分）    P 或 Esc  暂停 / 继续
//   也可以点棋盘右边的按钮（手机上用），按钮和键盘是同一套动作。
//   方向键只在棋盘聚焦时才拦截，免得抢走整页的滚动（跟 2048 / 五子棋同一套做法）。
//
// 难度三档（只影响下落速度与「落点影子」）：
//   简单  起始 800ms/格，每升一级 ×0.85，显示落点影子
//   普通  起始 550ms/格，每升一级 ×0.82，显示落点影子
//   困难  起始 320ms/格，每升一级 ×0.78，不显示落点影子
//   等级 = 每消 10 行升一级（最快也不会快过 70ms/格）
//   切换难度立刻生效（不重开），跟五子棋那边点难度按钮的行为一致
//
// 计分（经典算法）：
//   一次消 1 / 2 / 3 / 4 行 = 100 / 300 / 500 / 800 分，再乘以「消行前」的等级
//   软降每格 +1、硬降每格 +2；分数只增不减
//
// 存档（localStorage，失败就静默跳过，不影响玩）：
//   tinaTetris.save  {"grid":"0…共200个字符","piece":{...},"next":n,"score":s,"lines":n,"diff":"normal"}
//                    grid 里 0 是空格、1~7 是七种方块的编号，刷新后接着玩
//   tinaTetris.best  最高分（只增不减）
// ============================================================

(function initGameTetris() {
  const root = document.getElementById('gameTetris');
  if (!root) return;

  const COLS = 10;
  const ROWS = 20;
  const SAVE_KEY = 'tinaTetris.save';
  const BEST_KEY = 'tinaTetris.best';

  const boardEl = document.getElementById('tetBoard');
  const canvas = document.getElementById('tetCanvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!boardEl || !canvas || !ctx) return;

  const nextCanvas = document.getElementById('tetNext');
  const nextCtx = nextCanvas && nextCanvas.getContext ? nextCanvas.getContext('2d') : null;
  const scoreEl = document.getElementById('tetScore');
  const linesEl = document.getElementById('tetLines');
  const levelEl = document.getElementById('tetLevel');
  const bestEl = document.getElementById('tetBest');
  const statusEl = document.getElementById('tetStatus');
  const overlayEl = document.getElementById('tetOverlay');
  const overlayTextEl = document.getElementById('tetOverlayText');
  const againEl = document.getElementById('tetAgain');
  const lookEl = document.getElementById('tetLook');
  const restartEl = document.getElementById('tetRestart');
  const startEl = document.getElementById('tetStart');   // 开始 / 暂停 / 继续 / 再来一局
  const resumeEl = document.getElementById('tetResume'); // 弹层里的「继续」（暂停时才显示）
  const levelsEl = document.getElementById('tetLevels');

  /* ---------------- 方块与难度 ---------------- */

  // 七种方块的外形（都在包围盒的靠上一侧，生成时就出现在棋盘最上面）
  const PIECES = [
    { name: 'I', color: '#4fd0e0' },
    { name: 'J', color: '#5b7cfa' },
    { name: 'L', color: '#f0a04b' },
    { name: 'O', color: '#ffd479' },
    { name: 'S', color: '#5ec97a' },
    { name: 'T', color: '#b06fd0' },
    { name: 'Z', color: '#e0607f' },
  ];

  const SHAPES = [
    [[1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],                         // J
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],                         // L
    [[1, 1], [1, 1]],                                          // O
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],                         // S
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],                         // T
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],                         // Z
  ];

  // 三档难度：base = 一级时的下落间隔（毫秒），factor = 每升一级乘多少
  const DIFFS = {
    easy: { name: '简单', base: 800, factor: 0.85, ghost: true },
    normal: { name: '普通', base: 550, factor: 0.82, ghost: true },
    hard: { name: '困难', base: 320, factor: 0.78, ghost: false },
  };
  const DIFF_KEYS = ['easy', 'normal', 'hard'];

  const LINE_SCORE = [0, 100, 300, 500, 800]; // 消 0/1/2/3/4 行的基础分

  /* ---------------- 状态 ---------------- */

  const grid = new Array(ROWS * COLS).fill(0); // 0 空，1~7 = 方块类型 + 1
  let piece = null;      // { idx, rot, shape, x, y }
  let nextIdx = 0;
  let score = 0;
  let lines = 0;
  let best = 0;
  let level = 1;
  let diff = 'normal';
  let paused = false;
  let over = false;
  let started = false;   // 还没点「开始」时不落方块（棋盘先摆着等你）
  let tickTimer = 0;
  let size = 0, cell = 0, dpr = 1;

  const at = (x, y) => (x < 0 || x >= COLS || y < 0 || y >= ROWS) ? -1 : grid[y * COLS + x];
  const diffCfg = () => DIFFS[diff] || DIFFS.normal;
  // 能操作 / 能下落的状态：已经开始、没暂停、没结束、手上有方块
  const canPlay = () => started && !paused && !over && !!piece;

  function rotateCW(m) {
    const n = m.length;
    const out = [];
    for (let y = 0; y < n; y++) {
      out.push([]);
      for (let x = 0; x < n; x++) out[y].push(m[n - 1 - x][y]);
    }
    return out;
  }

  function shapeOf(idx, rot) {
    let s = SHAPES[idx];
    for (let i = 0; i < (rot % 4 + 4) % 4; i++) s = rotateCW(s);
    return s;
  }

  function collides(shape, px, py) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const bx = px + x;
        const by = py + y;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by < 0) continue;                        // 棋盘上方不算撞
        if (grid[by * COLS + bx]) return true;
      }
    }
    return false;
  }

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
        grid: grid.join(''),
        piece: piece ? { i: piece.idx, r: piece.rot, x: piece.x, y: piece.y } : null,
        next: nextIdx,
        score: score,
        lines: lines,
        diff: diff,
      }));
    } catch (e) {}
  }

  // 存档可能是手改的、旧版的、坏的，逐项校验，不合格就当没有
  function loadSave() {
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
    if (!data || typeof data.grid !== 'string' || data.grid.length !== ROWS * COLS) return null;
    for (const ch of data.grid) if (ch < '0' || ch > '7') return null;

    const p = data.piece;
    if (p && (!Number.isInteger(p.i) || p.i < 0 || p.i >= SHAPES.length)) return null;
    if (p && (!Number.isInteger(p.r) || p.r < 0 || p.r > 3)) return null;
    if (p && (!Number.isInteger(p.x) || p.x < -4 || p.x > COLS)) return null;
    if (p && (!Number.isInteger(p.y) || p.y < -4 || p.y > ROWS)) return null;

    const n = data.next;
    if (!Number.isInteger(n) || n < 0 || n >= SHAPES.length) return null;

    const sc = typeof data.score === 'number' && isFinite(data.score) && data.score >= 0 ? data.score : 0;
    const ln = Number.isInteger(data.lines) && data.lines >= 0 ? data.lines : 0;
    const df = DIFF_KEYS.indexOf(data.diff) >= 0 ? data.diff : 'normal';

    return { grid: data.grid, piece: p || null, next: n, score: sc, lines: ln, diff: df };
  }

  /* ---------------- 方块生成 / 移动 / 消行 ---------------- */

  function randomPiece() {
    return Math.floor(Math.random() * SHAPES.length);
  }

  function spawn() {
    const idx = nextIdx;
    nextIdx = randomPiece();
    piece = { idx: idx, rot: 0, shape: shapeOf(idx, 0), x: Math.floor((COLS - SHAPES[idx][0].length) / 2), y: 0 };
    paintNext();
    if (collides(piece.shape, piece.x, piece.y)) { // 新方块一出场就被挡住 = 结束
      gameOver();
      return false;
    }
    return true;
  }

  function move(dx) {
    if (over) return false;
    if (!started) startGame();   // 没开始就动了方向键/按钮，等于按了「开始」
    if (!canPlay()) return false;
    if (collides(piece.shape, piece.x + dx, piece.y)) return false;
    piece.x += dx;
    afterChange();
    return true;
  }

  function rotate(dir) {
    if (over) return false;
    if (!started) startGame();
    if (!canPlay()) return false;
    const rot = ((piece.rot + dir) % 4 + 4) % 4;
    const shape = shapeOf(piece.idx, rot);
    // 贴墙时左右挪一两格再试（简易踢墙）
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!collides(shape, piece.x + dx, piece.y)) {
        piece.rot = rot;
        piece.shape = shape;
        piece.x += dx;
        afterChange();
        return true;
      }
    }
    return false;
  }

  // 能不能再往下走一格
  const canFall = () => !!piece && !collides(piece.shape, piece.x, piece.y + 1);

  function stepDown() {
    if (!canPlay()) return false;
    if (!canFall()) {
      lock();
      return false;
    }
    piece.y += 1;
    afterChange();
    return true;
  }

  function softDrop() {
    if (over) return false;
    if (!started) startGame();
    if (!canPlay()) return false;
    if (!canFall()) { lock(); return false; }
    piece.y += 1;
    score += 1; // 软降每格 +1
    paintScore();
    afterChange();
    return true;
  }

  function hardDrop() {
    if (over) return false;
    if (!started) startGame();
    if (!canPlay()) return false;
    let n = 0;
    while (canFall()) { piece.y += 1; n++; }
    score += n * 2; // 硬降每格 +2
    paintScore();
    lock();
    return true;
  }

  function lock() {
    const shape = piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const bx = piece.x + x;
        const by = piece.y + y;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) grid[by * COLS + bx] = piece.idx + 1;
      }
    }
    piece = null;
    clearLines();
    paintScore();
    const ok = spawn();
    save();   // 一定要在生成新方块「之后」再存，否则刷新会丢掉手上这个方块
    afterChange();
    if (ok) schedule();
    return ok;
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      let full = true;
      for (let x = 0; x < COLS; x++) {
        if (!grid[y * COLS + x]) { full = false; break; }
      }
      if (!full) continue;
      cleared++;
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < COLS; x++) grid[yy * COLS + x] = grid[(yy - 1) * COLS + x];
      }
      for (let x = 0; x < COLS; x++) grid[x] = 0;
      y++; // 上面落下来的一行要重新检查
    }
    if (cleared) {
      const lv = level; // 用「消行前」的等级算分
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      score += LINE_SCORE[Math.min(cleared, 4)] * lv;
    }
    return cleared;
  }

  function gameOver() {
    over = true;
    clearTimeout(tickTimer);
    piece = null;
    paintScore();
    paintStatus();
    draw();
    save();
    if (overlayTextEl) overlayTextEl.textContent = '方块堆到顶了，本局 ' + score + ' 分。';
    if (overlayEl) overlayEl.hidden = false;
  }

  function newGame() {
    clearTimeout(tickTimer);
    grid.fill(0);
    score = 0;
    lines = 0;
    level = 1;
    paused = false;
    over = false;
    started = false;   // 新开一局停在「准备好了」，点「开始」才落方块
    piece = null;
    nextIdx = randomPiece();
    if (overlayEl) overlayEl.hidden = true;
    paintNext();
    paintScore();
    paintButtons();
    paintStatus();
    draw();
    save();
  }

  // 点「开始」：把方块放下来开始下落（结束了就先重开一局）
  function startGame() {
    if (over) newGame();
    started = true;
    paused = false;
    if (overlayEl) overlayEl.hidden = true;
    if (!piece) spawn();
    paintButtons();
    paintStatus();
    draw();
    save();
    schedule();
  }

  /* ---------------- 计时（下落） ---------------- */

  function interval() {
    return Math.max(70, Math.round(diffCfg().base * Math.pow(diffCfg().factor, level - 1)));
  }

  function schedule() {
    clearTimeout(tickTimer);
    if (!started || paused || over) return;
    tickTimer = setTimeout(() => {
      if (!started || paused || over) return;
      stepDown();
      schedule();
    }, interval());
  }

  function afterChange() {
    draw();
    paintStatus();
    save();   // 每次变化都存：刷新之后连「手上这块落在哪」都接得上
    if (started && !paused && !over) schedule();
  }

  /* ---------------- 文字 ---------------- */

  function paintScore() {
    if (score > best) { // 分数一超过纪录就顺手写进去（只增不减）
      best = score;
      writeBest();
    }
    if (scoreEl) scoreEl.textContent = String(score);
    if (linesEl) linesEl.textContent = String(lines);
    if (levelEl) levelEl.textContent = String(level);
    if (bestEl) bestEl.textContent = String(best);
  }

  function paintStatus() {
    if (!statusEl) return;
    let text;
    if (over) text = '这局结束了，点「再来一局」重新开始';
    else if (paused) text = '已暂停（点「继续」或按 P 恢复）';
    else if (!started) text = '准备好了，点「开始」落方块（按方向键或旁边的按钮也会开始）';
    else text = '难度：' + diffCfg().name + ' · 等级 ' + level + ' · 每格 ' + interval() + 'ms';
    statusEl.textContent = text;
    statusEl.classList.toggle('is-paused', paused);
  }

  // 头部那个主按钮：开始 → 暂停 → 继续 → （结束后）再来一局；顺便管弹层里的按钮显不显示
  function paintButtons() {
    if (startEl) startEl.textContent = over ? '再来一局' : (started ? (paused ? '继续' : '暂停') : '开始');
    if (resumeEl) resumeEl.hidden = !(paused && !over);
    if (againEl) againEl.hidden = !over;
  }

  function paintDiffChips() {
    if (!levelsEl) return;
    const chips = levelsEl.querySelectorAll('[data-diff]');
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', chip.dataset.diff === diff ? 'true' : 'false');
    }
  }

  /* ---------------- 画出来 ---------------- */

  function layout() {
    const w = boardEl.clientWidth;
    if (!w) return false;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    if (w !== size || d !== dpr) {
      size = w;
      dpr = d;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * 2 * dpr); // 10×20，高是宽的两倍
      cell = size / COLS;
    }
    if (nextCanvas) {
      const nw = nextCanvas.clientWidth || 0;
      if (nw) {
        nextCanvas.width = Math.round(nw * dpr);
        nextCanvas.height = Math.round(nw * dpr);
      }
    }
    return true;
  }

  function block(c, px, py, s, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = c;
    const pad = Math.max(1, s * 0.08);
    ctx.fillRect(px + pad, py + pad, s - pad * 2, s - pad * 2);
    ctx.globalAlpha = 1;
    // 左上角一道高光，看着不那么平
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px + pad, py + pad, s - pad * 2, Math.max(1, s * 0.16));
  }

  function draw() {
    if (!size) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size * 2);

    // 底色
    ctx.fillStyle = 'rgba(16,16,42,0.62)';
    ctx.fillRect(0, 0, size, size * 2);

    // 网格线
    ctx.strokeStyle = 'rgba(111,168,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, size * 2); }
    for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(size, y * cell); }
    ctx.stroke();

    // 已经堆起来的方块
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = grid[y * COLS + x];
        if (v) block(PIECES[v - 1].color, x * cell, y * cell, cell);
      }
    }

    if (piece) {
      // 落点影子（困难档不给看）
      if (diffCfg().ghost) {
        let gy = piece.y;
        while (!collides(piece.shape, piece.x, gy + 1)) gy++;
        if (gy !== piece.y) {
          for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
              if (!piece.shape[y][x]) continue;
              const by = gy + y;
              if (by < 0) continue;
              block(PIECES[piece.idx].color, (piece.x + x) * cell, by * cell, cell, 0.22);
            }
          }
        }
      }
      // 当前方块
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (!piece.shape[y][x]) continue;
          const by = piece.y + y;
          if (by < 0) continue;
          block(PIECES[piece.idx].color, (piece.x + x) * cell, by * cell, cell);
        }
      }
    }
  }

  function paintNext() {
    if (!nextCtx || !nextCanvas || !nextCanvas.width) return;
    const w = nextCanvas.width;
    const ncell = w / 4;
    nextCtx.setTransform(1, 0, 0, 1, 0, 0);
    nextCtx.clearRect(0, 0, w, nextCanvas.height);
    nextCtx.fillStyle = 'rgba(16,16,42,0.55)';
    nextCtx.fillRect(0, 0, w, nextCanvas.height);

    const shape = SHAPES[nextIdx];
    // 让方块在预览里居中一点
    let minX = 9, maxX = -1, minY = 9, maxY = -1;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const ox = (4 - (maxX - minX + 1)) / 2 - minX;
    const oy = (4 - (maxY - minY + 1)) / 2 - minY;
    const color = PIECES[nextIdx].color;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const px = (x + ox) * ncell;
        const py = (y + oy) * ncell;
        const pad = Math.max(1, ncell * 0.08);
        nextCtx.fillStyle = color;
        nextCtx.fillRect(px + pad, py + pad, ncell - pad * 2, ncell - pad * 2);
        nextCtx.fillStyle = 'rgba(255,255,255,0.25)';
        nextCtx.fillRect(px + pad, py + pad, ncell - pad * 2, Math.max(1, ncell * 0.16));
      }
    }
  }

  /* ---------------- 读档 ---------------- */

  function applySave(data) {
    grid.fill(0);
    for (let i = 0; i < data.grid.length; i++) grid[i] = Number(data.grid[i]);
    score = data.score;
    lines = data.lines;
    level = Math.floor(lines / 10) + 1;
    diff = data.diff;
    nextIdx = data.next;
    over = false;
    paused = false;
    started = false;   // 读档进来也先停着，点「开始」再继续下落
    if (overlayEl) overlayEl.hidden = true;

    if (data.piece) {
      piece = {
        idx: data.piece.i,
        rot: data.piece.r,
        shape: shapeOf(data.piece.i, data.piece.r),
        x: data.piece.x,
        y: data.piece.y,
      };
      if (collides(piece.shape, piece.x, piece.y)) { // 存档跟棋盘对不上，当结束
        piece = null;
        over = true;
      }
    } else {
      piece = null;
      if (!spawn()) { /* spawn 内部会判结束 */ }
    }

    if (!over && !piece) spawn();
    paintNext();
    paintScore();
    paintDiffChips();
    paintButtons();
    paintStatus();
    draw();
    if (over) {
      if (overlayTextEl) overlayTextEl.textContent = '方块堆到顶了，本局 ' + score + ' 分。';
      if (overlayEl) overlayEl.hidden = false;
    }
  }

  /* ---------------- 操作 ---------------- */

  function togglePause(force) {
    if (over) return false;
    if (!started) { startGame(); return false; }   // 还没开始就点，等于「开始」
    paused = typeof force === 'boolean' ? force : !paused;
    clearTimeout(tickTimer);
    paintButtons();
    paintStatus();
    if (paused) {
      if (overlayTextEl) overlayTextEl.textContent = '已暂停。点「继续」或按 P 继续玩。';
      if (overlayEl) overlayEl.hidden = false;
    } else {
      if (overlayEl) overlayEl.hidden = true;
      schedule();
    }
    return paused;
  }

  // 头部主按钮 / P 键：没开始就开，进行中就暂停，暂停中就继续，结束了就再来一局
  function startButtonAction() {
    if (over) { newGame(); startGame(); return; }
    if (!started) { startGame(); return; }
    togglePause();
  }

  function focusBoard() {
    try {
      canvas.focus({ preventScroll: true });
    } catch (e) {
      canvas.focus();
    }
  }

  const KEYS = {
    ArrowLeft: () => move(-1),
    ArrowRight: () => move(1),
    ArrowDown: () => softDrop(),
    ArrowUp: () => rotate(1),
    x: () => rotate(1),
    X: () => rotate(1),
    z: () => rotate(-1),
    Z: () => rotate(-1),
    ' ': () => hardDrop(),
  };

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      e.preventDefault();
      startButtonAction();
      return;
    }
    const fn = KEYS[e.key];
    if (!fn) return;
    e.preventDefault(); // 焦点在棋盘上时，这些键算操作，不滚页面
    fn();
  });

  canvas.addEventListener('click', focusBoard);

  if (levelsEl) {
    levelsEl.addEventListener('click', (e) => {
      const chip = e.target && e.target.closest ? e.target.closest('[data-diff]') : null;
      if (!chip || !levelsEl.contains(chip)) return;
      const v = chip.dataset.diff;
      if (DIFF_KEYS.indexOf(v) < 0) return;
      diff = v;                 // 立刻生效，不重开（跟五子棋点难度按钮一致）
      paintDiffChips();
      paintStatus();
      draw();
      save();
      schedule();
      focusBoard();
    });
  }

  // 屏幕按钮：跟键盘同一套动作；手机上就靠这几个按钮，电脑上也能点
  const BUTTONS = {
    tetLeft: () => move(-1),
    tetRight: () => move(1),
    tetUp: () => rotate(1),
    tetDown: () => softDrop(),
    tetRotate: () => rotate(1),
    tetRotateCCW: () => rotate(-1),
    tetDrop: () => hardDrop(),
    tetStart: () => startButtonAction(),
  };
  Object.keys(BUTTONS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => { focusBoard(); BUTTONS[id](); });
  });

  if (againEl) againEl.addEventListener('click', () => { newGame(); startGame(); focusBoard(); });
  if (restartEl) restartEl.addEventListener('click', () => { newGame(); focusBoard(); });
  if (resumeEl) resumeEl.addEventListener('click', () => { startButtonAction(); focusBoard(); });
  if (lookEl) lookEl.addEventListener('click', () => { if (overlayEl) overlayEl.hidden = true; });

  /* ---------------- 起手 ---------------- */

  best = readBest();
  const saved = loadSave();
  layout();
  if (window.ResizeObserver) {
    new ResizeObserver(() => { if (layout()) { draw(); paintNext(); } }).observe(boardEl);
  } else {
    window.addEventListener('resize', () => { if (layout()) { draw(); paintNext(); } });
  }

  if (saved) {
    applySave(saved);
  } else {
    newGame();
  }
})();

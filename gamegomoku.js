// ============================================================
// 小游戏：五子棋（人机对战）
// 规则、AI、渲染、存档都在这个文件里；index.html 里只有一个空容器
//
// 玩法：15×15 的棋盘，你执黑先手，电脑执白。横、竖、斜任意方向连成五颗
//       （五颗以上也算）就赢，不带禁手规则，所有交叉点都能下。
//
// 操作：点棋盘落子。也可以用 Tab 把焦点挪到棋盘上，再用方向键选位置、回车落子。
//
// 存档（localStorage，失败就静默跳过，不影响玩）：
//   tinaGomoku.save  {"moves":[[r,c,p],...],"level":"normal"}
//                    moves 按落子顺序排：p=1 黑（你）/ 2 白（电脑），必须黑白交替，
//                    任何一项不合格就把整份存档当没有、重开新局
//   tinaGomoku.wins  {"you":0,"ai":0,"draw":0}  累计战绩（不清零，除非自己清浏览器数据）
//
// AI 的思路：给每个候选点打「5 格窗口」分——把穿过这一点的每个长度为 5 的窗口
//   数一遍，窗口里有对手的子就作废，否则按自己有几颗子给分（窗口法能自然分辨
//   活三 / 冲四这种形状：活四会被两个窗口各算一次，分数自己就翻倍了）。
//   外面再套两条硬规则：自己能成五就成五，对手下一步能成五就必须堵。
//   难度：简单=在附近随手走、带随机；普通=贪心一层；困难=再往下看一层（对手会怎么应）。
// ============================================================

(function initGameGomoku() {
  const root = document.getElementById('gameGomoku');
  if (!root) return;

  const N = 15;                 // 15 路盘，跟真五子棋一样
  const EMPTY = 0, BLACK = 1, WHITE = 2; // 黑=你，白=电脑
  const SAVE_KEY = 'tinaGomoku.save';
  const WIN_KEY = 'tinaGomoku.wins';
  const LEVELS = ['easy', 'normal', 'hard'];
  const THINK_MS = 260;         // 电脑「想一下」再落子，不然棋子瞬间跳出来看不清

  /* ---------------- 元素 ---------------- */

  const boardEl = document.getElementById('ggBoard');
  const canvas = document.getElementById('ggCanvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!boardEl || !canvas || !ctx) return;

  const overlayEl = document.getElementById('ggOverlay');
  const overlayTextEl = document.getElementById('ggOverlayText');
  const againEl = document.getElementById('ggAgain');
  const lookEl = document.getElementById('ggLook');
  const restartEl = document.getElementById('ggRestart');
  const undoEl = document.getElementById('ggUndo');
  const statusEl = document.getElementById('ggStatus');
  const youEl = document.getElementById('ggWinYou');
  const aiEl = document.getElementById('ggWinAi');
  const drawEl = document.getElementById('ggWinDraw');
  const levelsEl = document.getElementById('ggLevels');

  /* ---------------- 状态 ---------------- */

  const grid = new Int8Array(N * N); // 唯一真实状态：0 空 / 1 黑 / 2 白，下标 = r*N+c
  let moves = [];               // [{r,c,p}]，按落子顺序
  let turn = BLACK;
  let thinking = false;         // 电脑正在「想」
  let over = false;
  let winner = EMPTY;           // 结束时：1 你赢 / 2 电脑赢 / 0 平局
  let winLine = null;           // 赢的那条线上的坐标，用来高亮
  let wins = { you: 0, ai: 0, draw: 0 };
  let level = 'normal';
  let aiTimer = 0;
  let hover = null;             // 鼠标悬停的预览点
  let cursor = null;            // 键盘光标（用方向键走位时才出现）
  let size = 0, dpr = 1, margin = 0, cell = 0, radius = 0;

  const idx = (r, c) => r * N + c;
  // 棋盘外用 -1 表示：它既不是自己也不是对手，扫描时一律当「堵住」
  const at = (r, c) => (r < 0 || r >= N || c < 0 || c >= N) ? -1 : grid[r * N + c];
  const other = (p) => (p === BLACK ? WHITE : BLACK);
  const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // 横、竖、撇、捺
  const STARS = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]]; // 真棋盘上的星位，纯装饰

  /* ---------------- 规则 ---------------- */

  function lineLen(r, c, dr, dc, p) {
    let n = 1;
    for (const s of [1, -1]) {
      let rr = r + dr * s, cc = c + dc * s;
      while (at(rr, cc) === p) { n++; rr += dr * s; cc += dc * s; }
    }
    return n;
  }

  // 落在 (r,c) 后，p 有没有连成五颗以上；有就把那条线的坐标都返回（给高亮用）
  function winCells(r, c, p) {
    for (const d of DIRS) {
      const cells = [[r, c]];
      for (const s of [1, -1]) {
        let rr = r + d[0] * s, cc = c + d[1] * s;
        while (at(rr, cc) === p) {
          if (s > 0) cells.push([rr, cc]); else cells.unshift([rr, cc]);
          rr += d[0] * s; cc += d[1] * s;
        }
      }
      if (cells.length >= 5) return cells;
    }
    return null;
  }

  // 假设 p 落在 (r,c) 会不会马上成五。会临时动一下棋盘再改回来，所以只传空格
  function wouldWin(r, c, p) {
    const i = idx(r, c);
    if (grid[i] !== EMPTY) return false;
    grid[i] = p;
    const yes = !!winCells(r, c, p);
    grid[i] = EMPTY;
    return yes;
  }

  /* ---------------- AI ---------------- */

  // 一个 5 格窗口里有 k 颗自己的子值多少分；窗口里有对手的子就整窗作废
  const WINDOW = [0, 1, 14, 180, 3600, 1000000];

  // 假设 p 落在 (r,c)：只算穿过这一点的 4 个方向上的窗口，用来给候选点打分
  function pointScore(r, c, p) {
    const opp = other(p);
    const i = idx(r, c);
    const saved = grid[i];
    grid[i] = p;
    let s = 0;
    for (const d of DIRS) {
      for (let o = -4; o <= 0; o++) {
        let mine = 0, blocked = false;
        for (let k = 0; k < 5; k++) {
          // 棋盘外和对手的子一样，都算把窗口堵死
          const v = at(r + d[0] * (o + k), c + d[1] * (o + k));
          if (v === opp || v === -1) { blocked = true; break; }
          if (v === p) mine++;
        }
        if (!blocked) s += WINDOW[mine];
      }
    }
    grid[i] = saved;
    return s;
  }

  // 整盘棋对 p 有多好：所有方向、所有长度 5 的窗口求和（窗口必须完整在盘内）
  function boardScore(p) {
    const opp = other(p);
    let s = 0;
    for (const d of DIRS) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const er = r + d[0] * 4, ec = c + d[1] * 4;
          if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
          let mine = 0, blocked = false;
          for (let k = 0; k < 5; k++) {
            const v = grid[(r + d[0] * k) * N + (c + d[1] * k)];
            if (v === opp) { blocked = true; break; }
            if (v === p) mine++;
          }
          if (!blocked) s += WINDOW[mine];
        }
      }
    }
    return s;
  }

  // 所有空格里、离已有棋子曼哈顿距离不超过 dist 的那些（空盘另说，见 chooseMove）
  function neighbours(dist) {
    const out = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[idx(r, c)] !== EMPTY) continue;
        let near = false;
        for (let dr = -dist; dr <= dist && !near; dr++) {
          for (let dc = -dist; dc <= dist; dc++) {
            const v = at(r + dr, c + dc);
            if (v === BLACK || v === WHITE) { near = true; break; }
          }
        }
        if (near) out.push({ r, c });
      }
    }
    return out;
  }

  // 给候选点排序：自己下这里值多少（进攻） + 对手下这里值多少（堵的价值）
  function rank(list, p, atk, def) {
    const opp = other(p);
    const scored = list.map((m) => ({
      r: m.r,
      c: m.c,
      v: pointScore(m.r, m.c, p) * atk + pointScore(m.r, m.c, opp) * def,
    }));
    scored.sort((a, b) => b.v - a.v);
    return scored;
  }

  // 假设 p 刚下完、轮到 opp，看 opp 会怎么应；返回对 p 来说最糟的那个局面分
  function replyValue(p, opp) {
    const pool = neighbours(2);
    const evalNow = () => boardScore(p) - boardScore(opp) * 1.1;
    if (!pool.length) return evalNow();
    // 对手能立刻成五，说明这一手是输的
    for (const m of pool) if (wouldWin(m.r, m.c, opp)) return -1e9;

    const replies = rank(pool, opp, 1, 0.8).slice(0, 6);
    let worst = Infinity;
    for (const m of replies) {
      const i = idx(m.r, m.c);
      grid[i] = opp;
      const v = evalNow();
      grid[i] = EMPTY;
      if (v < worst) worst = v;
    }
    return worst;
  }

  function chooseMove(p) {
    if (!moves.length) return { r: 7, c: 7 }; // 空盘：下天元

    const opp = other(p);
    const pool = neighbours(level === 'easy' ? 1 : 2);
    if (!pool.length) {
      // 兜底：附近没有空位就从任意空位里挑一个（正常下不到这一步）
      for (let i = 0; i < N * N; i++) {
        if (grid[i] === EMPTY) return { r: Math.floor(i / N), c: i % N };
      }
      return null;
    }

    // 1) 自己能成五 → 直接赢
    for (const m of pool) if (wouldWin(m.r, m.c, p)) return m;
    // 2) 对手下一步能成五 → 必须堵；这种点可能不止一个，就挑对自己最有利的那个
    const blocks = pool.filter((m) => wouldWin(m.r, m.c, opp));
    if (blocks.length) {
      const b = rank(blocks, p, 1, 0.6)[0];
      return { r: b.r, c: b.c };
    }

    if (level === 'easy') {
      // 简单：三成概率随手在附近下一手；其余带点随机扰动，免得每盘一模一样
      const scored = rank(pool, p, 0.7, 0.55);
      if (Math.random() < 0.3) {
        return scored[Math.floor(Math.random() * Math.min(scored.length, 8))];
      }
      const jitter = Math.max(1, scored[0].v * 0.25);
      const near = scored.filter((m) => m.v + jitter >= scored[0].v);
      return near[Math.floor(Math.random() * near.length)];
    }

    if (level === 'hard') {
      // 困难：先挑 8 个最像样的点，每个都摆上去，看对手最狠的应手，取最坏情况下最好的那个
      const top = rank(pool, p, 1, 0.85).slice(0, 8);
      let best = top[0], bestV = -Infinity;
      for (const m of top) {
        const i = idx(m.r, m.c);
        grid[i] = p;
        const v = replyValue(p, opp);
        grid[i] = EMPTY;
        if (v > bestV) { bestV = v; best = m; }
      }
      return { r: best.r, c: best.c };
    }

    // 普通：贪心一层
    const g = rank(pool, p, 1, 0.8)[0];
    return { r: g.r, c: g.c };
  }

  /* ---------------- 存档 ---------------- */

  function readSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        moves: moves.map((m) => [m.r, m.c, m.p]),
        level: level,
      }));
    } catch (e) {}
  }

  // 存档可能是手改的、旧版的、坏的，逐项校验，不合格一律当没有
  function loadMoves(raw) {
    if (!raw || !Array.isArray(raw.moves) || !raw.moves.length) return null;
    if (raw.moves.length > N * N) return null;
    const seen = {};
    const out = [];
    for (const m of raw.moves) {
      if (!Array.isArray(m) || m.length < 3) return null;
      const r = m[0], c = m[1], p = m[2];
      if (!Number.isInteger(r) || !Number.isInteger(c) || !Number.isInteger(p)) return null;
      if (r < 0 || r >= N || c < 0 || c >= N) return null;
      if (p !== BLACK && p !== WHITE) return null;
      const k = r + ',' + c;
      if (seen[k]) return null;   // 同一格不能有第二颗子
      seen[k] = true;
      if (p !== (out.length % 2 === 0 ? BLACK : WHITE)) return null; // 必须黑白交替
      out.push({ r: r, c: c, p: p });
    }
    return out;
  }

  function loadLevel(raw) {
    const v = raw && typeof raw.level === 'string' ? raw.level : '';
    return LEVELS.indexOf(v) >= 0 ? v : 'normal';
  }

  function loadWins() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(WIN_KEY)); } catch (e) { d = null; }
    const num = (v) => (Number.isInteger(v) && v >= 0 && v < 1000000 ? v : 0);
    if (!d || typeof d !== 'object') return { you: 0, ai: 0, draw: 0 };
    return { you: num(d.you), ai: num(d.ai), draw: num(d.draw) };
  }

  function writeWins() {
    try { localStorage.setItem(WIN_KEY, JSON.stringify(wins)); } catch (e) {}
  }

  /* ---------------- 画棋盘 ---------------- */

  const px = (i) => margin + cell * i; // 第 i 条线在画布上的坐标（CSS 像素）

  // 量一下容器的宽度，换算格子大小；画布位图按设备像素比放大，免得高分屏发虚
  function layout() {
    const w = boardEl.clientWidth;
    if (!w) return false;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    if (w !== size || d !== dpr) {
      size = w;
      dpr = d;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      margin = size * 0.052;         // 边距要够放下最外圈棋子的半径
      cell = (size - margin * 2) / (N - 1);
      radius = cell * 0.43;
    }
    return true;
  }

  function stone(col, row, p) {
    const x = px(col), y = px(row);
    const h = radius * 0.35;
    const g = ctx.createRadialGradient(x - h, y - h, radius * 0.12, x, y, radius);
    if (p === BLACK) {
      g.addColorStop(0, '#6a7196');
      g.addColorStop(0.45, '#2a2e46');
      g.addColorStop(1, '#0b0b18');
    } else {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#e8ecfa');
      g.addColorStop(1, '#b9c1dc');
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = radius * 0.7;
    ctx.shadowOffsetY = radius * 0.14;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = p === BLACK ? 'rgba(160,170,220,0.35)' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, radius * 0.07);
    ctx.beginPath();
    ctx.arc(x, y, radius - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw() {
    if (!size) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 之后所有坐标都按 CSS 像素算
    ctx.clearRect(0, 0, size, size);

    // 棋盘底：深蓝渐变，跟站点同色系
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, 'rgba(30,30,70,0.92)');
    g.addColorStop(1, 'rgba(16,16,42,0.92)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // 格线
    ctx.strokeStyle = 'rgba(111,168,255,0.28)';
    ctx.lineWidth = Math.max(1, size / 640);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      ctx.moveTo(px(0), px(i));
      ctx.lineTo(px(N - 1), px(i));
      ctx.moveTo(px(i), px(0));
      ctx.lineTo(px(i), px(N - 1));
    }
    ctx.stroke();

    // 星位
    ctx.fillStyle = 'rgba(111,168,255,0.55)';
    for (const s of STARS) {
      ctx.beginPath();
      ctx.arc(px(s[1]), px(s[0]), Math.max(2, radius * 0.17), 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[idx(r, c)]) stone(c, r, grid[idx(r, c)]);
      }
    }

    // 最后一手：中间点一个小点，方便看出电脑刚下哪儿
    const last = moves[moves.length - 1];
    if (last) {
      ctx.fillStyle = last.p === BLACK ? 'rgba(200,210,255,0.85)' : 'rgba(60,70,120,0.9)';
      ctx.beginPath();
      ctx.arc(px(last.c), px(last.r), Math.max(2, radius * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }

    // 赢的那条线：每颗子套个光圈，再拉一条横贯的亮线
    if (winLine) {
      ctx.strokeStyle = 'rgba(255,212,121,0.95)';
      ctx.lineWidth = Math.max(2, radius * 0.16);
      const a = winLine[0], b = winLine[winLine.length - 1];
      ctx.beginPath();
      ctx.moveTo(px(a[1]), px(a[0]));
      ctx.lineTo(px(b[1]), px(b[0]));
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = 'rgba(255,212,121,0.9)';
      ctx.shadowBlur = radius;
      for (const cellPos of winLine) {
        ctx.beginPath();
        ctx.arc(px(cellPos[1]), px(cellPos[0]), radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 悬停预览（只有轮到你、点的是空位时才画）
    if (hover && !over && !thinking && turn === BLACK && grid[idx(hover.r, hover.c)] === EMPTY) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      stone(hover.c, hover.r, BLACK);
      ctx.restore();
    }

    // 键盘光标
    if (cursor && !over) {
      ctx.strokeStyle = 'rgba(255,212,121,0.9)';
      ctx.lineWidth = Math.max(2, radius * 0.14);
      ctx.setLineDash([radius * 0.5, radius * 0.42]);
      ctx.beginPath();
      ctx.rect(px(cursor.c) - radius * 1.15, px(cursor.r) - radius * 1.15, radius * 2.3, radius * 2.3);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ---------------- 文字状态 ---------------- */

  function paintStatus() {
    if (statusEl) {
      let text;
      if (over) {
        text = winner === BLACK ? '这局你赢了' : (winner === WHITE ? '这局电脑赢了' : '平局');
      } else if (thinking || turn === WHITE) {
        text = '电脑思考中…';
      } else {
        text = '轮到你（黑）';
      }
      statusEl.textContent = text;
      statusEl.classList.toggle('is-ai', !over && turn === WHITE); // 前面的小圆点：黑子/白子
    }
    if (undoEl) undoEl.disabled = over || thinking || !moves.some((m) => m.p === BLACK);
  }

  function paintWins() {
    if (youEl) youEl.textContent = String(wins.you);
    if (aiEl) aiEl.textContent = String(wins.ai);
    if (drawEl) drawEl.textContent = String(wins.draw);
  }

  function syncLevelChips() {
    if (!levelsEl) return;
    const chips = levelsEl.querySelectorAll('[data-level]');
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', chip.dataset.level === level ? 'true' : 'false');
    }
  }

  function showOverlay(text) {
    if (overlayTextEl) overlayTextEl.textContent = text;
    if (overlayEl) overlayEl.hidden = false;
  }

  function hideOverlay() {
    if (overlayEl) overlayEl.hidden = true;
  }

  function overText() {
    return winner === BLACK ? '五颗连成一线，这局你赢了！'
      : winner === WHITE ? '电脑连成五颗，这局它赢了。'
        : '棋盘下满了，平局。';
  }

  /* ---------------- 落子流程 ---------------- */

  function place(r, c, p) {
    grid[idx(r, c)] = p;
    moves.push({ r: r, c: c, p: p });
  }

  function doMove(r, c, p) {
    place(r, c, p);
    hover = null;
    cursor = null;

    const line = winCells(r, c, p);
    if (line) {
      winLine = line;
      winner = p;
      over = true;
      if (p === BLACK) wins.you++; else wins.ai++;
      writeWins();
      paintWins();
      draw();
      paintStatus();
      save();
      showOverlay(overText());
      return;
    }

    if (moves.length >= N * N) { // 棋盘下满了
      winner = EMPTY;
      over = true;
      wins.draw++;
      writeWins();
      paintWins();
      draw();
      paintStatus();
      save();
      showOverlay(overText());
      return;
    }

    turn = other(p);
    draw();
    paintStatus();
    save();
    if (turn === WHITE) scheduleAI();
  }

  function humanMove(r, c) {
    if (over || thinking || turn !== BLACK) return;
    if (grid[idx(r, c)] !== EMPTY) return;
    doMove(r, c, BLACK);
  }

  function scheduleAI() {
    if (over) return;
    thinking = true;
    paintStatus();
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      thinking = false;
      if (over || turn !== WHITE) { paintStatus(); return; }
      const mv = chooseMove(WHITE);
      if (!mv) { paintStatus(); return; }
      doMove(mv.r, mv.c, WHITE);
    }, THINK_MS);
  }

  function newGame() {
    clearTimeout(aiTimer);
    grid.fill(0);
    moves = [];
    turn = BLACK;
    thinking = false;
    over = false;
    winner = EMPTY;
    winLine = null;
    hover = null;
    cursor = null;
    hideOverlay();
    draw();
    paintStatus(); // 战绩是累计的，重开不清零
    save();
  }

  function undo() {
    if (over || thinking || !moves.length) return;
    // 退一手：最后是电脑下的就先退它那手，再退掉自己那手 —— 回到自己下之前
    const pop = () => {
      const m = moves.pop();
      grid[idx(m.r, m.c)] = EMPTY;
    };
    if (moves[moves.length - 1].p === WHITE) pop();
    if (moves.length && moves[moves.length - 1].p === BLACK) pop();

    clearTimeout(aiTimer);
    thinking = false;
    over = false;
    winner = EMPTY;
    winLine = null;
    hover = null;
    cursor = null;
    turn = moves.length % 2 === 0 ? BLACK : WHITE;
    hideOverlay();
    draw();
    paintStatus();
    save();
    if (turn === WHITE) scheduleAI();
  }

  // 刷新后接着下：把存档里的每一手重放一遍（存档本身已经保证黑白交替、没有重复落点）
  function restore(raw) {
    const seq = loadMoves(raw);
    if (!seq) { newGame(); return; }

    clearTimeout(aiTimer);
    grid.fill(0);
    moves = [];
    thinking = false;
    over = false;
    winner = EMPTY;
    winLine = null;
    hover = null;
    cursor = null;

    for (const m of seq) {
      place(m.r, m.c, m.p);
      const line = winCells(m.r, m.c, m.p);
      if (line) {           // 存档正好停在分出胜负那一手
        winLine = line;
        winner = m.p;
        over = true;
        break;
      }
    }

    turn = moves.length % 2 === 0 ? BLACK : WHITE;
    if (!over && moves.length >= N * N) { over = true; winner = EMPTY; } // 存档正好是一盘下满的和棋
    draw();
    paintStatus();
    if (over) {
      showOverlay(overText());
    } else if (turn === WHITE) {
      scheduleAI(); // 存档正好停在「你下完、电脑还没应」的瞬间
    }
  }

  /* ---------------- 输入 ---------------- */

  // 把鼠标 / 触屏的位置换算成最近的交叉点；点到棋盘外面的留白就不算
  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !cell) return null;
    const scale = rect.width / size; // 万一 CSS 和换算差一点点，按实际宽度缩一下
    const c = Math.round(((e.clientX - rect.left) / scale - margin) / cell);
    const r = Math.round(((e.clientY - rect.top) / scale - margin) / cell);
    if (r < 0 || r >= N || c < 0 || c >= N) return null;
    return { r: r, c: c };
  }

  canvas.addEventListener('click', (e) => {
    const m = pointFromEvent(e);
    if (!m) return;
    humanMove(m.r, m.c);
  });

  // 鼠标悬停给个半透明的预览子（触屏不画，不然手指一走画面就跟着闪）
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const m = pointFromEvent(e);
    const same = (hover && m && hover.r === m.r && hover.c === m.c) || (!hover && !m);
    if (same) return;
    hover = m;
    draw();
  });

  canvas.addEventListener('pointerleave', () => {
    if (!hover) return;
    hover = null;
    draw();
  });

  const ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  canvas.addEventListener('keydown', (e) => {
    if (ARROWS[e.key]) {
      e.preventDefault(); // 焦点在棋盘里时方向键是走位，不滚页面
      const d = ARROWS[e.key];
      const base = cursor || hover || { r: 7, c: 7 };
      const r = Math.min(N - 1, Math.max(0, base.r + d[0]));
      const c = Math.min(N - 1, Math.max(0, base.c + d[1]));
      cursor = { r: r, c: c };
      hover = null;
      draw();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      const spot = cursor || hover;
      if (!spot) return;
      e.preventDefault();
      humanMove(spot.r, spot.c);
    }
  });

  if (againEl) againEl.addEventListener('click', newGame);
  if (restartEl) restartEl.addEventListener('click', newGame);
  if (lookEl) lookEl.addEventListener('click', hideOverlay);
  if (undoEl) undoEl.addEventListener('click', undo);

  if (levelsEl) {
    levelsEl.addEventListener('click', (e) => {
      const chip = e.target && e.target.closest ? e.target.closest('[data-level]') : null;
      if (!chip || !levelsEl.contains(chip)) return;
      const v = chip.dataset.level;
      if (LEVELS.indexOf(v) < 0) return;
      level = v;
      syncLevelChips();
      save();
    });
  }

  /* ---------------- 起手 ---------------- */

  wins = loadWins();
  const raw = readSave();
  level = loadLevel(raw);
  syncLevelChips();
  paintWins();
  layout();
  if (window.ResizeObserver) {
    new ResizeObserver(() => { if (layout()) draw(); }).observe(boardEl);
  } else {
    window.addEventListener('resize', () => { if (layout()) draw(); });
  }
  restore(raw);
})();

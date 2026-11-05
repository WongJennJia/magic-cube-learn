/* ===== Pages, games, timer, router ===== */
const App = { cleanup: [], players: [] };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const main = () => document.getElementById('main');
const onCleanup = f => App.cleanup.push(f);
const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
const fmt = ms => { if (ms == null) return '—'; const s = ms / 1000; if (s < 60) return s.toFixed(2); const m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(2).padStart(5, '0'); };
const LESSON_BY_KEY = Object.fromEntries(LESSONS.map((l, i) => [l.key, { ...l, i }]));
const done = () => Store.get('done', {});
const pieceName = cols => {
  const order = ['W', 'Y', 'R', 'O', 'B', 'G'];
  const c = cols.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return c.map(x => CN[x]).join('-') + (c.length === 3 ? ' 角块' : ' 棱块');
};
function makePlayer(host, o) { const p = new Player(host, o); App.players.push(p); onCleanup(() => p.destroy()); return p; }

/* ---------- shared hydration for lesson-like pages ---------- */
function hydrate(root, player, dock) {
  $$('figure.dg[data-case]', root).forEach(f => { const pic = $('.dg-pic', f); if (pic && !pic.innerHTML) pic.innerHTML = caseFig(f.dataset.case); });
  const toPlayer = (spec, src, autoplay) => {
    player.load(spec);
    if (isNarrow() && src) {
      const anchor = src.closest('.case, .algcard, .practice, .movegrid, .xcase, .cross-ch') || src;
      if (anchor.nextElementSibling !== dock) anchor.after(dock);
      dock.classList.add('inline');
      setTimeout(() => dock.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }), 30);
    }
    if (autoplay) setTimeout(() => player.play(), isNarrow() ? 650 : 350);
  };
  root.addEventListener('click', e => {
    const d = e.target.closest('.demo[data-case]');
    if (d) { toPlayer(caseSpec(d.dataset.case), d, true); return; }
    const mc = e.target.closest('.movecard');
    if (mc) {
      const m = mc.dataset.move;
      toPlayer({ state: Cube.solved(), moves: [m], segs: [{ name: m + ' · ' + shortOf(m), moves: [m] }], title: m + ' · ' + shortOf(m), sub: longOf(m), finishText: '转完了' }, mc, true);
      return;
    }
    const pr = e.target.closest('[data-practice]');
    if (pr) { toPlayer(practiceSpec(+pr.dataset.practice), pr, false); return; }
  });
  $$('.spotquiz', root).forEach(el => SpotQuiz(el, el.dataset.gen, +el.dataset.n || 5));
  $$('.guessgame', root).forEach(el => GuessGame(el));
}

/* ---------- spot quiz ---------- */
function SpotQuiz(host, gen, n) {
  let i = 0, score = 0;
  const ask = () => {
    const Q = QUIZ[gen]();
    let answered = false;
    host.innerHTML = `<div class="sq"><div class="sq-top"><span>第 ${i + 1} / ${n} 题</span><span class="sq-score">${ICON.star}${score}</span></div>
      <div class="sq-body"><div class="sq-fig">${Q.fig}</div><div class="sq-right"><p class="sq-q">${Q.q}</p>
      <div class="opts">${Q.opts.map((o, j) => `<button type="button" class="opt" data-j="${j}">${o}</button>`).join('')}</div>
      <div class="fb" aria-live="polite"></div></div></div></div>`;
    $$('.opt', host).forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const j = +b.dataset.j, ok = j === Q.ans;
      if (ok) score++;
      $$('.opt', host).forEach(x => { x.disabled = true; if (+x.dataset.j === Q.ans) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('.fb', host).innerHTML = `<div class="fb-box ${ok ? 'ok' : 'no'}">${ok ? ICON.check : ICON.retry}<div><b>${ok ? '答对了' : '再想想'}</b><p>${Q.why}</p></div></div>
        <button type="button" class="btn small next">${i + 1 < n ? '下一题' : '看成绩'}</button>`;
      $('.next', host).onclick = () => { i++; i < n ? ask() : finish(); };
      $('.sq-score', host).innerHTML = ICON.star + score;
    });
  };
  const finish = () => {
    host.innerHTML = `<div class="sq sq-end"><div class="sq-big">${score} / ${n}</div><p>${score === n ? '全部答对！你的眼睛很厉害。' : score >= n * .6 ? '很不错！错的那几题，再看一次说明就会了。' : '多练几次，这些图形会越看越熟。'}</p>
      <button type="button" class="btn small again">${ICON.restart}<span>再来一组</span></button></div>`;
    $('.again', host).onclick = () => { i = 0; score = 0; ask(); };
  };
  ask();
}

/* ---------- guess the move (lesson 1) ---------- */
function GuessGame(host) {
  const POOL = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'"];
  let round = 0, score = 0, cur = null, answered = false;
  host.innerHTML = `<div class="gg"><div class="gg-cube"></div><div class="gg-side">
     <div class="sq-top"><span class="gg-round"></span><span class="sq-score">${ICON.star}0</span></div>
     <p class="sq-q">方块刚刚转了哪一下？</p><div class="opts gg-opts"></div><div class="fb" aria-live="polite"></div>
     <button type="button" class="btn ghost small gg-again">${ICON.restart}<span>再看一次</span></button></div></div>`;
  const view = new CubeView($('.gg-cube', host), { dur: 650 });
  onCleanup(() => view.destroy());
  const show = async () => { view.setState(Cube.solved()); await sleep(450); await view.turn(cur, 650); };
  const next = () => {
    if (round >= 8) {
      $('.gg-side', host).innerHTML = `<div class="sq-end"><div class="sq-big">${score} / 8</div><p>${score >= 7 ? '字母已经难不倒你了！' : '多看几次箭头卡片，再来挑战。'}</p><button type="button" class="btn small gg-restart">${ICON.restart}<span>再玩一次</span></button></div>`;
      const best = Store.get('guess-best', 0); if (score > best) Store.set('guess-best', score);
      $('.gg-restart', host).onclick = () => { GuessGame(host); };
      return;
    }
    round++; answered = false;
    cur = pick(POOL);
    const inv = Cube.invMove(cur);
    const others = shuffle(POOL.filter(x => x !== cur && x !== inv)).slice(0, 2);
    const opts = shuffle([cur, inv, ...others]);
    $('.gg-round', host).textContent = `第 ${round} / 8 题`;
    $('.gg-opts', host).innerHTML = opts.map(m => `<button type="button" class="opt mvopt" data-m="${m}"><b>${m}</b><small>${shortOf(m)}</small></button>`).join('');
    $('.fb', host).innerHTML = '';
    $$('.mvopt', host).forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const ok = b.dataset.m === cur; if (ok) score++;
      $$('.mvopt', host).forEach(x => { x.disabled = true; if (x.dataset.m === cur) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('.sq-score', host).innerHTML = ICON.star + score;
      $('.fb', host).innerHTML = `<div class="fb-box ${ok ? 'ok' : 'no'}">${ok ? ICON.check : ICON.retry}<div><b>${ok ? '答对了' : '再想想'}</b><p>刚才是 ${cur}：${longOf(cur)}。</p></div></div><button type="button" class="btn small gg-next">下一题</button>`;
      $('.gg-next', host).onclick = next;
    });
    show();
  };
  $('.gg-again', host).onclick = () => cur && show();
  next();
}

/* ---------- header / nav ---------- */
const NAV = [['home', '闯关地图'], ['camp', '观察训练营'], ['follow', '跟我还原'], ['play', '练习台'], ['timer', '计时器'], ['speed', '20秒之路'], ['cards', '口诀卡']];

/* ---------- home ---------- */
function pageHome() {
  const d = done();
  const nDone = LESSONS.filter(l => d[l.key]).length;
  main().innerHTML = `
  <section class="hero">
    <div class="hero-text">
      <p class="eyebrow">给小学生的魔术方块课</p>
      <h1>从零开始，<br>学会还原魔术方块</h1>
      <p class="lead">7 个步骤、7 个公式就能还原。再练眼力和手指，一步一步冲向 20 秒。</p>
      <div class="btnrow"><a class="btn" href="#${LESSONS.find(l => !d[l.key])?.key || 'learn-0'}">${nDone ? '继续闯关' : '开始第一课'}</a><button type="button" class="btn ghost" id="heroGo">${ICON.shuffle}<span>打乱，看它自己还原</span></button></div>
      <div class="progress"><div class="progress-bar"><i style="width:${nDone / LESSONS.length * 100}%"></i></div><span>已完成 ${nDone} / ${LESSONS.length} 关</span></div>
    </div>
    <div class="hero-cube"><div id="heroCube"></div><div class="hero-cap" id="heroCap" aria-live="polite">拖动方块转着看。点“打乱”试试！</div></div>
  </section>
  <section>
    <div class="sec-head"><h2>闯关地图</h2><p>按顺序一关一关来。学会了，就在那一关最下面点“我学会了”，拿一颗星。</p></div>
    <div class="map">${LESSONS.map((l, i) => `
      <a class="lv${d[l.key] ? ' done' : ''}" href="#${l.key}">
        <span class="lv-pic">${caseFig(l.icon)}</span>
        <span class="lv-txt"><span class="lv-k">${l.kicker}${d[l.key] ? `<i class="lv-star">${ICON.star}</i>` : ''}</span><b>${l.title}</b><small>${l.goal}</small><span class="lv-min">约 ${l.mins} 分钟</span></span>
      </a>`).join('')}</div>
  </section>
  <section class="duo">
    <a class="feature" href="#camp"><span class="feature-pic">${topSVG(caseState('p-back'), { labels: false })}</span><span><b>观察训练营</b><p>5 个小游戏：认颜色、闪眼记忆、找小块、认图形、预测。高手快，是因为眼睛快。</p></span></a>
    <a class="feature" href="#follow"><span class="feature-pic">${isoSVG(Cube.apply(Cube.solved(), "R U F' L2 D B'"), { label: '打乱的方块' })}</span><span><b>跟我还原</b><p>照着打乱，或者把你方块的颜色填进来，再一步一步跟着还原。</p></span></a>
  </section>
  <section>
    <div class="sec-head"><h2>20 秒之路</h2><p>学会以后，照这条路线练。每一站都有目标时间。</p></div>
    <ol class="road">${ROAD.map((r, i) => `<li><span class="road-t">${r.t}</span><b>${r.name}</b><small>${r.what}</small></li>`).join('')}</ol>
    <a class="btn ghost" href="#speed">看完整路线和进阶公式</a>
  </section>`;
  const view = new CubeView($('#heroCube'), { dur: 110 });
  onCleanup(() => view.destroy());
  let busy = false, stop = false;
  onCleanup(() => { stop = true; });
  let auto = true, ang = view.ry;
  view.onUserRotate = () => { auto = false; };
  const spin = () => { if (stop) return; if (auto && !reduceMotion()) { ang += 0.12; view.ry = ang; view.applyView(); } requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
  const cap = $('#heroCap'), btn = $('#heroGo');
  btn.onclick = async () => {
    if (busy) return; busy = true; btn.disabled = true;
    const sc = Cube.randomScramble(20);
    cap.textContent = '打乱中：' + sc.join(' ');
    for (const m of sc) { if (stop) return; await view.turn(m, 90); }
    await sleep(500);
    const r = Cube.solveBeginner(view.state);
    const total = r.parts.reduce((a, p) => a + p.moves.length, 0);
    let k = 0;
    for (let si = 0; si < r.parts.length; si++) {
      const p = r.parts[si];
      for (const m of p.moves) {
        if (stop) return;
        k++;
        cap.textContent = `${STAGE_TITLE[si]} · 第 ${k} / ${total} 步`;
        await view.turn(m, /^[xyz]/.test(m) ? 220 : 105);
      }
      if (p.moves.length) await sleep(250);
    }
    cap.textContent = `还原好了！用新手方法一共转了 ${total} 下。学会以后，你也可以。`;
    busy = false; btn.disabled = false;
  };
}
const ROAD = [
  { t: '3 分钟', name: '学会', what: '不看提示，自己还原一次。' },
  { t: '1 分 30', name: '熟练', what: '公式变成手指的记忆，学指法。' },
  { t: '1 分钟', name: '底十字', what: '不用小雏菊，直接在底部做十字。' },
  { t: '45 秒', name: 'F2L 入门', what: '角块和棱块配成一对，一起放。' },
  { t: '30 秒', name: '两步顶层', what: '顶层分 4 步，学 16 个公式。' },
  { t: '20 秒', name: '预判', what: '手在转，眼睛已经在找下一块。' },
];

/* ---------- lesson page ---------- */
function pageLesson(L) {
  const d = done();
  const prev = LESSONS[L.i - 1], next = LESSONS[L.i + 1];
  main().innerHTML = `
  <div class="lesson">
    <header class="lesson-head">
      <nav class="crumbs" aria-label="位置"><a href="#home">闯关地图</a><span>/</span><span>${L.kicker}</span></nav>
      <p class="eyebrow">${L.kicker} · 约 ${L.mins} 分钟</p>
      <h1>${L.title}</h1>
      <p class="goal"><b>学完你会：</b>${L.goal}</p>
    </header>
    <div class="lesson-main prose">${L.body()}
      <div class="lesson-end">
        <button type="button" class="btn ${d[L.key] ? 'ghost' : ''}" id="doneBtn">${ICON.star}<span>${d[L.key] ? '已经学会（点一下取消）' : '我学会了这一关'}</span></button>
        <div class="pn">${prev ? `<a class="pn-a" href="#${prev.key}"><small>上一关</small><b>${prev.title}</b></a>` : '<span></span>'}${next ? `<a class="pn-a nx" href="#${next.key}"><small>下一关</small><b>${next.title}</b></a>` : `<a class="pn-a nx" href="#camp"><small>接下来</small><b>观察训练营</b></a>`}</div>
      </div>
    </div>
    <aside class="lesson-side"><div class="dock" id="dock"><div id="player"></div></div></aside>
  </div>`;
  const dock = $('#dock');
  const player = makePlayer($('#player'), {});
  player.load(caseSpec(L.first));
  hydrate($('.lesson-main'), player, dock);
  const side = $('.lesson-side');
  const mq = window.matchMedia('(max-width: 900px)');
  const back = () => { if (!mq.matches && dock.parentElement !== side) { side.appendChild(dock); dock.classList.remove('inline'); } };
  mq.addEventListener('change', back); onCleanup(() => mq.removeEventListener('change', back));
  $('#doneBtn').onclick = () => {
    const dd = done(); dd[L.key] = !dd[L.key]; Store.set('done', dd);
    const b = $('#doneBtn'); b.classList.toggle('ghost', dd[L.key]);
    b.innerHTML = `${ICON.star}<span>${dd[L.key] ? '已经学会（点一下取消）' : '我学会了这一关'}</span>`;
    if (dd[L.key]) toast('拿到一颗星！' + (next ? '下一关：' + next.title : ''));
  };
  bindPlayerKeys(player);
}
function bindPlayerKeys(player) {
  const k = e => {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); player.pause(); player.fwd(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); player.pause(); player.back(); }
  };
  document.addEventListener('keydown', k); onCleanup(() => document.removeEventListener('keydown', k));
}

/* ---------- observation camp ---------- */
const GAMES = [
  { key: 'game-colors', title: '颜色好朋友', skill: '颜色地图', desc: '对面是什么颜色？黄上绿前时，右边是什么？记熟颜色地图，找块就不用猜。', pic: () => `<span class="pair-dots big">${colorDots(['W', 'Y', 'R', 'O', 'B', 'G'])}</span>` },
  { key: 'game-flash', title: '闪眼记忆', skill: '一眼看全', desc: '一个面只给你看 2 秒，凭记忆把 9 格颜色涂回去。', pic: () => stickerGridSVG(['R', 'Y', 'G', 'G', 'W', 'O', 'B', 'R', 'Y']) },
  { key: 'game-find', title: '找小块', skill: '找块速度', desc: '在打乱的 3D 方块上，转着找到指定的小块，点它一下。', pic: () => isoSVG(Cube.apply(Cube.solved(), "R U' F2 L"), { hl: new Set(Cube.POSMAP['1,1,1'].slots) }) },
  { key: 'game-shape', title: '图形侦探', skill: '认图形', desc: '看一眼顶面，马上说出：是一字还是 L？有没有小鱼？车灯在哪？', pic: () => topSVG(caseState('y-L'), { labels: false }) },
  { key: 'game-predict', title: '预测高手', skill: '预判', desc: '转一下之后，星星会跑到哪一格？先在脑子里转，再看答案。', pic: () => isoSVG(Cube.solved(), { move: 'R', marks: { [Cube.slotAt([1, -1, 1], Cube.N.F)]: '★' } }) },
];
function pageCamp() {
  const best = Store.get('best', {});
  main().innerHTML = `
  <header class="page-head"><p class="eyebrow">观察训练营</p><h1>眼睛快，手才快</h1>
  <p class="lead">20 秒还原的高手，手其实没有比你快很多。他们快在<b>眼睛</b>：一边转，一边已经找到下一块，所以从来不停下来。每天玩一两个游戏，练出侦探的眼睛。</p></header>
  <div class="games">${GAMES.map(g => `<a class="game" href="#${g.key}"><span class="game-pic">${g.pic()}</span><span class="game-txt"><span class="eyebrow">练：${g.skill}</span><b>${g.title}</b><small>${g.desc}</small><span class="game-best">${best[g.key] ? '最好成绩：' + best[g.key] : '还没有成绩'}</span></span></a>`).join('')}</div>
  <section class="prose narrow">
    <h2>每一步都在练观察</h2>
    <p>学每一步时，先<b>看</b>再<b>转</b>：</p>
    <ul class="checks">
      <li>白十字：先找齐 4 个白色棱块，再动手。</li>
      <li>白色角块：先看白色朝哪边，就知道要做 1、3 还是 5 次。</li>
      <li>第二层：先找没有黄色的棱块。</li>
      <li>黄十字和黄色面：先认形状、数角块。</li>
      <li>最后两步：先找车灯、找完成的一面。</li>
    </ul>
    ${tip('高手的习惯', '比赛开始前有 15 秒观察时间，可以拿起来看，但不能转。用这 15 秒把白十字的做法想好，就能一口气做完。在计时器里打开“15 秒观察”来练。')}
  </section>`;
}
function setBest(key, label, better) {
  const b = Store.get('best', {}); const raw = Store.get('bestRaw', {});
  if (raw[key] == null || better(raw[key])) { raw[key] = better.value; b[key] = label; Store.set('best', b); Store.set('bestRaw', raw); return true; }
  return false;
}
function gameShell(g, intro, inner) {
  return `<header class="page-head"><nav class="crumbs" aria-label="位置"><a href="#camp">观察训练营</a><span>/</span><span>${g.title}</span></nav>
  <p class="eyebrow">练：${g.skill}</p><h1>${g.title}</h1><p class="lead">${intro}</p></header><div class="game-area">${inner}</div>`;
}
const G = key => GAMES.find(g => g.key === key);

/* game: colors */
function pageGameColors() {
  const g = G('game-colors');
  main().innerHTML = gameShell(g, '10 题。前几题问“对面”，后面问“右边是什么颜色”。越快越好，但先求答对。', `<div class="card gbox" id="gc"></div>`);
  const box = $('#gc');
  let i = 0, score = 0, t0 = 0, timer;
  const OPP = { W: 'Y', Y: 'W', R: 'O', O: 'R', B: 'G', G: 'B' };
  const startScreen = () => {
    box.innerHTML = `<div class="gstart"><p>准备好了吗？按开始后计时。</p><button type="button" class="btn" id="go">${ICON.play}<span>开始</span></button></div>`;
    $('#go').onclick = () => { i = 0; score = 0; t0 = performance.now(); ask(); };
  };
  const ask = () => {
    let Q;
    if (i < 4) {
      const c = pick(Object.keys(OPP)); const o = OPP[c];
      const opts = shuffle([o, ...shuffle(Object.keys(OPP).filter(x => x !== c && x !== o)).slice(0, 3)]);
      Q = { fig: `<div class="swatch-big" style="background:${HEX[c]}"></div>`, q: `${CN[c]}色的对面是什么颜色？`, opts, ans: o, why: `${CN[c]}和${CN[o]}是一对，永远在对面。` };
    } else {
      const s = rot24();
      const u = Cube.center(s, 'U'), f = Cube.center(s, 'F'), r = Cube.center(s, 'R');
      const shown = Cube.solved().map(() => 'X');
      shown[4] = u; shown[22] = f;
      const opts = shuffle([r, OPP[r], OPP[u], OPP[f]]);
      Q = {
        fig: isoSVG(shown, { marks: { 13: '?' }, label: '只看得到上面和前面的中心' }), q: `${CN[u]}色朝上，${CN[f]}色朝前。右边的中心是什么颜色？`, opts, ans: r,
        why: `右边是${CN[r]}色。${CN[OPP[r]]}色在左边，${CN[OPP[u]]}色在底下，${CN[OPP[f]]}色在后面。`,
      };
    }
    let answered = false;
    box.innerHTML = `<div class="sq"><div class="sq-top"><span>第 ${i + 1} / 10 题</span><span class="clock" id="clk">0.0 秒</span></div>
      <div class="sq-body"><div class="sq-fig">${Q.fig}</div><div class="sq-right"><p class="sq-q">${Q.q}</p>
      <div class="opts">${Q.opts.map(c => `<button type="button" class="opt colopt" data-c="${c}"><i class="dot" style="background:${HEX[c]}"></i>${CN[c]}色</button>`).join('')}</div><div class="fb" aria-live="polite"></div></div></div></div>`;
    clearInterval(timer); timer = setInterval(() => { const c = $('#clk'); if (c) c.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' 秒'; }, 100);
    $$('.colopt', box).forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const ok = b.dataset.c === Q.ans; if (ok) score++;
      $$('.colopt', box).forEach(x => { x.disabled = true; if (x.dataset.c === Q.ans) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('.fb', box).innerHTML = `<div class="fb-box ${ok ? 'ok' : 'no'}">${ok ? ICON.check : ICON.retry}<div><b>${ok ? '答对了' : '再想想'}</b><p>${Q.why}</p></div></div>`;
      setTimeout(() => { i++; i < 10 ? ask() : end(); }, ok ? 700 : 2000);
    });
  };
  const end = () => {
    clearInterval(timer);
    const sec = (performance.now() - t0) / 1000;
    const newBest = score === 10 && setBest(g.key, sec.toFixed(1) + ' 秒（10 题全对）', Object.assign(v => sec < v, { value: sec }));
    box.innerHTML = `<div class="sq-end"><div class="sq-big">${score} / 10</div><p>用时 ${sec.toFixed(1)} 秒。${newBest ? '新纪录！' : score === 10 ? '全部答对！' : '10 题全对才会记录成绩。'}</p>
    <p class="muted">小秘诀：记住“黄上绿前，右边是橙”。其他方向，都可以从这一句推出来。</p>
    <button type="button" class="btn" id="again">${ICON.restart}<span>再玩一次</span></button></div>`;
    $('#again').onclick = () => { i = 0; score = 0; t0 = performance.now(); ask(); };
  };
  onCleanup(() => clearInterval(timer));
  startScreen();
}

/* game: flash memory */
function pageGameFlash() {
  const g = G('game-flash');
  const LV = [{ n: 1, cols: 2, t: 3000, name: '1 级：2 种颜色，看 3 秒' }, { n: 2, cols: 3, t: 2500, name: '2 级：3 种颜色，看 2.5 秒' }, { n: 3, cols: 4, t: 2000, name: '3 级：4 种颜色，看 2 秒' }, { n: 4, cols: 6, t: 1500, name: '4 级：6 种颜色，看 1.5 秒' }];
  main().innerHTML = gameShell(g, '一个面会出现一下下就消失。记住 9 格的颜色，再用颜色笔涂回去。每级 5 回合。', `<div class="card gbox" id="gf"></div>`);
  const box = $('#gf');
  let lv, round, total, cells, answer, brush, timers = [];
  onCleanup(() => timers.forEach(clearTimeout));
  const menu = () => {
    box.innerHTML = `<div class="gstart"><p>选一个等级：</p><div class="lvbtns">${LV.map((l, i) => `<button type="button" class="opt" data-l="${i}">${l.name}</button>`).join('')}</div>
      ${tip('怎么记最快？', '不要一格一格记。先看哪种颜色最多，再记“形状”：例如“红色是一个 L 形，中间是黄色”。')}</div>`;
    $$('[data-l]', box).forEach(b => b.onclick = () => { lv = LV[+b.dataset.l]; round = 0; total = 0; play(); });
  };
  const play = () => {
    round++;
    const palette = shuffle(['W', 'Y', 'R', 'O', 'B', 'G']).slice(0, lv.cols);
    answer = Array.from({ length: 9 }, () => pick(palette));
    palette.forEach((c, i) => { if (!answer.includes(c)) answer[Math.floor(Math.random() * 9)] = c; });
    cells = Array(9).fill(null); brush = palette[0];
    box.innerHTML = `<div class="flash"><div class="sq-top"><span>${lv.name} · 第 ${round} / 5 回合</span><span>答对 ${total} 格</span></div>
      <div class="flash-show">${stickerGridSVG(answer, { label: '要记住的面' })}<div class="bar"><i id="fbar"></i></div><p>记住它！</p></div></div>`;
    const bar = $('#fbar'); bar.style.transition = `width ${lv.t}ms linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '0%'; }));
    timers.push(setTimeout(() => paint(palette), lv.t));
  };
  const paint = palette => {
    box.innerHTML = `<div class="flash"><div class="sq-top"><span>${lv.name} · 第 ${round} / 5 回合</span><span>答对 ${total} 格</span></div>
      <div class="flash-paint"><div class="paintgrid" role="grid" aria-label="点格子涂颜色">${cells.map((c, i) => `<button type="button" class="pcell" data-i="${i}" aria-label="第 ${i + 1} 格"></button>`).join('')}</div>
      <div><p>先选颜色，再点格子：</p><div class="palette">${palette.map(c => `<button type="button" class="pal${c === brush ? ' on' : ''}" data-c="${c}" style="--c:${HEX[c]}" aria-label="${CN[c]}色">${CN[c]}</button>`).join('')}</div>
      <button type="button" class="btn" id="check">${ICON.check}<span>检查</span></button></div></div></div>`;
    $$('.pal', box).forEach(b => b.onclick = () => { brush = b.dataset.c; $$('.pal', box).forEach(x => x.classList.toggle('on', x === b)); });
    $$('.pcell', box).forEach(b => b.onclick = () => { const i = +b.dataset.i; cells[i] = brush; b.style.background = HEX[brush]; b.classList.add('filled'); });
    $('#check').onclick = () => {
      const right = cells.filter((c, i) => c === answer[i]).length; total += right;
      box.innerHTML = `<div class="flash"><div class="sq-top"><span>${lv.name} · 第 ${round} / 5 回合</span><span>答对 ${total} 格</span></div>
       <div class="flash-cmp"><figure>${stickerGridSVG(cells.map(c => c || ''), { label: '你涂的' })}<figcaption>你涂的</figcaption></figure><figure>${stickerGridSVG(answer, { label: '原来的' })}<figcaption>原来的</figcaption></figure></div>
       <div class="fb-box ${right === 9 ? 'ok' : 'no'}">${right === 9 ? ICON.check : ICON.retry}<div><b>${right} / 9 格一样</b><p>${right === 9 ? '一格都没错！' : '对照一下两张图，看看是哪几格不一样。'}</p></div></div>
       <button type="button" class="btn" id="nx">${round < 5 ? '下一回合' : '看总成绩'}</button></div>`;
      $('#nx').onclick = () => round < 5 ? play() : end();
    };
  };
  const end = () => {
    const nb = setBest(g.key, `${lv.n} 级 ${total}/45 格`, Object.assign(v => lv.n * 100 + total > v, { value: lv.n * 100 + total }));
    box.innerHTML = `<div class="sq-end"><div class="sq-big">${total} / 45</div><p>${nb ? '新纪录！' : ''}${total >= 40 ? '眼力很好，可以挑战下一级。' : '再练几次，试着用“记形状”的方法。'}</p><button type="button" class="btn" id="mn">${ICON.restart}<span>再玩一次</span></button></div>`;
    $('#mn').onclick = menu;
  };
  menu();
}

/* game: find the piece */
function pageGameFind() {
  const g = G('game-find');
  main().innerHTML = gameShell(g, '方块已经打乱。看上面要找的小块，拖动方块转着找，找到了就点它的任何一格。一共 8 块。', `
    <div class="find card"><div class="find-cube" id="fc"></div><div class="find-side" id="fs"></div></div>`);
  const fs = $('#fs');
  let view, targets, i, t0, misses, timer, busy = false;
  const start = () => {
    const st = Cube.apply(Cube.solved(), Cube.randomScramble(25));
    if (!view) { view = new CubeView($('#fc'), { state: st, onSticker: tap }); onCleanup(() => view.destroy()); } else { view.setState(st); view.setHighlight(null); }
    const pieces = shuffle(Cube.POS.filter(o => o.slots.length > 1));
    targets = [...pieces.filter(o => o.slots.length === 2).slice(0, 4), ...pieces.filter(o => o.slots.length === 3).slice(0, 4)].map(o => o.slots.map(k => Cube.solved()[k]));
    targets = shuffle(targets); i = 0; misses = 0; t0 = performance.now();
    clearInterval(timer); timer = setInterval(() => { const c = $('#fclk'); if (c) c.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' 秒'; }, 100);
    show();
  };
  const show = (msg) => {
    const t = targets[i];
    fs.innerHTML = `<div class="sq-top"><span>第 ${i + 1} / 8 块</span><span class="clock" id="fclk"></span></div>
      <p class="muted">要找：</p><div class="target">${colorDots(t)}<b>${pieceName(t)}</b></div>
      <p class="muted small">${t.length === 3 ? '角块有 3 种颜色，在三个面碰在一起的角上。' : '棱块有 2 种颜色，在两个面中间。'}</p>
      <div class="fb" aria-live="polite">${msg || ''}</div>
      <button type="button" class="btn ghost small" id="hint">${ICON.bulb}<span>提示</span></button>`;
    $('#hint').onclick = () => {
      const o = Cube.findPiece(view.state, t);
      const where = []; const p = o.p;
      if (p[1] === 1) where.push('上面'); if (p[1] === -1) where.push('底面');
      if (p[0] === 1) where.push('右面'); if (p[0] === -1) where.push('左面');
      if (p[2] === 1) where.push('前面'); if (p[2] === -1) where.push('后面');
      $('.fb', fs).innerHTML = `<div class="fb-box no">${ICON.bulb}<div><b>提示</b><p>它在${where.join('和')}交界的地方。（以黄色中心为上、绿色中心为前）</p></div></div>`;
      misses++;
    };
  };
  function tap(slot) {
    if (busy || !targets || i >= 8) return;
    const t = targets[i];
    const o = Cube.findPiece(view.state, t);
    if (o.slots.includes(slot)) {
      busy = true;
      view.setHighlight(new Set(o.slots));
      $('.fb', fs).innerHTML = `<div class="fb-box ok">${ICON.check}<div><b>找到了！</b><p>${pieceName(t)}</p></div></div>`;
      setTimeout(() => { view.setHighlight(null); busy = false; i++; i < 8 ? show() : end(); }, 750);
    } else {
      misses++;
      const P = Cube.POS.find(x => x.slots.includes(slot));
      const cols = P.slots.map(k => view.state[k]);
      const what = P.slots.length === 1 ? `${CN[cols[0]]}色中心块` : pieceName(cols);
      $('.fb', fs).innerHTML = `<div class="fb-box no">${ICON.retry}<div><b>再找找</b><p>这一块是“${what}”。要找的是“${pieceName(t)}”。</p></div></div>`;
    }
  }
  const end = () => {
    clearInterval(timer);
    const sec = (performance.now() - t0) / 1000;
    const nb = setBest(g.key, sec.toFixed(1) + ' 秒', Object.assign(v => sec < v, { value: sec }));
    fs.innerHTML = `<div class="sq-end"><div class="sq-big">${sec.toFixed(1)} 秒</div><p>找齐 8 块，点错或用提示 ${misses} 次。${nb ? '新纪录！' : ''}</p>
      <p class="muted small">秘诀：先想好这一块的颜色在哪几个面中间（看中心！），再去那里找。</p><button type="button" class="btn" id="ag">${ICON.restart}<span>再玩一次</span></button></div>`;
    $('#ag').onclick = start;
  };
  onCleanup(() => clearInterval(timer));
  fs.innerHTML = `<div class="gstart"><p>准备好了就开始，计时会马上开始。</p><button type="button" class="btn" id="go">${ICON.play}<span>开始</span></button></div>`;
  view = new CubeView($('#fc'), { onSticker: tap }); onCleanup(() => view.destroy());
  $('#go').onclick = start;
}

/* game: shape detective */
function pageGameShape() {
  const g = G('game-shape');
  main().innerHTML = gameShell(g, '12 张顶面图，越快认出越好。题目有 4 种：黄十字形状、黄色角块数量、车灯在哪、哪一面完成。', `<div class="card gbox" id="gs"></div>`);
  const box = $('#gs');
  let i, score, t0, timer;
  const gens = ['shape', 'fish', 'lights', 'bar'];
  const start = () => { i = 0; score = 0; t0 = performance.now(); clearInterval(timer); timer = setInterval(() => { const c = $('#sclk'); if (c) c.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' 秒'; }, 100); ask(); };
  const ask = () => {
    const Q = QUIZ[gens[i % 4]]();
    let answered = false;
    box.innerHTML = `<div class="sq"><div class="sq-top"><span>第 ${i + 1} / 12 张</span><span class="clock" id="sclk"></span></div>
      <div class="sq-body"><div class="sq-fig">${Q.fig}</div><div class="sq-right"><p class="sq-q">${Q.q}</p>
      <div class="opts">${Q.opts.map((o, j) => `<button type="button" class="opt" data-j="${j}">${o}</button>`).join('')}</div><div class="fb" aria-live="polite"></div></div></div></div>`;
    $$('.opt', box).forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const ok = +b.dataset.j === Q.ans; if (ok) score++;
      $$('.opt', box).forEach(x => { x.disabled = true; if (+x.dataset.j === Q.ans) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('.fb', box).innerHTML = `<div class="fb-box ${ok ? 'ok' : 'no'}">${ok ? ICON.check : ICON.retry}<div><b>${ok ? '答对了' : '再想想'}</b><p>${Q.why}</p></div></div>`;
      setTimeout(() => { i++; i < 12 ? ask() : end(); }, ok ? 650 : 2300);
    });
  };
  const end = () => {
    clearInterval(timer);
    const sec = (performance.now() - t0) / 1000;
    const nb = score === 12 && setBest(g.key, sec.toFixed(1) + ' 秒（全对）', Object.assign(v => sec < v, { value: sec }));
    box.innerHTML = `<div class="sq-end"><div class="sq-big">${score} / 12</div><p>用时 ${sec.toFixed(1)} 秒。${nb ? '新纪录！' : score === 12 ? '全部答对！' : '12 张全对才记录成绩。'}</p><button type="button" class="btn" id="ag">${ICON.restart}<span>再玩一次</span></button></div>`;
    $('#ag').onclick = start;
  };
  onCleanup(() => clearInterval(timer));
  box.innerHTML = `<div class="gstart"><p>认得越快，还原时停下来的时间就越少。</p><button type="button" class="btn" id="go">${ICON.play}<span>开始</span></button></div>`;
  $('#go').onclick = start;
}

/* game: predict */
function pageGamePredict() {
  const g = G('game-predict');
  main().innerHTML = gameShell(g, '图上有一颗星星 ★。照着转一下（或两下）之后，星星会跑到哪一格？选 A、B、C 或 D。', `<div class="card gbox" id="gp"></div>`);
  const box = $('#gp');
  const VIS = k => ['U', 'F', 'R'].includes(Cube.SLOTS[k].f);
  let lvl = 1, i, score;
  const FACE_CN = { U: '上面', F: '前面', R: '右面', D: '底面', L: '左面', B: '后面' };
  const make = () => {
    const pool = ['R', "R'", 'U', "U'", 'F', "F'", 'L', "L'", 'D', "D'"];
    for (let t = 0; t < 200; t++) {
      const ms = lvl === 1 ? [pick(pool)] : [pick(pool), pick(pool)];
      if (ms.length === 2 && ms[0][0] === ms[1][0]) continue;
      const ids = Array.from({ length: 54 }, (_, k) => k);
      const after = Cube.apply(ids, ms);
      const k = pick(Array.from({ length: 54 }, (_, q) => q).filter(q => VIS(q) && q % 9 !== 4));
      const dest = after.indexOf(k);
      if (dest === k || !VIS(dest)) continue;
      const near = Array.from({ length: 54 }, (_, q) => q).filter(q => VIS(q) && q !== k && q !== dest && q % 9 !== 4);
      const sameFace = near.filter(q => Cube.SLOTS[q].f === Cube.SLOTS[dest].f);
      const ds = shuffle(sameFace).slice(0, 2);
      const rest = shuffle(near.filter(q => !ds.includes(q))).slice(0, 3 - ds.length);
      const choices = shuffle([dest, ...ds, ...rest]);
      return { ms, k, dest, choices };
    }
  };
  const start = () => { i = 0; score = 0; ask(); };
  const ask = () => {
    const P = make();
    const s = Cube.solved();
    const marks = { [P.k]: '★' }; P.choices.forEach((c, j) => marks[c] = 'ABCD'[j]);
    let answered = false;
    box.innerHTML = `<div class="sq"><div class="sq-top"><span>${lvl === 1 ? '1 级：转一下' : '2 级：连转两下'} · 第 ${i + 1} / 10 题</span><span class="sq-score">${ICON.star}${score}</span></div>
      <div class="sq-body"><div class="sq-fig">${isoSVG(s, { marks, move: P.ms.length === 1 ? P.ms[0] : null, label: '有星星和 ABCD 的方块' })}</div>
      <div class="sq-right"><p class="sq-q">照着转：</p>${algChips(P.ms.join(' '))}<p class="sq-q">★ 会跑到哪一格？</p>
      <div class="opts four">${'ABCD'.split('').map((l, j) => `<button type="button" class="opt" data-j="${j}">${l}</button>`).join('')}</div><div class="fb" aria-live="polite"></div></div></div></div>`;
    $$('.opt', box).forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const j = +b.dataset.j, ok = P.choices[j] === P.dest; if (ok) score++;
      const aj = P.choices.indexOf(P.dest);
      $$('.opt', box).forEach(x => { x.disabled = true; if (+x.dataset.j === aj) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      const fromF = Cube.SLOTS[P.k].f, toF = Cube.SLOTS[P.dest].f;
      $('.fb', box).innerHTML = `<div class="fb-box ${ok ? 'ok' : 'no'}">${ok ? ICON.check : ICON.retry}<div><b>${ok ? '答对了' : '再想想'}：答案是 ${'ABCD'[aj]}</b><p>★ 跟着转动的那一层走，从${FACE_CN[fromF]}${fromF === toF ? '换了一个位置，还在' + FACE_CN[toF] : '跑到了' + FACE_CN[toF]}。</p></div></div>
        <div class="after"><span class="muted small">转完以后：</span>${isoSVG(Cube.apply(s, P.ms), { marks: { [P.dest]: '★' }, label: '转完以后' })}</div>
        <button type="button" class="btn small" id="nx">${i < 9 ? '下一题' : '看成绩'}</button>`;
      $('#nx').onclick = () => { i++; i < 10 ? ask() : end(); };
      $('.sq-score', box).innerHTML = ICON.star + score;
    });
  };
  const end = () => {
    const nb = setBest(g.key, `${lvl} 级 ${score}/10`, Object.assign(v => lvl * 100 + score > v, { value: lvl * 100 + score }));
    box.innerHTML = `<div class="sq-end"><div class="sq-big">${score} / 10</div><p>${nb ? '新纪录！' : ''}${score >= 8 && lvl === 1 ? '可以挑战 2 级了！' : '在脑子里转方块，就是高手“预判”的本领。'}</p>
      <div class="btnrow"><button type="button" class="btn" id="l1">1 级：转一下</button><button type="button" class="btn ghost" id="l2">2 级：连转两下</button></div></div>`;
    $('#l1').onclick = () => { lvl = 1; start(); }; $('#l2').onclick = () => { lvl = 2; start(); };
  };
  box.innerHTML = `<div class="gstart"><p>选择等级：</p><div class="btnrow"><button type="button" class="btn" id="l1">1 级：转一下</button><button type="button" class="btn ghost" id="l2">2 级：连转两下</button></div></div>`;
  $('#l1').onclick = () => { lvl = 1; start(); }; $('#l2').onclick = () => { lvl = 2; start(); };
}

/* ---------- free play ---------- */
function pagePlay() {
  const PAD = ["R", "R'", "R2", "L", "L'", "L2", "U", "U'", "U2", "D", "D'", "D2", "F", "F'", "F2", "B", "B'", "B2", "M", "M'", "y", "y'", "x", "x'"];
  main().innerHTML = `
  <header class="page-head"><p class="eyebrow">练习台</p><h1>自由转一转</h1><p class="lead">点按钮转方块，或用键盘：R L U D F B 键顺时针，加 Shift 是反方向（例如 Shift+R 是 R'）。打乱以后，可以让它一步一步还原给你看。</p></header>
  <div class="lesson play">
    <div class="lesson-main">
      <div class="card">
        <div class="pad">${PAD.map(m => `<button type="button" class="mv padbtn" data-m="${m}"><b>${m}</b><small>${shortOf(m)}</small></button>`).join('')}</div>
        <div class="btnrow tools">
          <button type="button" class="btn" id="pScr">${ICON.shuffle}<span>打乱</span></button>
          <button type="button" class="btn ghost" id="pSolve">${ICON.play}<span>还原给我看</span></button>
          <button type="button" class="btn ghost" id="pUndo">${ICON.back}<span>撤销</span></button>
          <button type="button" class="btn ghost" id="pReset">${ICON.restart}<span>变回还原好</span></button>
        </div>
        <p class="muted small" id="pLog">已转：（还没有）</p>
      </div>
      <div class="card">
        <label class="lbl" for="algIn">输入公式，看它怎么转</label>
        <div class="inrow"><input id="algIn" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="例如：R U R' U'" value="R U R' U R U2 R'"><button type="button" class="btn" id="algGo">${ICON.play}<span>播放</span></button></div>
        <p class="muted small">可以用：R L U D F B M E S x y z，加 ' 或 2。小写字母（r、f）是两层一起转。</p>
      </div>
    </div>
    <aside class="lesson-side"><div class="dock"><div id="player"></div></div></aside>
  </div>`;
  const player = makePlayer($('#player'), {});
  player.load({ state: Cube.solved(), moves: [], title: '我的魔术方块', sub: '拖动方块可以转着看' });
  const log = [];
  const writeLog = () => { $('#pLog').textContent = '已转：' + (log.length ? Cube.simplify(log).slice(-40).join(' ') : '（还没有）'); };
  let busy = false;
  const doMove = async m => {
    if (busy) return; busy = true;
    if (player.moves.length) { const st = player.view.state; player.load({ state: st, moves: [], title: '我的魔术方块', sub: '' }); }
    await player.view.turn(m, 200); log.push(m); writeLog(); busy = false;
    player.start = player.view.state.slice();
    if (Cube.isSolved(player.view.state) && log.length > 3) toast('还原好了！');
  };
  $('.pad').addEventListener('click', e => { const b = e.target.closest('.padbtn'); if (b) doMove(b.dataset.m); });
  $('#pScr').onclick = async () => {
    if (busy) return; busy = true;
    player.load({ state: player.view.state, moves: [], title: '打乱中…', sub: '' });
    const sc = Cube.randomScramble(20);
    for (const m of sc) { await player.view.turn(m, 70); log.push(m); }
    writeLog(); busy = false;
    player.load({ state: player.view.state, moves: [], title: '已经打乱', sub: '打乱公式：' + sc.join(' ') });
  };
  $('#pSolve').onclick = () => {
    if (busy) return;
    const st = player.view.state;
    if (Cube.isSolved(st)) { toast('方块已经是还原好的，先打乱吧！'); return; }
    const r = Cube.solveBeginner(st);
    const segs = [];
    r.parts.forEach((p, i) => annotate(p.moves, STAGE_KEYS[i]).forEach(s => segs.push({ ...s, stage: STAGE_TITLE[i] })));
    const moves = segs.flatMap(s => s.moves);
    player.load({ state: st, moves, segs, title: '用 7 个步骤还原', sub: `一共 ${moves.length} 步。可以按播放，也可以一步一步看。`, finishText: '还原好了！' });
    log.length = 0; writeLog();
    if (isNarrow()) $('.lesson-side').scrollIntoView({ behavior: 'smooth' });
  };
  $('#pUndo').onclick = () => { if (!log.length || busy) return; const m = log.pop(); busy = true; player.view.turn(Cube.invMove(m), 200).then(() => { busy = false; player.start = player.view.state.slice(); writeLog(); }); };
  $('#pReset').onclick = () => { log.length = 0; writeLog(); player.load({ state: Cube.solved(), moves: [], title: '我的魔术方块', sub: '' }); };
  $('#algGo').onclick = () => {
    const ms = Cube.parse($('#algIn').value);
    if (!ms.length) { toast('没有看懂这个公式，检查一下字母。'); return; }
    player.load({ state: player.view.state, moves: ms, segs: annotate(ms), title: '我的公式', sub: ms.join(' ') });
    player.play();
  };
  const key = e => {
    if (e.target.closest('input, textarea')) return;
    const k = e.key.toUpperCase();
    if ('RLUDFB'.includes(k) && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); doMove(k + (e.shiftKey ? "'" : '')); }
  };
  document.addEventListener('keydown', key); onCleanup(() => document.removeEventListener('keydown', key));
}

/* ---------- follow along ---------- */
const STAGE_TIPS = {
  daisy: '找白色棱块，送上顶层围着黄色中心，白色朝上。上面已经有花瓣，就先转顶层让开。',
  cross: '转顶层，让花瓣侧面的颜色对上中心，再把那一面转两下。',
  corners: '找顶层的白色角块，送到它家的正上方（右前上），重复“上左下右”。',
  second: '找顶层没有黄色的棱块，连成倒 T，看顶上的颜色往左或往右放。',
  ycross: '看黄色形状：点、L、一字。L 放左上，一字横着放，做黄十字公式。',
  yface: '数黄色角块。1 个放左前方；0 或 2 个让左前角的黄色朝左。做小鱼公式。',
  cperm: '找车灯，放到后面，做车灯公式。四面都有车灯就转顶层对齐。',
  eperm: '把完成的一面放到后面，做棱块公式。',
};
function solutionSpec(st, title) {
  const r = Cube.solveBeginner(st);
  const segs = [];
  r.parts.forEach((p, i) => annotate(p.moves, STAGE_KEYS[i]).forEach(s => segs.push({ ...s, stage: STAGE_TITLE[i], key: STAGE_KEYS[i] })));
  const moves = segs.flatMap(s => s.moves);
  return { ok: Cube.isSolved(r.state), spec: { state: st, moves, segs, title, sub: `一共 ${moves.length} 步，分成 7 个步骤。`, finishText: '还原好了！你做到了！' } };
}
function pageFollow() {
  main().innerHTML = `
  <header class="page-head"><p class="eyebrow">跟我还原</p><h1>拿着你的方块，一步一步跟着做</h1>
  <p class="lead">两种开始方法：照着打乱公式把还原好的方块打乱；或者把你手上已经乱掉的方块的颜色填进来。</p></header>
  <div class="tabs" role="tablist"><button type="button" role="tab" class="tab on" data-t="scr">用打乱公式</button><button type="button" role="tab" class="tab" data-t="inp">输入我方块的颜色</button></div>
  <div id="fwork"></div>`;
  const work = $('#fwork');
  $$('.tab').forEach(t => t.onclick = () => { $$('.tab').forEach(x => x.classList.toggle('on', x === t)); t.dataset.t === 'scr' ? scrMode() : inpMode(); });
  let player = null;
  const showSolution = (st, title) => {
    const { ok, spec } = solutionSpec(st, title);
    if (!ok) return false;
    work.innerHTML = `<div class="lesson follow"><div class="lesson-main"><div class="stagecard card" id="stc"></div>
      <div class="card"><h3>小提醒</h3><ul class="checks"><li>一直保持黄色朝上、绿色对着你（看到 y 时，整个方块跟着转）。</li><li>用“走一步”按钮，每按一次就跟着转一下。</li><li>转错了？按“退一步”，或者从头开始。</li></ul>
      <button type="button" class="btn ghost small" id="restartF">${ICON.restart}<span>换一个方块</span></button></div></div>
      <aside class="lesson-side"><div class="dock"><div id="player"></div></div></aside></div>`;
    player = makePlayer($('#player'), {});
    player.speed = 'slow'; player.renderSpeed();
    player.load(spec);
    const stc = $('#stc');
    let lastKey = null;
    player.onChange = idx => {
      const seg = player.segAt(Math.min(idx, player.moves.length - 1));
      const key = idx >= player.moves.length ? 'done' : seg && seg.key;
      if (key === lastKey) return; lastKey = key;
      if (key === 'done') { stc.innerHTML = `<p class="eyebrow">完成</p><h2>还原好了！</h2><p>去计时器记录一次时间吧。</p><a class="btn" href="#timer">去计时器</a>`; return; }
      const si = STAGE_KEYS.indexOf(key);
      stc.innerHTML = `<p class="eyebrow">现在是</p><h2>${STAGE_TITLE[si]}</h2><p>${STAGE_TIPS[key]}</p><div class="stage-dots">${STAGE_KEYS.map((k, j) => `<i class="${j < si ? 'past' : j === si ? 'now' : ''}" title="${STAGE_TITLE[j]}"></i>`).join('')}</div>`;
    };
    player.onChange(0);
    bindPlayerKeys(player);
    $('#restartF').onclick = () => { $$('.tab')[0].click(); };
    return true;
  };
  const scrMode = () => {
    let sc = Cube.randomScramble(20);
    const draw = () => {
      const st = Cube.apply(Cube.solved(), sc);
      work.innerHTML = `<div class="card follow-scr">
        <ol class="steps"><li>拿一个<b>已经还原好</b>的方块：黄色朝上，绿色对着你。</li><li>照下面的打乱公式，一下一下转（这时候不要转整个方块）。</li><li>转完和右边的图比一比，一样就可以开始了。</li></ol>
        <div class="scr-wrap"><div>${algChips(sc.join(' '), { big: true })}<div class="btnrow"><button type="button" class="btn ghost small" id="newScr">${ICON.shuffle}<span>换一个打乱</span></button></div></div>
        <div class="scr-pics">${isoSVG(st, { view: 'both', label: '打乱后的样子' })}</div></div>
        <button type="button" class="btn" id="startF">${ICON.play}<span>打乱好了，开始教我</span></button></div>`;
      $('#newScr').onclick = () => { sc = Cube.randomScramble(20); draw(); };
      $('#startF').onclick = () => showSolution(st, '跟着还原');
    };
    draw();
  };
  const inpMode = () => {
    const ORDER = [
      ['U', '顶面（黄色中心）', '把方块往你这边翻，让黄色面对着你，绿色面在下面。'],
      ['F', '前面（绿色中心）', '黄色朝上，绿色对着你。'],
      ['R', '右面（橙色中心）', '黄色朝上，整个方块往左转一下，让橙色对着你。'],
      ['B', '后面（蓝色中心）', '黄色朝上，再往左转一下，让蓝色对着你。'],
      ['L', '左面（红色中心）', '黄色朝上，再往左转一下，让红色对着你。'],
      ['D', '底面（白色中心）', '回到绿色对着你，再把方块往上翻，让白色对着你，绿色在上面。'],
    ];
    const st = Store.get('input', null) || Cube.solved().map((c, k) => k % 9 === 4 ? c : '');
    let fi = 0, brush = 'W';
    const counts = () => { const n = {}; 'WYRGBO'.split('').forEach(c => n[c] = 0); st.forEach(c => { if (n[c] != null) n[c]++; }); return n; };
    const draw = () => {
      const [f, name, how] = ORDER[fi];
      const base = Cube.FACES.indexOf(f) * 9;
      const n = counts();
      work.innerHTML = `<div class="card inp">
        <div class="inp-steps">${ORDER.map((o, j) => `<button type="button" class="istep${j === fi ? ' on' : ''}" data-j="${j}">${o[1].slice(0, 2)}</button>`).join('')}</div>
        <div class="inp-body"><div><h3>${name}</h3><p>${how}</p>
          <div class="paintgrid big">${Array.from({ length: 9 }, (_, i) => { const c = st[base + i]; return `<button type="button" class="pcell${i === 4 ? ' lock' : ''}${c ? ' filled' : ''}" data-i="${i}" style="${c ? 'background:' + HEX[c] : ''}" aria-label="第 ${i + 1} 格${i === 4 ? '（中心，不用改）' : ''}"></button>`; }).join('')}</div></div>
          <div><p>先选颜色，再点格子：</p><div class="palette">${'WYRGBO'.split('').map(c => `<button type="button" class="pal${c === brush ? ' on' : ''}" data-c="${c}" style="--c:${HEX[c]}">${CN[c]}<small>${n[c]}/9</small></button>`).join('')}</div>
          <div class="btnrow"><button type="button" class="btn ghost small" id="prevF"${fi ? '' : ' disabled'}>上一面</button>${fi < 5 ? `<button type="button" class="btn small" id="nextF">下一面</button>` : `<button type="button" class="btn small" id="solveF">${ICON.check}<span>检查并开始还原</span></button>`}<button type="button" class="btn ghost small" id="clearF">全部清空</button></div>
          <div class="fb" id="inMsg" aria-live="polite"></div></div></div>
        <div class="inp-net">${netSVG(st.map(c => c || 'X'), { label: '你填的颜色展开图' })}<p class="muted small">展开图：中间一排是 左、前、右、后。灰色是还没填的格子。</p></div></div>`;
      $$('.istep', work).forEach(b => b.onclick = () => { fi = +b.dataset.j; draw(); });
      $$('.pal', work).forEach(b => b.onclick = () => { brush = b.dataset.c; $$('.pal', work).forEach(x => x.classList.toggle('on', x === b)); });
      $$('.pcell', work).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i === 4) return; st[base + i] = brush; Store.set('input', st); draw(); });
      $('#prevF').onclick = () => { if (fi) { fi--; draw(); } };
      if ($('#nextF')) $('#nextF').onclick = () => { fi++; draw(); };
      $('#clearF').onclick = () => { for (let k = 0; k < 54; k++) if (k % 9 !== 4) st[k] = ''; Store.set('input', st); draw(); };
      if ($('#solveF')) $('#solveF').onclick = () => {
        const err = validate(st);
        if (err) { $('#inMsg').innerHTML = `<div class="fb-box no">${ICON.retry}<div><b>再检查一下</b><p>${err}</p></div></div>`; return; }
        if (!showSolution(st.slice(), '还原你的方块')) $('#inMsg').innerHTML = `<div class="fb-box no">${ICON.retry}<div><b>再检查一下</b><p>这些颜色组合在真的方块上不会出现。可能有两格填反了，或者某一面的方向拿错了。对照每一面的拿法再看一次。</p></div></div>`;
      };
    };
    draw();
  };
  scrMode();
}
function validate(st) {
  if (st.some(c => !c || c === 'X')) return '还有格子没有填颜色。每一面都要填满 9 格。';
  const n = {}; st.forEach(c => n[c] = (n[c] || 0) + 1);
  for (const c of 'WYRGBO') if (n[c] !== 9) return `${CN[c]}色有 ${n[c] || 0} 格，应该刚好 9 格。`;
  const OPP = { W: 'Y', Y: 'W', R: 'O', O: 'R', B: 'G', G: 'B' };
  const S = Cube.solved();
  const want = new Set(Cube.POS.filter(o => o.slots.length > 1).map(o => o.slots.map(k => S[k]).sort().join('')));
  const seen = new Set();
  for (const o of Cube.POS) {
    if (o.slots.length < 2) continue;
    const cs = o.slots.map(k => st[k]);
    for (const a of cs) if (cs.includes(OPP[a])) return `有一块同时有${CN[a]}色和${CN[OPP[a]]}色。它们是对面的颜色，不会在同一块上。`;
    const key = cs.slice().sort().join('');
    if (!want.has(key)) return `“${cs.map(c => CN[c]).join('-')}”这一块不存在，可能有一格填错了。`;
    if (seen.has(key)) return `“${cs.map(c => CN[c]).join('-')}”出现了两次，可能有一格填错了。`;
    seen.add(key);
  }
  return null;
}

/* ---------- timer ---------- */
function pageTimer() {
  main().innerHTML = `
  <header class="page-head"><p class="eyebrow">计时器</p><h1>记录你的成绩</h1><p class="lead">按住空格键（手机按住下面的大框）到数字变绿，放开就开始计时。还原好了，再按一下停止。</p></header>
  <div class="timer-grid">
    <div class="card scr-card"><div class="scr-head"><b>打乱公式</b><button type="button" class="btn ghost small" id="tNew">${ICON.shuffle}<span>换一个</span></button></div>
      <div id="tScr"></div><p class="muted small">黄色朝上、绿色朝前，照着打乱。</p>
      <label class="switch"><input type="checkbox" id="tInsp"><span>15 秒观察（比赛规则：可以看，不能转）</span></label></div>
    <button type="button" class="timer-pad" id="pad" aria-label="计时器：按住再放开开始，再按一下停止"><span class="tp-time" id="tTime">0.00</span><span class="tp-hint" id="tHint">按住空格键或这个框</span></button>
    <div class="card stats" id="tStats"></div>
    <div class="card"><div class="scr-head"><b>徽章</b></div><div class="badges" id="tBadges"></div></div>
    <div class="card"><div class="scr-head"><b>进步曲线</b><span class="muted small">最近 30 次</span></div><div id="tChart" class="chart"></div></div>
    <div class="card"><div class="scr-head"><b>成绩记录</b><button type="button" class="btn ghost small" id="tClear">清空</button></div><div id="tList" class="tlist"></div></div>
  </div>`;
  let times = Store.get('times', []);
  let scr = Cube.randomScramble(20);
  $('#tInsp').checked = Store.get('insp', false);
  $('#tInsp').onchange = e => Store.set('insp', e.target.checked);
  const drawScr = () => { $('#tScr').innerHTML = `${algChips(scr.join(' '))}<div class="scr-pic">${isoSVG(Cube.apply(Cube.solved(), scr), { label: '打乱后的样子' })}</div>`; };
  $('#tNew').onclick = () => { scr = Cube.randomScramble(20); drawScr(); };
  let state = 'idle', t0 = 0, raf, holdT, inspT0 = 0, inspTimer;
  const pad = $('#pad'), tt = $('#tTime'), th = $('#tHint');
  const setPad = s => { state = s; pad.dataset.s = s; };
  const tick = () => { tt.textContent = fmt(performance.now() - t0); raf = requestAnimationFrame(tick); };
  const startInspect = () => {
    setPad('inspect'); inspT0 = performance.now(); th.textContent = '观察中！想好白十字怎么做。准备好就按住。';
    const f = () => { const left = 15 - (performance.now() - inspT0) / 1000; tt.textContent = left > 0 ? Math.ceil(left) : '时间到'; if (state === 'inspect' || state === 'hold-i' || state === 'ready-i') inspTimer = requestAnimationFrame(f); };
    f();
  };
  const press = () => {
    if (state === 'running') { stop(); return; }
    if (state === 'idle' || state === 'stopped') {
      if ($('#tInsp').checked) { startInspect(); state = 'insp-wait'; pad.dataset.s = 'inspect'; return; }
      setPad('hold'); th.textContent = '继续按住…';
      holdT = setTimeout(() => { if (state === 'hold') { setPad('ready'); th.textContent = '放开就开始！'; tt.textContent = '0.00'; } }, 300);
      return;
    }
    if (state === 'inspect') {
      setPad('hold-i');
      holdT = setTimeout(() => { if (state === 'hold-i') { setPad('ready-i'); th.textContent = '放开就开始！'; } }, 300);
    }
  };
  const release = () => {
    if (state === 'insp-wait') { state = 'inspect'; return; }
    if (state === 'hold' || state === 'hold-i') { clearTimeout(holdT); if (state === 'hold') { setPad('idle'); th.textContent = '要按住久一点，数字变绿再放开'; } else { setPad('inspect'); } return; }
    if (state === 'ready' || state === 'ready-i') { cancelAnimationFrame(inspTimer); setPad('running'); th.textContent = '还原好了就按一下'; t0 = performance.now(); tick(); }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    const ms = performance.now() - t0;
    tt.textContent = fmt(ms); setPad('stopped');
    const prevBest = times.length ? Math.min(...times.map(x => x.t)) : Infinity;
    times.push({ t: Math.round(ms), s: scr.join(' '), d: Date.now() }); Store.set('times', times);
    th.textContent = ms < prevBest && times.length > 1 ? '新纪录！再按一次开始下一轮' : '记录好了。再按住开始下一轮';
    if (ms < prevBest && times.length > 1) toast('新纪录：' + fmt(ms) + ' 秒！');
    scr = Cube.randomScramble(20); drawScr(); drawStats();
  };
  const kd = e => {
    if (e.target.closest('input, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); }
    else if (state === 'running') { e.preventDefault(); stop(); }
  };
  const ku = e => { if (e.code === 'Space') { e.preventDefault(); release(); } };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  pad.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
  pad.addEventListener('pointerup', e => { e.preventDefault(); release(); });
  pad.addEventListener('pointerleave', () => { if (state === 'hold' || state === 'hold-i' || state === 'ready' || state === 'ready-i') release(); });
  pad.addEventListener('click', e => e.preventDefault());
  onCleanup(() => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); cancelAnimationFrame(raf); cancelAnimationFrame(inspTimer); clearTimeout(holdT); });
  const avg = n => { if (times.length < n) return null; const a = times.slice(-n).map(x => x.t).sort((x, y) => x - y).slice(1, -1); return a.reduce((p, c) => p + c, 0) / a.length; };
  const BADGES = [[180, '3 分钟内'], [120, '2 分钟内'], [60, '1 分钟内'], [45, '45 秒内'], [30, '30 秒内'], [20, '20 秒内']];
  const drawStats = () => {
    const best = times.length ? Math.min(...times.map(x => x.t)) : null;
    $('#tStats').innerHTML = [['最好成绩', fmt(best)], ['最近 5 次平均', fmt(avg(5))], ['最近 12 次平均', fmt(avg(12))], ['还原次数', times.length]].map(([a, b]) => `<div class="stat"><small>${a}</small><b>${b}</b></div>`).join('') + `<p class="muted small stat-note">平均会去掉最快和最慢的一次，比较能看出真实水平。</p>`;
    $('#tBadges').innerHTML = BADGES.map(([s, n]) => `<div class="badge${best != null && best <= s * 1000 ? ' got' : ''}">${ICON.star}<span>${n}</span></div>`).join('');
    $('#tList').innerHTML = times.length ? times.slice().reverse().slice(0, 50).map((x, j) => { const idx = times.length - 1 - j; return `<div class="trow"><span class="tn">#${idx + 1}</span><b>${fmt(x.t)}</b><span class="ts muted small">${esc(x.s)}</span><button type="button" class="icon-btn small del" data-i="${idx}" aria-label="删除这一次">×</button></div>`; }).join('') : '<p class="muted">还没有成绩。打乱方块，按住空格开始吧！</p>';
    $$('.del', $('#tList')).forEach(b => b.onclick = () => { times.splice(+b.dataset.i, 1); Store.set('times', times); drawStats(); });
    drawChart();
  };
  let clearArm = false;
  $('#tClear').onclick = e => {
    if (!times.length) return;
    if (!clearArm) { clearArm = true; e.currentTarget.textContent = '确定清空？再按一次'; setTimeout(() => { clearArm = false; const b = $('#tClear'); if (b) b.textContent = '清空'; }, 3000); return; }
    times = []; Store.set('times', times); clearArm = false; $('#tClear').textContent = '清空'; drawStats();
  };
  const drawChart = () => {
    const box = $('#tChart');
    const data = times.slice(-30);
    if (data.length < 2) { box.innerHTML = '<p class="muted">还原两次以上，就会画出你的进步曲线。</p>'; return; }
    const W = Math.max(300, Math.round(box.clientWidth || 560)), H = 230, L = 50, R = 14, T = 14, B = 26;
    const maxS = Math.max(...data.map(x => x.t / 1000));
    const steps = [10, 15, 20, 30, 60, 120, 180, 300, 600];
    const ymax = steps.find(s => s >= maxS * 1.08) || Math.ceil(maxS / 60) * 60;
    const tickStep = ymax <= 30 ? 10 : ymax <= 60 ? 15 : ymax <= 120 ? 30 : ymax <= 300 ? 60 : 120;
    const x = i => L + (data.length === 1 ? 0 : i * (W - L - R) / (data.length - 1));
    const y = s => T + (1 - s / ymax) * (H - T - B);
    let g = '';
    for (let s = 0; s <= ymax + 0.001; s += tickStep) g += `<line x1="${L}" x2="${W - R}" y1="${y(s)}" y2="${y(s)}" class="grid"/><text x="${L - 8}" y="${y(s) + 4}" text-anchor="end" class="axis">${s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + '秒'}</text>`;
    const labelled = [];
    [[20, '20 秒'], [30, '30 秒'], [60, '1 分钟']].forEach(([s, n]) => {
      if (s >= ymax) return;
      g += `<line x1="${L}" x2="${W - R}" y1="${y(s)}" y2="${y(s)}" class="goal"/>`;
      if (labelled.every(v => Math.abs(v - y(s)) > 15)) { labelled.push(y(s)); g += `<text x="${L + 6}" y="${y(s) - 5}" class="goal-t">目标 ${n}</text>`; }
    });
    const pts = data.map((d, i) => [x(i), y(d.t / 1000)]);
    g += `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')}" class="line"/>`;
    pts.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5.5 : 4}" class="pt${i === pts.length - 1 ? ' last' : ''}"/>`; });
    g += `<text x="${L}" y="${H - 6}" class="axis">更早</text><text x="${W - R}" y="${H - 6}" text-anchor="end" class="axis">最新</text>`;
    g += `<line class="cross" id="cx" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="最近 ${data.length} 次成绩的折线图">${g}<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" id="hit"/></svg><div class="tip-pop" id="tp" hidden></div>`;
    const svg = $('svg', box), tp = $('#tp'), cx = $('#cx');
    $('#hit').addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * W / r.width;
      const i = Math.max(0, Math.min(data.length - 1, Math.round((px - L) / ((W - L - R) / (data.length - 1)))));
      cx.setAttribute('x1', pts[i][0]); cx.setAttribute('x2', pts[i][0]); cx.setAttribute('visibility', 'visible');
      tp.hidden = false; tp.innerHTML = `<b>${fmt(data[i].t)}</b><span>第 ${times.length - data.length + i + 1} 次</span>`;
      tp.style.left = (pts[i][0] / W * 100) + '%'; tp.style.top = (pts[i][1] / H * r.height) + 'px';
    });
    $('#hit').addEventListener('pointerleave', () => { tp.hidden = true; cx.setAttribute('visibility', 'hidden'); });
  };
  drawScr(); drawStats();
}

/* ---------- speed path ---------- */
const XCASES = {
  'x-1': { alg: "U R U' R'", t: '角块和棱块分开，往右放', n: '棱块颜色和右面一样时用。' },
  'x-2': { alg: "U' F' U F", t: '角块和棱块分开，往前放', n: '上一个的镜子版本，用前面。' },
  'x-3': { alg: "F' U' F", t: '已经配好一对（前面）', n: '角块和棱块已经连在一起，直接放进去。' },
  'x-4': { alg: "R U R'", t: '已经配好一对（右面）', n: '最短的一个，只要 3 下。' },
  'x-5': { alg: "R U2 R' U' R U R'", t: '白色朝上（棱块在右）', n: '先把它们分开，再配对放进去。' },
  'x-6': { alg: "F' U2 F U F' U' F", t: '白色朝上（棱块在前）', n: '上一个的镜子版本。' },
  'x-7': { alg: "U' R U' R' U R U R'", t: '白色朝右，棱块在顶上', n: '先把角块藏起来，再一起拿出来。' },
  'x-8': { alg: "R U' R' U R U' R'", t: '角块在下面，棱块在顶上', n: '角块已经在槽里，先拿出来再配对。' },
};
Object.entries(XCASES).forEach(([k, v]) => { CASES[k] = { mask: 'f2l', inv: v.alg, title: v.t }; });
const LL4 = [
  { g: '顶层第 1 步：黄十字（3 个）', items: [['o-line', A.fruruf, '一字'], ['o-L', A.furuRf, '小拐弯 L'], ['o-dot', A.dot, '点']], mask: 'ollEdges' },
  { g: '顶层第 2 步：黄色面（7 个）', items: [['o-sune', A.sune, '小鱼'], ['o-anti', A.anti, '反小鱼'], ['o-H', A.H, '双车灯 H'], ['o-pi', A.pi, '侧车灯 π'], ['o-U', A.headl, '车灯 U'], ['o-T', A.T, 'T 字'], ['o-bow', A.bow, '领结']], mask: 'oll' },
  { g: '顶层第 3 步：角块换位（2 个）', items: [['q-A', A.aperm, '车灯'], ['q-Y', A.yperm, '对角']], mask: 'all', arrows: true },
  { g: '顶层第 4 步：棱块换位（4 个）', items: [['q-Ua', A.ua, '三棱换位 a'], ['q-Ub', A.ub, '三棱换位 b'], ['q-H', A.hperm, '对换 H'], ['q-Z', A.zperm, '邻换 Z']], mask: 'all', arrows: true },
];
LL4.forEach(G => G.items.forEach(([id, alg, name]) => { CASES[id] = { mask: G.mask, inv: alg, title: name, view: 'top' }; }));
function pageSpeed() {
  const bars = (title, rows, max) => {
    const W = 520, rowH = 34, L = 92, H = rows.length * rowH + 30;
    const x = s => L + s / max * (W - L - 70);
    let g = '';
    for (let s = 0; s <= max; s += 10) g += `<line x1="${x(s)}" x2="${x(s)}" y1="4" y2="${H - 22}" class="grid"/><text x="${x(s)}" y="${H - 6}" text-anchor="middle" class="axis">${s}秒</text>`;
    rows.forEach(([n, s], i) => { const yy = 6 + i * rowH; g += `<text x="${L - 10}" y="${yy + 18}" text-anchor="end" class="axis lab">${n}</text><rect x="${L}" y="${yy + 4}" width="${Math.max(3, x(s) - L)}" height="20" rx="4" class="bar"><title>${n}：约 ${s} 秒</title></rect><text x="${x(s) + 6}" y="${yy + 19}" class="val">${s} 秒</text>`; });
    return `<figure class="barfig"><figcaption>${title}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${g}</svg></figure>`;
  };
  main().innerHTML = `
  <div class="lesson">
    <header class="lesson-head"><p class="eyebrow">学会以后</p><h1>20 秒之路</h1><p class="goal">从“会还原”到“20 秒”，要换更快的方法，也要练眼睛和手指。照着路线一站一站来，不用急。</p></header>
    <div class="lesson-main prose">
      <h2>时间都花在哪里？</h2>
      <p>同样是还原，新手和 20 秒高手的时间分配差很多。下面是大约的数字：</p>
      <div class="barpair">${bars('新手：大约 2 分钟', [['白十字', 25], ['白色角块', 30], ['第二层', 30], ['顶层 4 步', 35]], 40)}${bars('20 秒高手：大约 20 秒', [['白十字', 3], ['F2L 前两层', 10], ['顶层：黄色面', 3], ['顶层：换位', 4]], 40)}</div>
      <p>新手最多的时间，其实花在<b>停下来找小块</b>。所以练观察，跟练手指一样重要。</p>
      <h2>路线图</h2>
      <ol class="road vertical">${ROAD.map(r => `<li><span class="road-t">${r.t}</span><b>${r.name}</b><small>${r.what}</small></li>`).join('')}</ol>
      <h2>第 1 站：熟练 + 指法</h2>
      <p>公式要熟到“手指自己会动”，不用想下一步。拿法：两手的大拇指在前面，其他手指在后面，方块放在指尖，不要握太紧。</p>
      <div class="finger">
        ${[['R', '右手手腕往上翻'], ["R'", '右手手腕往下翻'], ['U', '右手食指把顶层往左拨'], ["U'", '左手食指把顶层往右拨'], ['F', '右手大拇指往下推'], ['L', '左手手腕往下翻'], ["L'", '左手手腕往上翻'], ['D', '左手无名指把底层往右拨']].map(([m, t]) => `<div><span class="mv static"><b>${m}</b><small>${shortOf(m)}</small></span><p>${t}</p></div>`).join('')}
      </div>
      ${rule('四步舞挑战', '用计时器计时：连做 6 次“上左下右”（方块会变回原样）。目标 6 秒 → 4 秒 → 3 秒以内。转的时候不要换手。')}
      <h2>第 2 站：直接做底十字</h2>
      <p>不用小雏菊，直接把白色棱块放到底部。一开始会比较慢，练熟以后平均 8 步以内就能做完。比赛前有 15 秒观察时间，用来把白十字想好。</p>
      <div class="cross-ch card"><div class="cc-left" id="ccLeft"></div></div>
      <h2>第 3 站：F2L 入门</h2>
      <p>新手方法是先放角块、再放棱块。F2L 是把<b>一个角块和一个棱块先配成一对，再一起放进去</b>，第一层和第二层一起完成。下面 8 种最常见，都放到右前方的槽里（白色在底，黄色朝上）。</p>
      ${tip('怎么看图', '灰色的是顶层的其他小块，不用管。彩色的是要配对的角块和棱块。')}
      <div class="xcases">${Object.entries(XCASES).map(([id, v]) => `<div class="xcase"><figure class="dg" data-case="${id}"><div class="dg-pic"></div></figure><div><b>${v.t}</b>${algChips(v.alg)}<p class="muted small">${v.n}</p><button type="button" class="btn small demo" data-case="${id}">${ICON.play}<span>看演示</span></button></div></div>`).join('')}</div>
      <h2>第 4 站：两步顶层（4LLL）</h2>
      <p>把顶层分成 4 小步：先黄十字、再黄色面、再换角块、最后换棱块。一共 16 个公式。你已经会其中 4 个（黄十字、小鱼、车灯、棱块公式）！每星期学 2～3 个就好。</p>
      ${LL4.map(G => `<h3>${G.g}</h3><div class="xcases ll">${G.items.map(([id, alg, name]) => `<div class="xcase"><figure class="dg" data-case="${id}"><div class="dg-pic">${topSVG(caseState(id), { alg: G.arrows ? alg : null, labels: false, label: name })}</div></figure><div><b>${name}</b>${algChips(alg)}<button type="button" class="btn small demo" data-case="${id}">${ICON.play}<span>看演示</span></button></div></div>`).join('')}</div>`).join('')}
      ${tip('看懂箭头', '换位的图里，箭头表示做完公式后，小块会搬到哪里。双箭头是两块互相交换。')}
      <h2>第 5 站：预判，冲 20 秒</h2>
      <ul class="checks">
        <li><b>慢就是快：</b>用比平常慢一点、但<b>不停下来</b>的速度转。停顿比慢转更浪费时间。</li>
        <li><b>边转边找：</b>做公式的时候，眼睛已经在找下一对小块。</li>
        <li><b>每天玩观察训练营：</b>图形侦探练认图，预测高手练脑中转方块。</li>
        <li><b>用好方块：</b>一个顺滑的磁力速拧方块，比旧方块快很多。</li>
      </ul>
      <h2>每天 15～20 分钟练习表</h2>
      <div class="plan">
        ${[['3 分钟', '暖手', '四步舞 R U R\' U\' 做 6 次 × 3 轮'], ['3 分钟', '观察训练营', '玩 1 个游戏'], ['5 分钟', '专项', '这个星期在学的公式或步骤，慢慢做 10 次'], ['5～8 分钟', '计时还原', '计时还原 5 次，看“最近 5 次平均”']].map(([t, a, b]) => `<div><span class="road-t">${t}</span><b>${a}</b><p>${b}</p></div>`).join('')}
      </div>
      <p class="muted">进步不是每天都看得到。每星期比一次“最近 12 次平均”，就会发现自己变快了。</p>
    </div>
    <aside class="lesson-side"><div class="dock" id="dock"><div id="player"></div></div></aside>
  </div>`;
  const dock = $('#dock');
  const player = makePlayer($('#player'), {});
  player.load(caseSpec('x-1'));
  hydrate($('.lesson-main'), player, dock);
  bindPlayerKeys(player);
  // cross challenge
  const cc = $('#ccLeft');
  let ccTimer;
  onCleanup(() => clearInterval(ccTimer));
  const newCross = () => {
    clearInterval(ccTimer);
    const sc = Cube.randomScramble(20);
    const st = Cube.apply(Cube.solved(), sc);
    cc.innerHTML = `<div class="scr-head"><b>白十字挑战</b><span class="clock" id="ccClk">15</span></div>
      <p class="muted small">照打乱公式打乱（黄色朝上、绿色朝前）。用 15 秒观察：4 个白色棱块在哪？先放哪一个？然后自己试，最后看最少步数的答案。</p>
      ${algChips(sc.join(' '))}
      <div class="cc-net">${netSVG(st, { label: '打乱后的展开图' })}</div>
      <div class="btnrow"><button type="button" class="btn small" id="ccAns">${ICON.play}<span>看最少步数答案</span></button><button type="button" class="btn ghost small" id="ccNew">${ICON.shuffle}<span>换一题</span></button></div>`;
    const t0 = performance.now();
    ccTimer = setInterval(() => { const c = $('#ccClk'); if (!c) return; const left = 15 - (performance.now() - t0) / 1000; c.textContent = left > 0 ? Math.ceil(left) + ' 秒观察' : '开始做！'; if (left <= 0) clearInterval(ccTimer); }, 200);
    $('#ccNew').onclick = newCross;
    $('#ccAns').onclick = () => {
      const b = $('#ccAns'); b.disabled = true; b.querySelector('span').textContent = '计算中…';
      setTimeout(() => {
        const sol = Cube.solveCross(st);
        player.load({ state: maskCross(st), moves: sol, segs: [{ name: '最少步数白十字', moves: sol }], title: `白十字：${sol.length} 步`, sub: '灰色的小块现在不用管，只看白色棱块。', finishText: `白十字完成，只用了 ${sol.length} 步！` });
        b.disabled = false; b.querySelector('span').textContent = '看最少步数答案';
        if (isNarrow()) { cc.parentElement.after(dock); dock.classList.add('inline'); dock.scrollIntoView({ behavior: 'smooth' }); }
        player.play();
      }, 30);
    };
  };
  newCross();
}
function maskCross(st) {
  // keep only white edges + centers visible (by current colors)
  return st.map((c, k) => {
    const P = Cube.POS.find(o => o.slots.includes(k));
    if (P.slots.length === 1) return c;
    const cols = P.slots.map(q => st[q]);
    return P.slots.length === 2 && cols.includes('W') ? c : 'X';
  });
}

/* ---------- cheat cards ---------- */
function pageCards() {
  const C = [
    ['第 1 步', '白十字', 'c-goal', '4 个白色棱块在哪里？', DAISY.split(' ').slice(0, 1).join(' '), '小雏菊 → 对齐颜色 → 转两下', null],
    ['第 2 步', '白色角块', 'k-goal', '白色朝右 1 次、朝上 3 次、朝前 5 次', A.sexy, '上 · 左 · 下 · 右', 'learn-3'],
    ['第 3 步', '第二层', 's-goal', '顶层没有黄色的棱块；连成倒 T', A.right, '往右：推走 抬起 回来 放下 ×2', 'learn-4'],
    ['第 4 步', '黄十字', 'y-goal', '点 → L（放左上）→ 一字（横放）→ 十字', A.fruruf, '前顺 ｜ 上 左 下 右 ｜ 前逆', 'learn-5'],
    ['第 5 步', '黄色面', 'f-goal', '1 个放左前；0 或 2 个让左前角黄色朝左', A.sune, '上左 · 下左 · 上左左 · 下', 'learn-6'],
    ['第 6 步', '顶层角块', 'p-back', '找车灯，放后面', A.aperm, "R' F R' ｜ B2 ｜ R F' R' ｜ B2 R2", 'learn-7'],
    ['第 7 步', '顶层棱块', 'e-back', '完成的一面放后面', A.ua, '上右 · 上左 · 上左 · 上右 · 下右 · 上上', 'learn-8'],
  ];
  main().innerHTML = `
  <header class="page-head"><p class="eyebrow">口诀卡</p><h1>7 步口诀，一页记住</h1><p class="lead">每一步：先<b>看</b>什么，再<b>做</b>什么。忘了的时候来这里看一眼，点卡片可以回到那一关。</p></header>
  <div class="cards">${C.map(([k, t, id, look, alg, chant, link]) => `
    <a class="ccard" href="#${link || 'learn-2'}"><div class="ccard-top"><span class="eyebrow">${k}</span><b>${t}</b></div>
      <div class="ccard-pic">${caseFig(id)}</div>
      <div class="ccard-row"><span class="ccard-lab">${ICON.eye}看</span><span>${look}</span></div>
      <div class="ccard-row"><span class="ccard-lab">${ICON.hand}做</span>${k === '第 1 步' ? '<span>花瓣对齐颜色后，那一面转两下（例如 F2）</span>' : algChips(alg)}</div>
      <div class="chant"><span>念法</span><b>${chant}</b></div></a>`).join('')}</div>
  <section class="prose narrow"><h2>口诀小字典</h2>
  <div class="mnemo">${[['R', "R'"], ['U', "U'"], ['F', "F'"], ['L', "L'"], ['D', "D'"], ['y', "y'"]].map(([a, b]) => `<div><span class="mv static"><b>${a}</b><small>${shortOf(a)}</small></span><span class="mv static"><b>${b}</b><small>${shortOf(b)}</small></span></div>`).join('')}</div>
  <p class="muted">念法里只用右手和顶层的时候：R 念“上”，R' 念“下”，U 念“左”，U' 念“右”，R2 念“上上”，U2 念“左左”。</p></section>`;
}

/* ---------- router ---------- */
const PAGES = { home: pageHome, camp: pageCamp, play: pagePlay, follow: pageFollow, timer: pageTimer, speed: pageSpeed, cards: pageCards, 'game-colors': pageGameColors, 'game-flash': pageGameFlash, 'game-find': pageGameFind, 'game-shape': pageGameShape, 'game-predict': pageGamePredict };
function route() {
  App.cleanup.forEach(f => { try { f(); } catch (e) { } });
  App.cleanup = []; App.players = [];
  const key = (location.hash || '#home').slice(1);
  try {
    if (LESSON_BY_KEY[key]) pageLesson(LESSON_BY_KEY[key]);
    else (PAGES[key] || pageHome)();
  } catch (err) {
    main().innerHTML = `<div class="card"><h2>这一页出了点问题</h2><p>${esc(err.message)}</p><a class="btn" href="#home">回到首页</a></div>`;
    console.error(err);
  }
  const navKey = LESSON_BY_KEY[key] ? 'home' : key.startsWith('game-') ? 'camp' : (PAGES[key] ? key : 'home');
  $$('.nav a').forEach(a => { const on = a.getAttribute('href') === '#' + navKey; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  const navOn = $('.nav a.on'); if (navOn && navOn.scrollIntoView) { const nav = $('.nav'); nav.scrollLeft = navOn.offsetLeft - 20; }
  window.scrollTo(0, 0);
}
function boot() {
  $('.nav').innerHTML = NAV.map(([k, n]) => `<a href="#${k}">${n}</a>`).join('');
  window.addEventListener('hashchange', route);
  route();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

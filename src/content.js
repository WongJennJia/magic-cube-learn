/* ===== Cases, quizzes and lesson content ===== */
const A = {
  sexy: "R U R' U'",
  right: "U R U' R' U' F' U F",
  left: "U' L' U L U F U' F'",
  fruruf: "F R U R' U' F'",
  furuRf: "F U R U' R' F'",
  dot: "F R U R' U' F' f R U R' U' f'",
  sune: "R U R' U R U2 R'",
  anti: "R U2 R' U' R U' R'",
  H: "F R U R' U' R U R' U' R U R' U' F'",
  pi: "R U2 R2 U' R2 U' R2 U2 R",
  headl: "R2 D R' U2 R D' R' U2 R'",
  T: "r U R' U' r' F R F'",
  bow: "F' r U R' U' r' F R",
  aperm: "R' F R' B2 R F' R' B2 R2",
  yperm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  ua: "R U' R U R U R U' R' U' R2",
  ub: "R2 U R U R' U' R' U' R' U R'",
  hperm: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",
  zperm: "R' U' R U' R U R U' R' U R U R2 U' R' U2",
};
const rep = (a, n) => Array(n).fill(a).join(' ');
const DAISY = 'F2 R2 B2 L2';
const STAGE_KEYS = ['daisy', 'cross', 'corners', 'second', 'ycross', 'yface', 'cperm', 'eperm'];
const STAGE_TITLE = ['第1步 · 小雏菊', '第1步 · 白十字', '第2步 · 白色角块', '第3步 · 第二层', '第4步 · 黄十字', '第5步 · 黄色面', '第6步 · 顶层角块（车灯）', '第7步 · 顶层棱块'];
const MASK_FN = {
  all: Cube.MASKS.all, centers: Cube.MASKS.centers, cross: Cube.MASKS.cross, f1: Cube.MASKS.f1, f2l: Cube.MASKS.f2l,
  oll: Cube.MASKS.oll, ollEdges: Cube.MASKS.ollEdges,
  edges: p => Cube.isEdge(p), corners: p => Cube.isCorner(p), centerOnly: p => Cube.isCenter(p),
};
const CASES = {
  solved: { mask: 'all', title: '还原好的魔术方块' },
  sexy6: { mask: 'all', sol: rep(A.sexy, 6), title: '上左下右 × 6 次', sub: '做完 6 次，方块会变回原样' },
  pcenter: { mask: 'centerOnly', title: '6 个中心块', sub: '其他小块先变成灰色' },
  pedge: { mask: 'edges', title: '12 个棱块' },
  pcorner: { mask: 'corners', title: '8 个角块' },
  // step 1
  'd-goal': { mask: 'cross', pre: DAISY, title: '小雏菊完成了', sub: '黄色花心，4 片白色花瓣' },
  'd-mid': { mask: 'cross', pre: DAISY, inv: 'R', title: '在中间层', view: 'up' },
  'd-down': { mask: 'cross', pre: DAISY, inv: "U' F2", title: '在底层，白色朝下', view: 'both' },
  'd-flip': { mask: 'cross', pre: DAISY, inv: "F U' R", title: '在顶层，白色朝外' },
  'd-side': { mask: 'cross', pre: DAISY, inv: "F U L'", title: '在底层，白色朝外' },
  'c-from': { mask: 'cross', pre: DAISY + " U", solver: 1, title: '小雏菊 → 白十字', sub: '对齐颜色，转两下，重复 4 次' },
  'c-goal': { mask: 'cross', title: '白十字完成', view: 'down' },
  // step 2
  'k-goal': { mask: 'f1', title: '第一层完成', view: 'down' },
  'k-right': { mask: 'f1', inv: A.sexy, title: '白色朝右：做 1 次' },
  'k-up': { mask: 'f1', inv: rep(A.sexy, 3), title: '白色朝上：做 3 次' },
  'k-front': { mask: 'f1', inv: rep(A.sexy, 5), title: '白色朝前：做 5 次' },
  'k-above': { mask: 'f1', inv: 'U ' + A.sexy, title: '先对准，再重复', sub: '先转顶层送到正上方，再上左下右' },
  'k-stuck': { mask: 'f1', setup: "R U R' L' U' L R U R'", solver: 2, title: '角块卡在底层' },
  // step 3
  's-goal': { mask: 'f2l', title: '前两层完成' },
  's-right': { mask: 'f2l', inv: A.right, title: '往右放' },
  's-left': { mask: 'f2l', inv: A.left, title: '往左放' },
  's-align': { mask: 'f2l', inv: 'U2 ' + A.right, title: '先连成倒 T，再放' },
  's-stuck': { mask: 'f2l', setup: [A.right, 'U2', A.right].join(' '), solver: 3, title: '棱块卡在中间层' },
  // step 4
  'y-goal': { mask: 'ollEdges', title: '黄十字完成', view: 'top' },
  'y-dot': { mask: 'ollEdges', inv: A.dot, solver: 4, title: '点', view: 'top' },
  'y-L': { mask: 'ollEdges', inv: A.furuRf, solver: 4, title: '小拐弯 L', view: 'top' },
  'y-line': { mask: 'ollEdges', inv: A.fruruf, solver: 4, title: '一字', view: 'top' },
  // step 5
  'f-goal': { mask: 'oll', title: '黄色面完成', view: 'top' },
  'f-fish': { mask: 'oll', inv: A.sune, solver: 5, title: '1 个：小鱼', view: 'top' },
  'f-zero': { mask: 'oll', inv: A.H, solver: 5, title: '0 个', view: 'top' },
  'f-two': { mask: 'oll', inv: A.T, solver: 5, title: '2 个', view: 'top' },
  // step 6
  'p-back': { mask: 'all', inv: A.aperm, solver: 6, title: '车灯在后面', view: 'top' },
  'p-side': { mask: 'all', setup: Cube.invert(A.aperm).join(' ') + ' U', solver: 6, title: '车灯在右边', view: 'top' },
  'p-none': { mask: 'all', inv: A.yperm, solver: 6, title: '没有车灯', view: 'top' },
  // step 7
  'e-back': { mask: 'all', inv: A.ua, solver: 7, title: '完成的面在后面', view: 'top' },
  'e-other': { mask: 'all', inv: A.ub, solver: 7, title: '做一次还不对', view: 'top' },
  'e-none': { mask: 'all', inv: A.hperm, solver: 7, title: '一面都没完成', view: 'top' },
};
function caseState(id) {
  const c = CASES[id];
  let s = Cube.mask(MASK_FN[c.mask] || Cube.MASKS.all);
  if (c.pre) s = Cube.apply(s, c.pre);
  if (c.inv) s = Cube.apply(s, Cube.invert(c.inv));
  if (c.setup) s = Cube.apply(s, c.setup);
  return s;
}
function caseMoves(id, s) {
  const c = CASES[id];
  if (c.sol) return Cube.parse(c.sol);
  if (c.solver != null) return Cube.STAGES[c.solver].fn(s).moves;
  if (c.inv) return Cube.parse(c.inv);
  return [];
}
function caseFig(id, extra = {}) {
  const c = CASES[id];
  const s = caseState(id);
  const view = extra.view || c.view || 'up';
  if (view === 'top') return topSVG(s, { label: c.title, ...extra });
  return isoSVG(s, { view, label: c.title, ...extra });
}
function caseSpec(id) {
  const c = CASES[id];
  const s = caseState(id);
  const moves = caseMoves(id, s);
  const stage = c.solver != null ? STAGE_KEYS[c.solver] : null;
  let segs = moves.length ? annotate(moves, stage) : [];
  if (c.solver == null && segs.length && segs.every(x => x.misc)) segs = [{ name: c.title, moves }];
  return { state: s, moves, segs, title: c.title, sub: c.sub || (moves.length ? '按播放看演示，或一步一步看' : '拖动方块，转着看看') };
}

/* ---------- random practice (previous steps solved for you) ---------- */
function practiceSpec(stage) {
  for (let t = 0; t < 30; t++) {
    const sc = Cube.randomScramble(25);
    let s = Cube.apply(Cube.solved(), sc);
    s = Cube.solveBeginner(s, stage).state;
    const r = Cube.STAGES[stage].fn(s);
    if (!r.moves.length) continue;
    return {
      state: s, moves: r.moves, segs: annotate(r.moves, STAGE_KEYS[stage]),
      title: '随机练习：' + STAGE_TITLE[stage], sub: '先观察，想一想怎么做。想好了再按播放看答案。', finishText: '这一步完成！',
    };
  }
}

/* ---------- spot quizzes (observation questions) ---------- */
const SIDE_CN = { F: '前面', R: '右面', B: '后面', L: '左面' };
const rot24 = () => { let s = Cube.solved(); const n = Math.floor(Math.random() * 6); const first = ['', 'x', 'x2', "x'", 'z', "z'"][n]; return Cube.apply(s, [first, pick(['', 'y', 'y2', "y'"])].filter(Boolean)); };
const QUIZ = {
  piece() {
    if (Math.random() < 0.35) {
      const c = pick(['W', 'Y', 'R', 'O', 'B', 'G']);
      const opp = { W: 'Y', Y: 'W', R: 'O', O: 'R', B: 'G', G: 'B' }[c];
      const opts = shuffle([opp, ...shuffle(['W', 'Y', 'R', 'O', 'B', 'G'].filter(x => x !== c && x !== opp)).slice(0, 3)]);
      return {
        fig: `<div class="swatch-big" style="background:${HEX[c]}"></div>`, q: `${CN[c]}色的对面是什么颜色？`,
        opts: opts.map(x => CN[x] + '色'), ans: opts.indexOf(opp), why: `${CN[c]}和${CN[opp]}是一对好朋友，永远在对面。`,
      };
    }
    const vis = Cube.POS.filter(o => o.slots.some(k => ['U', 'F', 'R'].includes(Cube.SLOTS[k].f)));
    const P = pick(vis);
    const n = P.slots.length;
    const s = rot24();
    const type = n === 1 ? 0 : n === 2 ? 1 : 2;
    return {
      fig: isoSVG(s, { hl: new Set(P.slots), label: '有一个小块亮着' }), q: '亮着的小块是什么块？',
      opts: ['中心块', '棱块', '角块'], ans: type,
      why: ['它只有 1 种颜色，在一面的正中间，是中心块。', '它有 2 种颜色，在两个面中间，是棱块。', '它有 3 种颜色，在角上，是角块。'][type],
    };
  },
  corner() {
    const k = pick([1, 3, 5]);
    const m = pick(['', 'y', 'y2', "y'"]);
    let s = Cube.apply(Cube.mask(Cube.MASKS.f1), Cube.invert(rep(A.sexy, k)));
    if (m) s = Cube.apply(s, [m]);
    const dir = { 1: '右', 3: '上', 5: '前' }[k];
    return {
      fig: isoSVG(s, { label: '右前上方有一个白色角块' }), q: '白色角块已经在它家的正上方（右前上）。要做几次“上左下右”？',
      opts: ['1 次', '3 次', '5 次'], ans: [1, 3, 5].indexOf(k), why: `白色朝${dir}，所以做 ${k} 次。记法：朝右 1、朝上 3、朝前 5。`,
    };
  },
  second() {
    const right = Math.random() < .5;
    const m = pick(['', 'y', 'y2', "y'"]);
    let s = Cube.mask(Cube.MASKS.f2l);
    if (m) s = Cube.apply(s, [m]);
    s = Cube.apply(s, Cube.invert(right ? A.right : A.left));
    const top = s[Cube.slotAt([0, 1, 1], Cube.N.U)];
    const rc = Cube.center(s, 'R');
    return {
      fig: isoSVG(s, { label: '前面有一个倒 T' }), q: '前面已经连成倒 T。这个棱块要往哪边放？',
      opts: ['往左放', '往右放'], ans: right ? 1 : 0,
      why: right ? `棱块顶上是${CN[top]}色，和右边的中心（${CN[rc]}色）一样，所以往右放。` : `棱块顶上是${CN[top]}色。右边中心是${CN[rc]}色，${CN[top]}色是它的对面，在左边，所以往左放。`,
    };
  },
  shape() {
    const want = pick(['dot', 'L', 'line', 'cross']);
    let s;
    for (let t = 0; t < 80; t++) {
      s = Cube.mask(Cube.MASKS.ollEdges);
      for (let i = 0; i < 5; i++) s = Cube.apply(s, pick([A.fruruf, A.furuRf, 'U', "U'", A.sune, A.dot]));
      if (Cube.crossShape(s) === want) break;
    }
    const sh = Cube.crossShape(s);
    const names = { dot: '点', L: '小拐弯 L', line: '一字', cross: '十字' };
    const keys = ['dot', 'L', 'line', 'cross'];
    const tip = { dot: '只有中心是黄色，四边都没有。直接做一次黄十字公式。', L: '两个黄色棱块挨在一起，像拐弯。放到左上角再做公式。', line: '两个黄色棱块在对面，连成一条线。横着放再做公式。', cross: '四个棱块都是黄色，十字完成了！' };
    return { fig: topSVG(s, { label: '顶面图' }), q: '只看 4 个棱块，顶面的黄色是什么形状？', opts: keys.map(k => names[k]), ans: keys.indexOf(sh), why: tip[sh] };
  },
  fish() {
    const want = pick([0, 1, 2]);
    let s;
    for (let t = 0; t < 80; t++) {
      s = Cube.mask(Cube.MASKS.oll);
      for (let i = 0; i < 4; i++) s = Cube.apply(s, pick([A.sune, A.anti, 'U', "U'", A.H, A.T]));
      if (Cube.yellowCornersUp(s).filter(Boolean).length === want) break;
    }
    const c = Cube.yellowCornersUp(s).filter(Boolean).length;
    const why = { 0: '没有黄色角块朝上。转顶层，让左前角的黄色贴在左面，再做小鱼公式。', 1: '只有 1 个，这就是小鱼！把它转到左前方，做小鱼公式。', 2: '有 2 个。转顶层，让左前角的黄色贴在左面，再做小鱼公式。', 4: '4 个都朝上，黄色面完成了！' }[c];
    return { fig: topSVG(s, { label: '顶面图' }), q: '顶面有几个黄色角块朝上？', opts: ['0 个', '1 个', '2 个', '4 个'], ans: [0, 1, 2, 4].indexOf(c), why };
  },
  lights() {
    const want = pick([0, 1, 1, 4]);
    let s;
    for (let t = 0; t < 80; t++) {
      s = Cube.solved();
      for (let i = 0; i < 4; i++) s = Cube.apply(s, pick([A.aperm, 'U', "U'", 'U2', A.yperm, A.ua]));
      const h = Cube.headlights(s); const n = ['F', 'R', 'B', 'L'].filter(x => h[x]).length;
      if (n === want) break;
    }
    const h = Cube.headlights(s); const sides = ['F', 'R', 'B', 'L'].filter(x => h[x]);
    const opts = ['前面', '右面', '后面', '左面', '没有车灯', '四面都有'];
    let ans, why;
    if (sides.length === 4) { ans = 5; why = '每一面的两个角颜色都一样，角块已经对了。转顶层对齐就好。'; }
    else if (sides.length === 0) { ans = 4; why = '没有一面的两个角同色。随便做一次车灯公式，车灯就会出现。'; }
    else { ans = ['F', 'R', 'B', 'L'].indexOf(sides[0]); why = `${SIDE_CN[sides[0]]}的两个角颜色一样，这就是车灯。把它转到后面，再做车灯公式。`; }
    return { fig: topSVG(s, { label: '顶面图，四边是侧面的颜色' }), q: '看四边的侧面颜色。车灯在哪一面？', opts, ans, why };
  },
  bar() {
    const want = pick([0, 1, 1]);
    let s;
    for (let t = 0; t < 80; t++) {
      s = Cube.solved();
      for (let i = 0; i < 3; i++) s = Cube.apply(s, pick([A.ua, A.ub, A.hperm, 'y', "y'", A.zperm]));
      const n = ['F', 'R', 'B', 'L'].filter(x => Cube.sideSolved(s, x)).length;
      if (n === want) break;
    }
    const sides = ['F', 'R', 'B', 'L'].filter(x => Cube.sideSolved(s, x));
    const opts = ['前面', '右面', '后面', '左面', '都没有', '全部完成'];
    let ans, why;
    if (sides.length === 4) { ans = 5; why = '四面都同色，已经还原了！'; }
    else if (sides.length === 0) { ans = 4; why = '没有一面 3 格同色。先做一次棱块公式，就会出现完成的一面。'; }
    else { ans = ['F', 'R', 'B', 'L'].indexOf(sides[0]); why = `${SIDE_CN[sides[0]]}的 3 格颜色一样。把这一面转到后面，再做棱块公式。`; }
    return { fig: topSVG(s, { label: '顶面图' }), q: '哪一面的顶层 3 格颜色一样（已经完成）？', opts, ans, why };
  },
};

/* ---------- lesson building blocks ---------- */
const tip = (title, body) => `<aside class="tip"><div class="tip-ic">${ICON.eye}</div><div><b>${title}</b><p>${body}</p></div></aside>`;
const rule = (title, body) => `<aside class="tip rule"><div class="tip-ic">${ICON.bulb}</div><div><b>${title}</b><p>${body}</p></div></aside>`;
const fig = (id, cap) => `<figure class="dg" data-case="${id}"><div class="dg-pic"></div>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const caseCard = (id, title, body) => `<div class="case"><figure class="dg" data-case="${id}"><div class="dg-pic"></div></figure><div class="case-body"><h4>${title}</h4><p>${body}</p><button class="btn small demo" type="button" data-case="${id}">${ICON.play}<span>看演示</span></button></div></div>`;
const algCard = (alg, name, chant, note, demo) => `<div class="algcard"><div class="algcard-head"><span class="algcard-name">${name}</span>${demo ? `<button class="btn small demo" type="button" data-case="${demo}">${ICON.play}<span>看演示</span></button>` : ''}</div>${algChips(alg, { big: true })}${chant ? `<div class="chant"><span>念法</span><b>${chant}</b></div>` : ''}${note ? `<p>${note}</p>` : ''}</div>`;
const practice = stage => `<div class="practice"><div><b>随机练习</b><p>出一道这一步的题目（前面的步骤已经帮你做好）。先自己观察、想好怎么做，再按播放看答案。</p></div><button class="btn" type="button" data-practice="${stage}">${ICON.shuffle}<span>出一道题</span></button></div>`;
const spot = (gen, n = 5) => `<div class="spotquiz" data-gen="${gen}" data-n="${n}"></div>`;
const steps = items => `<ol class="steps">${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
const moveGrid = moves => `<div class="movegrid">${moves.split(' ').map(m => `<button type="button" class="movecard" data-move="${m}"><span class="mc-pic">${isoSVG(Cube.solved(), { move: m, label: m + ' 的转法' })}</span><span class="mc-txt"><b>${m}</b><small>${shortOf(m)}</small></span></button>`).join('')}</div>`;

const LESSONS = [
  {
    key: 'learn-0', kicker: '第 0 关', title: '认识魔术方块', goal: '认识 6 种颜色和 3 种小块，知道“中心块决定颜色”这个大秘密。', mins: 10, first: 'solved', icon: 'solved',
    body: () => `
      <h2>6 个面，6 种颜色</h2>
      <p>魔术方块有 6 个面：白、黄、红、橙、蓝、绿。还原好的时候，每一面只有一种颜色。</p>
      <div class="pairs">
        <div class="pair"><span class="pair-dots">${colorDots(['W', 'Y'])}</span><b>白 ↔ 黄</b><p>像一颗鸡蛋：蛋白和蛋黄，一个在上，一个在下。</p></div>
        <div class="pair"><span class="pair-dots">${colorDots(['R', 'O'])}</span><b>红 ↔ 橙</b><p>红和橙长得很像，所以被分开，坐在两边。</p></div>
        <div class="pair"><span class="pair-dots">${colorDots(['B', 'G'])}</span><b>蓝 ↔ 绿</b><p>蓝天和草地，永远隔得远远的。</p></div>
      </div>
      <p>对面的两种颜色<b>永远不会</b>出现在同一个小块上。所以，世界上没有“白+黄”的小块。</p>
      ${tip('观察小任务', '拿起你的魔术方块转一圈：白色对面是不是黄色？红色对面是不是橙色？蓝色对面是不是绿色？')}
      <h2>三种小块</h2>
      <div class="cases three">
        ${caseCard('pcenter', '中心块 · 6 个', '每一面正中间那一块，只有 1 种颜色。它们<b>永远不会换位置</b>，所以中心块的颜色，就是这一面要拼成的颜色。')}
        ${caseCard('pedge', '棱块 · 12 个', '在两个面中间，有 2 种颜色，像一块夹心饼干。')}
        ${caseCard('pcorner', '角块 · 8 个', '在角上，有 3 种颜色。')}
      </div>
      <h2>大秘密：每个小块都有自己的家</h2>
      <p>还原魔术方块，不是“把颜色拼好”，而是<b>把每个小块送回家</b>。</p>
      <p>家在哪里？看中心块！“黄-绿”棱块的家，在黄色中心和绿色中心中间。“黄-绿-橙”角块的家，在黄、绿、橙三个中心碰在一起的角上。</p>
      <figure class="dg wide"><div class="dg-pic">${isoSVG(Cube.solved(), { hl: new Set([7, 19, 8, 20, 9, 4, 22, 13]), label: '黄-绿棱块和黄-绿-橙角块的家' })}</div><figcaption>亮着的是“黄-绿”棱块和“黄-绿-橙”角块，旁边是它们认路用的中心块。</figcaption></figure>
      <h2>小测验</h2>
      ${spot('piece', 6)}
      <h2>今天的观察任务</h2>
      ${steps(['找出全部 4 个白色棱块（只有白色和另一种颜色）。', '找到“黄-蓝-红”角块。', '闭上眼睛说出：白色对面是什么？绿色对面是什么？'])}
    `,
  },
  {
    key: 'learn-1', kicker: '第 1 关', title: '魔术方块的语言', goal: '看懂 R、U、F 这些字母，知道每个字母怎么转。', mins: 15, first: 'solved', icon: 'solved',
    body: () => `
      <h2>先拿好：黄色朝上，绿色对着你</h2>
      <p>转之前先决定怎么拿。这套教学<b>一直</b>这样拿：黄色中心朝上，绿色中心对着你。这时右边是橙色，左边是红色。</p>
      <figure class="dg"><div class="dg-pic">${isoSVG(Cube.solved(), { label: '黄色朝上，绿色朝前' })}</div><figcaption>标准拿法：黄上、绿前、橙右。</figcaption></figure>
      <h2>6 个面的名字</h2>
      <div class="facenames">
        ${[['R', '右', 'Right'], ['L', '左', 'Left'], ['U', '上', 'Up'], ['D', '下', 'Down'], ['F', '前', 'Front'], ['B', '后', 'Back']].map(([a, b, c]) => `<div><b>${a}</b><span>${b}</span><small>${c}</small></div>`).join('')}
      </div>
      <p>字母就是英文的第一个字母。R 是 Right（右），U 是 Up（上）。</p>
      <h2>只写字母 = 顺时针</h2>
      <p>只写字母（例如 R），就是把那一面<b>顺时针</b>转 90 度。“顺时针”是：假装你的脸正对着那一面，像时钟指针那样转。</p>
      ${moveGrid("R L U D F B")}
      ${tip('点一点', '点任何一张卡片，旁边的魔术方块就会转给你看。图上的箭头就是转的方向。')}
      <h2>加一撇 ' = 反方向，加 2 = 转两下</h2>
      <p>R' 读作“R 撇”，就是反过来转。U2 是转两下，也就是半圈，往哪边转都可以。</p>
      ${moveGrid("R' L' U' D' F' B' U2 R2")}
      <h2>小口诀：用“上下左右”来记</h2>
      <div class="mnemo">
        ${[['R', "R'"], ['U', "U'"], ['F', "F'"], ['L', "L'"], ['D', "D'"]].map(([a, b]) => `<div><span class="mv static"><b>${a}</b><small>${shortOf(a)}</small></span><span class="mv static"><b>${b}</b><small>${shortOf(b)}</small></span></div>`).join('')}
      </div>
      ${rule('R 和 L 最容易搞反', 'R 是右边<b>往上</b>，L 是左边<b>往下</b>。不加撇的时候，左右两边“一上一下”。')}
      <h2>整个方块一起转：y</h2>
      <p>有时候要换一个面对着你。y 就是整个方块像 U 一样往左转，右面跑到前面来。y' 是反方向。</p>
      ${moveGrid("y y'")}
      <h2>第一个公式：上左下右</h2>
      ${algCard(A.sexy, '上左下右', '上 · 左 · 下 · 右', '右手“上”（R）、顶层“左”（U）、右手“下”（R\'）、顶层“右”（U\'）。后面会用很多很多次。', 'sexy6')}
      ${rule('神奇实验', 'R U R\' U\' 连续做 6 次，方块会变回原样！按上面的“看演示”试试，再用你自己的方块做一次。')}
      <h2>游戏：看动画，猜字母</h2>
      <div class="guessgame"></div>
    `,
  },
  {
    key: 'learn-2', kicker: '第 1 步', title: '白十字', goal: '在底部做出白色十字，十字四边的颜色都和中心对上。', mins: 25, first: 'd-goal', icon: 'c-goal', stage: [0, 1],
    body: () => `
      <h2>目标长什么样？</h2>
      ${fig('c-goal', '从下面看：底面有白色十字，十字每一边的侧面颜色，都和那一面的中心一样。')}
      <h2>A. 先做一朵小雏菊</h2>
      <p>小雏菊：黄色中心是花心，4 个白色棱块是花瓣，<b>白色朝上</b>。</p>
      ${fig('d-goal', '小雏菊：白色花瓣围着黄色花心。')}
      ${tip('侦探时间', '先把 4 个白色棱块找出来。它们只有 2 种颜色（白 + 另一种）。有 3 种颜色的是角块，现在不用管。')}
      <h3>把花瓣一片一片送上去</h3>
      <p>找到一个白色棱块，看它在哪里，照下面的情况处理：</p>
      <div class="cases">
        ${caseCard('d-mid', '在中间层', '转它旁边的那一面，把它直接转上顶层，白色朝上。图里只要 R。')}
        ${caseCard('d-down', '在底层，白色朝下', '先转顶层 U，让它正上方变成空位。再把那一面转两下（F2）。')}
        ${caseCard('d-flip', '在顶层，可是白色朝外', '先把它转下去（F），转顶层让出空位（U\'），再把它转上来（R）。')}
        ${caseCard('d-side', '在底层，白色朝外', '转一下那一面（F），它就变成“中间层”的情况。让出空位，再转上来。')}
      </div>
      ${rule('黄金规则', '送花瓣上去之前，先看上面的位置是不是空的。如果那里已经有白色花瓣，就转顶层 U 让开。不然会把放好的花瓣挤下去！')}
      ${practice(0)}
      <h2>B. 把小雏菊变成白十字</h2>
      ${steps(['看一片花瓣的侧面颜色，例如红色。', '转顶层 U，直到这片花瓣的侧面颜色，和下面的中心一样（颜色连成一条竖线）。', '把这一面转两下（例如 F2）。白色花瓣就跑到底部了。', '其他 3 片花瓣也一样做。'])}
      ${caseCard('c-from', '小雏菊 → 白十字', '对齐、转两下，一共 4 次。演示里的 R2、B2、L2，就是“把那一面转两下”。')}
      ${tip('检查一下', '做完后翻过来看：底面是不是白色十字？十字的四边，侧面颜色是不是都和中心一样？不一样就是对齐时看错了。')}
      ${practice(1)}
    `,
  },
  {
    key: 'learn-3', kicker: '第 2 步', title: '白色角块', goal: '把 4 个白色角块放回底层，完成第一层。', mins: 25, first: 'k-right', icon: 'k-goal', stage: [2],
    body: () => `
      <p>白十字在底部。黄色仍然朝上，绿色对着你。</p>
      ${fig('k-goal', '目标：底面全白，而且底层一圈的侧面颜色都对上中心。')}
      <h2>先认清角块的家</h2>
      <p>白色角块有 3 种颜色，例如“白-绿-橙”。它的家在底层，绿色中心和橙色中心中间的那个角。</p>
      ${tip('侦探时间', '只看有白色的角块。看它另外两种颜色，就知道它的家在哪两个中心中间。')}
      <h2>三个动作：找、对准、重复</h2>
      ${steps(['<b>找：</b>在顶层找一个有白色的角块。', '<b>对准：</b>转顶层 U，把它移到它家的正上方。再转整个方块（y），让它在你的<b>右前上方</b>。', '<b>重复：</b>一直做“上左下右” R U R\' U\'，直到它回家、白色朝下。'])}
      ${algCard(A.sexy, '上左下右', '上 · 左 · 下 · 右', '')}
      <h3>要做几次？看白色朝哪边</h3>
      <div class="cases three">
        ${caseCard('k-right', '白色朝右', '做 <b>1 次</b>上左下右。')}
        ${caseCard('k-up', '白色朝上', '做 <b>3 次</b>上左下右。')}
        ${caseCard('k-front', '白色朝前', '做 <b>5 次</b>上左下右。')}
      </div>
      ${rule('记住 1、3、5', '朝右 1 次，朝上 3 次，朝前 5 次。先观察再动手，数着做就不会做过头。')}
      ${caseCard('k-above', '先对准，再重复', '角块不在右前上方？先转顶层，把它送到它家的正上方。如果它家不在右前方，就先转整个方块（y）。')}
      <h3>特别情况：角块卡在底层</h3>
      <p>角块已经在底层，可是位置或方向不对？把它转到右前下方，做一次上左下右，它就会被请到顶层。然后照平常的方法放回家。</p>
      ${caseCard('k-stuck', '角块卡在底层', '先把卡住的角块“请”上来，再放回正确的家。')}
      <h2>观察练习</h2>
      ${spot('corner', 5)}
      ${practice(2)}
    `,
  },
  {
    key: 'learn-4', kicker: '第 3 步', title: '第二层', goal: '把中间层的 4 个棱块放好，完成前两层。', mins: 30, first: 's-right', icon: 's-goal', stage: [3],
    body: () => `
      ${fig('s-goal', '目标：下面两层都完成，只剩顶层。')}
      <h2>找哪一块？</h2>
      <p>黄色朝上。在顶层找一个<b>没有黄色</b>的棱块。有黄色的棱块属于顶层，现在先不管。</p>
      ${tip('侦探时间', '顶层有 4 个棱块。一个一个看：有黄色就跳过，没有黄色的就是要放下去的。')}
      <h2>三个动作</h2>
      ${steps(['<b>连成倒 T：</b>看棱块侧面的颜色，转顶层 U，让它和同色的中心连起来。这一面会出现一个倒过来的 T 字 ⊥。', '<b>转过来：</b>转整个方块（y），让这个倒 T 对着你。', '<b>看顶上：</b>棱块顶上的颜色和右边中心一样，就往右放；和左边中心一样，就往左放。'])}
      <h2>两个公式</h2>
      ${algCard(A.right, '往右放', '推走 抬起 回来 放下 ｜ 推走 抬起 回来 放下', '前半段用右边：顶层往左推走（U），右边抬起来（R），顶层转回来（U\'），右边放下去（R\'）。后半段用前面：顶层往右推走（U\'），前面抬起来（F\'），转回来（U），放下去（F）。', 's-right')}
      ${algCard(A.left, '往左放', '推走 抬起 回来 放下 ｜ 推走 抬起 回来 放下', '跟往右放像照镜子：前半段用左边，后半段用前面，方向全部相反。', 's-left')}
      <div class="cases">
        ${caseCard('s-align', '先连成倒 T', '棱块不在前面？先转顶层连成倒 T，再转整个方块让它对着你。')}
        ${caseCard('s-stuck', '棱块卡在中间层', '顶层找不到没有黄色的棱块，可是第二层还没好？把卡住的棱块转到右前方，做一次“往右放”，它就会被换到顶层。')}
      </div>
      <h2>观察练习</h2>
      ${spot('second', 5)}
      ${practice(3)}
    `,
  },
  {
    key: 'learn-5', kicker: '第 4 步', title: '黄十字', goal: '在顶面做出黄色十字（只看棱块，角块先不管）。', mins: 15, first: 'y-dot', icon: 'y-goal', stage: [4],
    body: () => `
      ${fig('y-goal', '从上往下看：中间一个黄色十字。灰色的地方现在不用管。')}
      <h2>先观察：顶面是什么形状？</h2>
      <div class="shapes">
        ${['y-dot', 'y-L', 'y-line', 'y-goal'].map((id, i) => `<figure class="dg small" data-case="${id}"><div class="dg-pic"></div><figcaption>${['点', '小拐弯 L', '一字', '十字'][i]}</figcaption></figure>`).join('')}
      </div>
      ${tip('侦探时间', '只看 4 个棱块（上、下、左、右那 4 格）和中心。4 个角的颜色现在不重要。')}
      <h2>汉堡包公式</h2>
      ${algCard(A.fruruf, '黄十字公式', '前顺 ｜ 上 左 下 右 ｜ 前逆', '像汉堡包：两片面包是 F 和 F\'，中间夹着“上左下右”。', 'y-line')}
      <h2>照形状做</h2>
      <div class="cases three">
        ${caseCard('y-dot', '点', '直接做一次公式，会变成小拐弯。')}
        ${caseCard('y-L', '小拐弯 L', '转顶层，让它在<b>左上角</b>（像时钟的 9 点和 12 点）。做一次公式，会变成一字。')}
        ${caseCard('y-line', '一字', '转顶层，让它<b>横着放</b>。做一次公式，十字就出来了！')}
      </div>
      <h2>观察练习</h2>
      ${spot('shape', 6)}
      ${practice(4)}
    `,
  },
  {
    key: 'learn-6', kicker: '第 5 步', title: '黄色面', goal: '让整个顶面变成黄色。', mins: 20, first: 'f-fish', icon: 'f-goal', stage: [5],
    body: () => `
      ${fig('f-goal', '目标：顶面 9 格全部是黄色。')}
      <h2>先观察：数一数黄色角块</h2>
      <p>看顶面的 4 个角，有几个是黄色朝上？可能是 0 个、1 个或 2 个。</p>
      <h2>小鱼公式</h2>
      ${algCard(A.sune, '小鱼公式', '上左 · 下左 · 上左左 · 下', '念成 4 拍：上左、下左、上左左、下。只用右手和顶层。', 'f-fish')}
      <h2>照数量做</h2>
      <div class="cases three">
        ${caseCard('f-fish', '1 个：小鱼', '顶面像一条小鱼。转顶层，让朝上的那个黄色角在<b>左前方</b>，做一次小鱼公式。')}
        ${caseCard('f-zero', '0 个', '转顶层，让左前角的黄色贴在<b>左边那一面</b>。做一次公式。')}
        ${caseCard('f-two', '2 个', '一样：转顶层，让左前角的黄色贴在左边那一面。做一次公式。')}
      </div>
      ${tip('做完再看一次', '做完一次后再数一次，照规则再做。通常 1 到 3 次就会全黄。')}
      <h2>观察练习</h2>
      ${spot('fish', 6)}
      ${practice(5)}
    `,
  },
  {
    key: 'learn-7', kicker: '第 6 步', title: '顶层角块：找车灯', goal: '让 4 个顶层角块都到正确的位置。', mins: 20, first: 'p-back', icon: 'p-back', stage: [6],
    body: () => `
      <h2>先观察：找车灯</h2>
      <p>看顶层四周的<b>侧面</b>。如果某一面上，左右两个角的颜色一样，就像汽车的两个车灯。</p>
      ${fig('p-back', '后面的两个角都是同一种颜色：这就是车灯。')}
      ${tip('侦探时间', '要看侧面，不是看顶面！顶面都是黄色，没有线索。四边都看一遍：前、右、后、左。')}
      <h2>车灯公式</h2>
      ${algCard(A.aperm, '车灯公式', 'R\' F R\' ｜ B2 ｜ R F\' R\' ｜ B2 R2', '分 4 小段记：“下、前顺、下”，“后两下”，“上、前逆、下”，“后两下、右两下”。', 'p-back')}
      <h2>照车灯做</h2>
      <div class="cases three">
        ${caseCard('p-back', '有车灯', '转顶层，把车灯放到<b>后面</b>（背对你）。做一次公式。')}
        ${caseCard('p-side', '车灯在别的面', '先转顶层把车灯送到后面。如果四面都有车灯，就只要转顶层对齐。')}
        ${caseCard('p-none', '没有车灯', '随便做一次公式，车灯就会出现。然后照“有车灯”再做一次。')}
      </div>
      ${rule('四面都有车灯', '每一面的两个角颜色都一样：角块已经对了！转顶层，让角块和中心颜色对齐，就可以进入最后一步。')}
      <h2>观察练习</h2>
      ${spot('lights', 6)}
      ${practice(6)}
    `,
  },
  {
    key: 'learn-8', kicker: '第 7 步', title: '顶层棱块：完成！', goal: '把最后的棱块换到对的位置，还原整个魔术方块！', mins: 20, first: 'e-back', icon: 'solved', stage: [7],
    body: () => `
      <h2>先观察：哪一面已经完成？</h2>
      <p>角块对好以后，看四周的侧面：有没有哪一面，顶层 3 格全部是同一种颜色？</p>
      ${fig('e-back', '后面已经完成（3 格同色）。箭头是做完公式后，3 个棱块要去的地方。')}
      <h2>棱块公式</h2>
      ${algCard(A.ua, '棱块公式', '上右 · 上左 · 上左 · 上右 · 下右 · 上上', '6 拍念完：上右、上左、上左、上右、下右、上上（R2）。全部只用右手和顶层！', 'e-back')}
      <h2>照情况做</h2>
      <div class="cases three">
        ${caseCard('e-back', '有一面完成', '转整个方块（y），把完成的那一面放到<b>后面</b>，做一次公式。')}
        ${caseCard('e-other', '做完还不对', '方向反了也没关系。完成的面一样放后面，再做一次。')}
        ${caseCard('e-none', '一面都没完成', '先做一次公式，就会出现完成的一面。然后放到后面再做。')}
      </div>
      <h2>观察练习</h2>
      ${spot('bar', 6)}
      ${practice(7)}
      <div class="finale">
        <div class="finale-pic">${isoSVG(Cube.solved(), { label: '还原好的魔术方块' })}</div>
        <div><h2>恭喜你，会还原魔术方块了！</h2>
        <p>7 个步骤全部学完。接下来：</p>
        <div class="btnrow"><a class="btn" href="#follow">打乱后，跟着完整做一次</a><a class="btn ghost" href="#timer">用计时器记录成绩</a><a class="btn ghost" href="#speed">看 20 秒之路</a></div></div>
      </div>
    `,
  },
];

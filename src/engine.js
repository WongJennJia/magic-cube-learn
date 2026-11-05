/* ===== Cube engine: sticker model, moves, masks, beginner solver ===== */
const Cube = (() => {
  const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
  const FD = {
    U: { n: [0, 1, 0], r: [1, 0, 0], d: [0, 0, 1] },
    R: { n: [1, 0, 0], r: [0, 0, -1], d: [0, -1, 0] },
    F: { n: [0, 0, 1], r: [1, 0, 0], d: [0, -1, 0] },
    D: { n: [0, -1, 0], r: [1, 0, 0], d: [0, 0, -1] },
    L: { n: [-1, 0, 0], r: [0, 0, 1], d: [0, -1, 0] },
    B: { n: [0, 0, -1], r: [-1, 0, 0], d: [0, -1, 0] },
  };
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const key = (p, n) => p.join(',') + '|' + n.join(',');
  const SLOTS = [];
  const IDX = {};
  FACES.forEach((f, fi) => {
    const { n, r, d } = FD[f];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const p = add(add(n, r, j - 1), d, i - 1);
      const s = { f, fi, i, j, p, n, k: SLOTS.length };
      IDX[key(p, n)] = SLOTS.length;
      SLOTS.push(s);
    }
  });
  const slotAt = (p, n) => IDX[key(p, n)];

  // rotate integer vector 90deg about axis (0=x,1=y,2=z); sign +1 = +90 (right-hand)
  function rot([x, y, z], axis, sign) {
    if (axis === 0) return sign > 0 ? [x, -z, y] : [x, z, -y];
    if (axis === 1) return sign > 0 ? [z, y, -x] : [-z, y, x];
    return sign > 0 ? [-y, x, z] : [y, -x, z];
  }
  const MD = {
    R: [0, -1, p => p[0] === 1], L: [0, 1, p => p[0] === -1], M: [0, 1, p => p[0] === 0],
    x: [0, -1, () => true], r: [0, -1, p => p[0] >= 0], l: [0, 1, p => p[0] <= 0],
    U: [1, -1, p => p[1] === 1], D: [1, 1, p => p[1] === -1], E: [1, 1, p => p[1] === 0],
    y: [1, -1, () => true], u: [1, -1, p => p[1] >= 0], d: [1, 1, p => p[1] <= 0],
    F: [2, -1, p => p[2] === 1], B: [2, 1, p => p[2] === -1], S: [2, -1, p => p[2] === 0],
    z: [2, -1, () => true], f: [2, -1, p => p[2] >= 0], b: [2, 1, p => p[2] <= 0],
  };
  const BASE = {};
  for (const m in MD) {
    const [axis, sign, layer] = MD[m];
    const perm = new Array(54);
    SLOTS.forEach((s, k) => {
      perm[k] = layer(s.p) ? slotAt(rot(s.p, axis, sign), rot(s.n, axis, sign)) : k;
    });
    BASE[m] = perm;
  }
  function compose(a, b) { // apply a then b
    const out = new Array(54);
    for (let k = 0; k < 54; k++) out[k] = b[a[k]];
    return out;
  }
  const PERM = {};
  for (const m in BASE) {
    const p1 = BASE[m], p2 = compose(p1, p1), p3 = compose(p2, p1);
    PERM[m] = p1; PERM[m + '2'] = p2; PERM[m + "'"] = p3;
  }
  function norm(t) {
    t = t.replace(/’|′/g, "'").trim();
    let m = t.match(/^([URFDLBMESxyzurfdlb])(w?)(2?)('?)$/);
    if (!m) return null;
    let base = m[1];
    if (m[2] === 'w') base = base.toLowerCase();
    let suf = m[3] ? '2' : (m[4] ? "'" : '');
    return base + suf;
  }
  function parse(alg) {
    if (Array.isArray(alg)) return alg.filter(Boolean);
    return alg.replace(/[()\[\]]/g, ' ').split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  }
  function invMove(m) {
    if (m.endsWith('2')) return m;
    if (m.endsWith("'")) return m.slice(0, -1);
    return m + "'";
  }
  function invert(alg) { return parse(alg).reverse().map(invMove); }
  function apply(state, alg) {
    let s = state.slice();
    for (const m of parse(alg)) {
      const p = PERM[m];
      const o = new Array(54);
      for (let k = 0; k < 54; k++) o[p[k]] = s[k];
      s = o;
    }
    return s;
  }
  const SCHEME = { U: 'Y', D: 'W', F: 'G', B: 'B', R: 'O', L: 'R' };
  function solved() { return SLOTS.map(s => SCHEME[s.f]); }
  function isSolved(s) {
    for (let f = 0; f < 6; f++) for (let k = 1; k < 9; k++) if (s[f * 9 + k] !== s[f * 9]) return false;
    return true;
  }
  // masks: keep(p) gets the HOME position of each sticker's piece in solved state
  function mask(keep, base) {
    const s = base || solved();
    return s.map((c, k) => {
      const r = keep(SLOTS[k].p, SLOTS[k].n, c);
      return r === true ? c : (r === false ? 'X' : r);
    });
  }
  const isCenter = p => p.filter(v => v !== 0).length === 1;
  const isEdge = p => p.filter(v => v !== 0).length === 2;
  const isCorner = p => p.filter(v => v !== 0).length === 3;
  const MASKS = {
    all: () => true,
    centers: p => isCenter(p),
    cross: p => isCenter(p) || (p[1] === -1 && isEdge(p)),
    f1: p => isCenter(p) || p[1] === -1,
    f2l: p => isCenter(p) || p[1] <= 0,
    oll: (p, n, c) => (p[1] <= 0 || isCenter(p)) ? true : (c === 'Y' ? 'Y' : 'X'),
    ollEdges: (p, n, c) => (p[1] <= 0 || isCenter(p)) ? true : (isEdge(p) && c === 'Y' ? 'Y' : 'X'),
    llEdges: (p) => p[1] <= 0 || isCenter(p) || isEdge(p),
    pieceType: t => p => (t === 'center' ? isCenter(p) : t === 'edge' ? isEdge(p) : isCorner(p)),
  };

  // ---------- piece helpers ----------
  const POS = []; // all 26 cubie positions with their slots
  (function () {
    const m = {};
    SLOTS.forEach(s => { const k = s.p.join(','); (m[k] = m[k] || { p: s.p, slots: [] }).slots.push(s.k); });
    for (const k in m) POS.push(m[k]);
  })();
  const posKey = p => p.join(',');
  const POSMAP = {}; POS.forEach(o => POSMAP[posKey(o.p)] = o);
  const center = (s, f) => s[FACES.indexOf(f) * 9 + 4];
  const colorAt = (s, p, n) => s[slotAt(p, n)];
  const N = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
  function findPiece(s, colors) { // colors: array; returns {p, map:{faceName:color}}
    const want = colors.slice().sort().join('');
    for (const o of POS) {
      if (o.slots.length !== colors.length) continue;
      const cs = o.slots.map(k => s[k]);
      if (cs.slice().sort().join('') === want) return o;
    }
    return null;
  }
  const faceOfNormal = n => FACES.find(f => N[f].join() === n.join());

  // ---------- beginner solver ----------
  const FACE_MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'L', "L'", 'L2', 'B', "B'", 'B2', 'D', "D'", 'D2'];
  const U_EDGES = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]]; // UF UR UB UL
  function petals(s) {
    let c = 0;
    for (const p of U_EDGES) if (colorAt(s, p, N.U) === 'W') c++;
    return c;
  }
  function daisy(s) {
    const out = [];
    let guard = 0;
    while (petals(s) < 4 && guard++ < 8) {
      const base = petals(s);
      let found = null;
      for (let depth = 1; depth <= 6 && !found; depth++) {
        const path = [];
        const dfs = (st, d, last) => {
          if (d === 0) return petals(st) > base;
          for (const m of FACE_MOVES) {
            if (last && m[0] === last[0]) continue;
            if (last && ((last[0] === 'D' && m[0] === 'U') || (last[0] === 'L' && m[0] === 'R') || (last[0] === 'B' && m[0] === 'F'))) continue;
            path.push(m);
            if (dfs(apply(st, [m]), d - 1, m)) return true;
            path.pop();
          }
          return false;
        };
        if (dfs(s, depth, null)) found = path.slice();
      }
      if (!found) break;
      out.push(...found);
      s = apply(s, found);
    }
    return { moves: out, state: s };
  }
  const SIDES = ['F', 'R', 'B', 'L'];
  const U_OF = { F: [0, 1, 1], R: [1, 1, 0], B: [0, 1, -1], L: [-1, 1, 0] };
  const UTURN = ['', 'U', 'U2', "U'"];
  const YTURN = ['', 'y', 'y2', "y'"];
  function crossFromDaisy(s) {
    const out = [];
    let remaining = SIDES.slice();
    while (remaining.length) {
      let best = null;
      for (const X of remaining) for (let k = 0; k < 4; k++) {
        const t = k ? apply(s, [UTURN[k]]) : s;
        const p = U_OF[X];
        if (colorAt(t, p, N.U) === 'W' && colorAt(t, p, N[X]) === center(t, X)) {
          const cost = k === 0 ? 0 : (k === 2 ? 2 : 1);
          if (!best || cost < best.cost) best = { X, k, cost };
        }
      }
      if (!best) break;
      const seq = (best.k ? [UTURN[best.k]] : []).concat([best.X + '2']);
      out.push(...seq);
      s = apply(s, seq);
      remaining = remaining.filter(x => x !== best.X);
    }
    return { moves: out, state: s };
  }
  // white corners at D layer
  const D_CORNERS = [[1, -1, 1], [-1, -1, 1], [-1, -1, -1], [1, -1, -1]];
  const U_CORNERS = [[1, 1, 1], [-1, 1, 1], [-1, 1, -1], [1, 1, -1]]; // UFR UFL UBL UBR
  function cornerSolved(s, p) {
    const o = POSMAP[posKey(p)];
    return o.slots.every(k => s[k] === s[SLOTS[k].fi * 9 + 4]);
  }
  function edgeSolved(s, p) { return cornerSolved(s, p); }
  const SEXY = ['R', 'U', "R'", "U'"];
  function corners(s) {
    const out = [];
    let guard = 0;
    while (guard++ < 12) {
      if (D_CORNERS.every(p => cornerSolved(s, p))) break;
      // candidates in U layer
      let best = null;
      for (const p of U_CORNERS) {
        const o = POSMAP[posKey(p)];
        const cols = o.slots.map(k => s[k]);
        if (!cols.includes('W')) continue;
        const others = cols.filter(c => c !== 'W');
        for (let m = 0; m < 4; m++) {
          const t = m ? apply(s, [YTURN[m]]) : s;
          const fr = [center(t, 'F'), center(t, 'R')].sort().join('');
          if (fr !== others.slice().sort().join('')) continue;
          for (let k = 0; k < 4; k++) {
            const t2 = k ? apply(t, [UTURN[k]]) : t;
            const piece = findPiece(t2, cols);
            if (posKey(piece.p) === '1,1,1') {
              const cost = (m ? 1 : 0) + (k ? 1 : 0);
              if (!best || cost < best.cost) best = { m, k, cost };
            }
          }
        }
      }
      if (best) {
        const seq = [];
        if (best.m) seq.push(YTURN[best.m]);
        if (best.k) seq.push(UTURN[best.k]);
        s = apply(s, seq); out.push(...seq);
        for (let i = 0; i < 6 && !cornerSolved(s, [1, -1, 1]); i++) { s = apply(s, SEXY); out.push(...SEXY); }
        continue;
      }
      // pop a wrong D corner
      let popped = false;
      for (let m = 0; m < 4 && !popped; m++) {
        const t = m ? apply(s, [YTURN[m]]) : s;
        const o = POSMAP['1,-1,1'];
        if (o.slots.some(k => t[k] === 'W') && !cornerSolved(t, [1, -1, 1])) {
          // if it is the correct corner just twisted, sexy until solved
          const cols = o.slots.map(k => t[k]).filter(c => c !== 'W').sort().join('');
          const fr = [center(t, 'F'), center(t, 'R')].sort().join('');
          const seq = m ? [YTURN[m]] : [];
          s = apply(s, seq); out.push(...seq);
          if (cols === fr) {
            for (let i = 0; i < 6 && !cornerSolved(s, [1, -1, 1]); i++) { s = apply(s, SEXY); out.push(...SEXY); }
          } else { s = apply(s, SEXY); out.push(...SEXY); }
          popped = true;
        }
      }
      if (!popped) break;
    }
    return { moves: out, state: s };
  }
  const RIGHT_ALG = parse("U R U' R' U' F' U F");
  const LEFT_ALG = parse("U' L' U L U F U' F'");
  const MID_EDGES = [[1, 0, 1], [-1, 0, 1], [-1, 0, -1], [1, 0, -1]];
  function secondLayer(s) {
    const out = [];
    let guard = 0;
    while (guard++ < 12) {
      if (MID_EDGES.every(p => edgeSolved(s, p))) break;
      let best = null;
      for (const p of U_EDGES) {
        const o = POSMAP[posKey(p)];
        const cols = o.slots.map(k => s[k]);
        if (cols.includes('Y')) continue;
        const sideSlot = o.slots.find(k => SLOTS[k].f !== 'U');
        const side = s[sideSlot], top = s[o.slots.find(k => SLOTS[k].f === 'U')];
        for (let k = 0; k < 4; k++) {
          const t = k ? apply(s, [UTURN[k]]) : s;
          // edge position after U^k
          const piece = findPiece(t, cols);
          const sideNow = piece.slots.find(q => SLOTS[q].f !== 'U');
          const face = SLOTS[sideNow].f;
          if (center(t, face) !== side) continue;
          const m = { F: 0, R: 1, B: 2, L: 3 }[face];
          const cost = (k ? 1 : 0) + (m ? 1 : 0);
          if (!best || cost < best.cost) best = { k, m, top, cost };
        }
      }
      if (best) {
        const seq = [];
        if (best.k) seq.push(UTURN[best.k]);
        if (best.m) seq.push(YTURN[best.m]);
        s = apply(s, seq);
        const alg = best.top === center(s, 'R') ? RIGHT_ALG : LEFT_ALG;
        s = apply(s, alg); out.push(...seq, ...alg);
        continue;
      }
      // pop out a wrong middle edge
      let popped = false;
      for (let m = 0; m < 4 && !popped; m++) {
        const t = m ? apply(s, [YTURN[m]]) : s;
        if (!edgeSolved(t, [1, 0, 1])) {
          const seq = (m ? [YTURN[m]] : []).concat(RIGHT_ALG);
          s = apply(s, seq); out.push(...seq); popped = true;
        }
      }
      if (!popped) break;
    }
    return { moves: out, state: s };
  }
  const FRURUF = parse("F R U R' U' F'");
  function yellowEdgesUp(s) { return U_EDGES.map(p => colorAt(s, p, N.U) === 'Y'); } // UF UR UB UL
  function crossShape(s) {
    const e = yellowEdgesUp(s); const c = e.filter(Boolean).length;
    if (c === 4) return 'cross';
    if (c === 0) return 'dot';
    if (c === 2) return (e[0] && e[2]) || (e[1] && e[3]) ? 'line' : 'L';
    return 'other';
  }
  function yellowCross(s) {
    const out = [];
    let guard = 0;
    while (guard++ < 6) {
      const sh = crossShape(s);
      if (sh === 'cross') break;
      let k = 0;
      if (sh === 'L') { for (k = 0; k < 4; k++) { const e = yellowEdgesUp(k ? apply(s, [UTURN[k]]) : s); if (e[2] && e[3]) break; } }
      if (sh === 'line') { for (k = 0; k < 4; k++) { const e = yellowEdgesUp(k ? apply(s, [UTURN[k]]) : s); if (e[1] && e[3]) break; } }
      const seq = (k ? [UTURN[k]] : []).concat(FRURUF);
      s = apply(s, seq); out.push(...seq);
    }
    return { moves: out, state: s };
  }
  const SUNE = parse("R U R' U R U2 R'");
  const yellowCornersUp = s => U_CORNERS.map(p => colorAt(s, p, N.U) === 'Y'); // UFR UFL UBL UBR
  function yellowFace(s, rule2) {
    const out = [];
    let guard = 0;
    while (guard++ < 8) {
      const c = yellowCornersUp(s).filter(Boolean).length;
      if (c === 4) break;
      let k;
      for (k = 0; k < 4; k++) {
        const t = k ? apply(s, [UTURN[k]]) : s;
        if (c === 1 && colorAt(t, [-1, 1, 1], N.U) === 'Y') break;
        if (c !== 1) {
          const face = (c === 2 && rule2 === 'F') ? N.F : N.L;
          if (colorAt(t, [-1, 1, 1], face) === 'Y') break;
        }
      }
      if (k === 4) k = 0;
      const seq = (k ? [UTURN[k]] : []).concat(SUNE);
      s = apply(s, seq); out.push(...seq);
    }
    return { moves: out, state: s };
  }
  const APERM = parse("R' F R' B2 R F' R' B2 R2");
  const UPERM = parse("R U' R U R U R U' R' U' R2");
  // headlights on side X: the two U corners touching X have same color on X face
  function headlights(s) {
    const res = {};
    for (const X of SIDES) {
      const n = N[X];
      const cs = U_CORNERS.filter(p => p[0] * n[0] + p[2] * n[2] === 1).map(p => colorAt(s, p, n));
      res[X] = cs[0] === cs[1];
    }
    return res;
  }
  function cornersAligned(s) { return U_CORNERS.every(p => cornerSolved(s, p)); }
  function cornerPerm(s, apermSide) {
    const out = [];
    let guard = 0;
    while (guard++ < 6) {
      const h = headlights(s);
      const cnt = SIDES.filter(x => h[x]).length;
      if (cnt === 4) break;
      let k = 0;
      if (cnt === 1) {
        for (k = 0; k < 4; k++) { const t = k ? apply(s, [UTURN[k]]) : s; if (headlights(t)[apermSide]) break; }
      }
      const seq = (k ? [UTURN[k]] : []).concat(APERM);
      s = apply(s, seq); out.push(...seq);
    }
    // align corners
    for (let k = 0; k < 4; k++) {
      const t = k ? apply(s, [UTURN[k]]) : s;
      if (cornersAligned(t)) { if (k) { out.push(UTURN[k]); s = t; } break; }
    }
    return { moves: out, state: s };
  }
  function sideSolved(s, X) {
    const n = N[X];
    const ps = [[0, 1, 0], ...U_CORNERS].filter(p => p[0] * n[0] + p[2] * n[2] === 1 || (p[0] === 0 && p[2] === 0 && false));
    const e = add([0, 1, 0], n);
    const cols = U_CORNERS.filter(p => p[0] * n[0] + p[2] * n[2] === 1).map(p => colorAt(s, p, n)).concat([colorAt(s, e, n)]);
    return cols.every(c => c === center(s, X));
  }
  function edgePerm(s, upermSide) {
    const out = [];
    let guard = 0;
    while (guard++ < 6) {
      if (isSolved(s)) break;
      const solvedSides = SIDES.filter(X => sideSolved(s, X));
      let m = 0;
      if (solvedSides.length >= 1) {
        for (m = 0; m < 4; m++) { const t = m ? apply(s, [YTURN[m]]) : s; if (sideSolved(t, upermSide)) break; }
        if (m === 4) m = 0;
      }
      const seq = (m ? [YTURN[m]] : []).concat(UPERM);
      s = apply(s, seq); out.push(...seq);
    }
    return { moves: out, state: s };
  }
  const STAGES = [
    { id: 'daisy', name: '小雏菊', fn: s => daisy(s) },
    { id: 'cross', name: '白十字', fn: s => crossFromDaisy(s) },
    { id: 'corners', name: '白色角块', fn: s => corners(s) },
    { id: 'second', name: '第二层', fn: s => secondLayer(s) },
    { id: 'ycross', name: '黄十字', fn: s => yellowCross(s) },
    { id: 'yface', name: '黄色面', fn: s => yellowFace(s, CFG.rule2) },
    { id: 'cperm', name: '车灯角块', fn: s => cornerPerm(s, CFG.apermSide) },
    { id: 'eperm', name: '棱块换位', fn: s => edgePerm(s, CFG.upermSide) },
  ];
  const CFG = { rule2: 'L', apermSide: 'B', upermSide: 'B' };
  function solveBeginner(s, upto = 8) {
    const parts = [];
    for (let i = 0; i < upto; i++) {
      const r = STAGES[i].fn(s);
      parts.push({ id: STAGES[i].id, name: STAGES[i].name, moves: r.moves });
      s = r.state;
    }
    return { parts, state: s };
  }
  function randomScramble(len = 20, rnd = Math.random) {
    const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
    const axis = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
    const out = [];
    let last = null, last2 = null;
    while (out.length < len) {
      const f = faces[Math.floor(rnd() * 6)];
      if (f === last) continue;
      if (last && axis[f] === axis[last] && last2 && axis[last2] === axis[f]) continue;
      out.push(f + ['', "'", '2'][Math.floor(rnd() * 3)]);
      last2 = last; last = f;
    }
    return out;
  }
  // simplify consecutive same-face moves (for display)
  function simplify(moves) {
    const out = [];
    const amt = m => m.endsWith('2') ? 2 : m.endsWith("'") ? 3 : 1;
    for (const m of moves) {
      const last = out[out.length - 1];
      if (last && last[0] === m[0]) {
        const a = (amt(last) + amt(m)) % 4;
        out.pop();
        if (a) out.push(m[0] + ['', '', '2', "'"][a]);
      } else out.push(m);
    }
    return out;
  }

  // ---------- cross optimal solver (white edges on D) ----------
  let crossTable = null;
  const EDGE_POS = POS.filter(o => o.slots.length === 2);
  function edgeStateIndex(s, targets) { // targets: list of color pairs; returns code
    // code per edge: posIndex*2 + flip  (flip=0 if white sticker on its 'primary' face)
    return targets.map(cols => {
      const o = EDGE_POS.findIndex(e => e.slots.map(k => s[k]).sort().join('') === cols);
      const e = EDGE_POS[o];
      const wk = e.slots.find(k => s[k] === 'W');
      const prim = e.slots[0];
      return o * 2 + (wk === prim ? 0 : 1);
    });
  }
  function buildCross() {
    if (crossTable) return crossTable;
    // edge move table from sticker perms
    const eTab = {};
    for (const m of FACE_MOVES) {
      const perm = PERM[m];
      eTab[m] = new Int8Array(24);
      EDGE_POS.forEach((e, i) => {
        for (let f = 0; f < 2; f++) {
          const prim = e.slots[0], other = e.slots[1];
          const wk = f === 0 ? prim : other; // white sticker slot
          const nk = perm[wk];
          const ni = EDGE_POS.findIndex(x => x.slots.includes(nk));
          const nf = EDGE_POS[ni].slots[0] === nk ? 0 : 1;
          eTab[m][i * 2 + f] = ni * 2 + nf;
        }
      });
    }
    const S = solved();
    const targets = EDGE_POS.filter(e => e.slots.some(k => S[k] === 'W')).map(e => e.slots.map(k => S[k]).sort().join(''));
    const enc = a => ((a[0] * 24 + a[1]) * 24 + a[2]) * 24 + a[3];
    const dist = new Uint8Array(24 ** 4).fill(255);
    const start = edgeStateIndex(S, targets);
    dist[enc(start)] = 0;
    let frontier = [start];
    let d = 0;
    while (frontier.length) {
      const next = [];
      for (const st of frontier) for (const m of FACE_MOVES) {
        const t = st.map(v => eTab[m][v]);
        const c = enc(t);
        if (dist[c] === 255) { dist[c] = d + 1; next.push(t); }
      }
      frontier = next; d++;
    }
    crossTable = { eTab, targets, enc, dist };
    return crossTable;
  }
  function solveCross(s) {
    const T = buildCross();
    let st = edgeStateIndex(s, T.targets);
    const out = [];
    let d = T.dist[T.enc(st)];
    while (d > 0) {
      for (const m of FACE_MOVES) {
        if (out.length && out[out.length - 1][0] === m[0]) continue;
        const t = st.map(v => T.eTab[m][v]);
        if (T.dist[T.enc(t)] === d - 1) { out.push(m); st = t; d--; break; }
      }
    }
    return out;
  }

  return {
    FACES, FD, SLOTS, IDX, slotAt, PERM, MD, parse, invert, invMove, apply, solved, isSolved, mask, MASKS,
    POS, POSMAP, center, colorAt, findPiece, N, SCHEME, isCenter, isEdge, isCorner,
    daisy, crossFromDaisy, corners, secondLayer, yellowCross, crossShape, yellowFace, cornerPerm, edgePerm,
    headlights, sideSolved, solveBeginner, STAGES, CFG, randomScramble, simplify, solveCross, buildCross,
    petals, yellowCornersUp, yellowEdgesUp, cornerSolved, U_CORNERS, U_EDGES, D_CORNERS, MID_EDGES, rot,
  };
})();
if (typeof module !== 'undefined') module.exports = Cube;

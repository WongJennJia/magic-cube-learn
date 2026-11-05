/* ===== UI: colors, labels, SVG diagrams, 3D cube view, step player ===== */
const HEX = { W: '#FFFFFF', Y: '#FFD21F', G: '#14A44D', B: '#1F5FE0', R: '#E2302F', O: '#FF8A1C', X: '#A9B0BB' };
const CN = { W: '白', Y: '黄', G: '绿', B: '蓝', R: '红', O: '橙', X: '灰' };
const BODY = '#16181D';
const MOVE_SHORT = {
  R: '右上', "R'": '右下', R2: '右两下', L: '左下', "L'": '左上', L2: '左两下',
  U: '顶左', "U'": '顶右', U2: '顶两下', D: '底右', "D'": '底左', D2: '底两下',
  F: '前顺', "F'": '前逆', F2: '前两下', B: '后顺', "B'": '后逆', B2: '后两下',
  M: '中下', "M'": '中上', M2: '中两下', E: '中右', "E'": '中左', S: '中顺', "S'": '中逆',
  x: '整体上翻', "x'": '整体下翻', x2: '整体翻半圈', y: '整体左转', "y'": '整体右转', y2: '整体转半圈',
  z: '整体右倒', "z'": '整体左倒', z2: '整体倒过来',
  r: '两层右上', "r'": '两层右下', l: '两层左下', "l'": '两层左上', f: '两层前顺', "f'": '两层前逆',
  u: '两层顶左', "u'": '两层顶右', d: '两层底右', "d'": '两层底左',
};
const MOVE_LONG = {
  R: '右边一层往上转', "R'": '右边一层往下转', R2: '右边一层转两下（半圈）',
  L: '左边一层往下转', "L'": '左边一层往上转', L2: '左边一层转两下（半圈）',
  U: '顶层往左转', "U'": '顶层往右转', U2: '顶层转两下（半圈）',
  D: '底层往右转', "D'": '底层往左转', D2: '底层转两下（半圈）',
  F: '前面像时钟一样顺时针转', "F'": '前面逆时针转', F2: '前面转两下（半圈）',
  B: '后面顺时针转（从后面看）', "B'": '后面逆时针转（从后面看）', B2: '后面转两下（半圈）',
  M: '中间一列往下转（跟 L 一样）', "M'": '中间一列往上转', M2: '中间一列转两下',
  y: '整个方块往左转，右面跑到前面', "y'": '整个方块往右转，左面跑到前面', y2: '整个方块转半圈，后面跑到前面',
  x: '整个方块往上翻，前面跑到顶上', "x'": '整个方块往下翻', x2: '整个方块翻半圈',
  z: '整个方块往右倒', "z'": '整个方块往左倒', z2: '整个方块上下颠倒',
  r: '右边两层一起往上转', "r'": '右边两层一起往下转', f: '前面两层一起顺时针转', "f'": '前面两层一起逆时针转',
  l: '左边两层一起往下转', "l'": '左边两层一起往上转', u: '上面两层一起往左转', "u'": '上面两层一起往右转',
  d: '下面两层一起往右转', "d'": '下面两层一起往左转', E: '中间一层往右转', "E'": '中间一层往左转',
  S: '中间一片顺时针转', "S'": '中间一片逆时针转',
};
const shortOf = m => MOVE_SHORT[m] || m;
const longOf = m => MOVE_LONG[m] || shortOf(m);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const Store = {
  get(k, d) { try { const v = localStorage.getItem('mfk-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mfk-' + k, JSON.stringify(v)); } catch (e) { } },
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l10-7z" fill="currentColor"/><path d="M16 5h3v14h-3z" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14L9 12z" fill="currentColor"/><path d="M5 5h3v14H5z" fill="currentColor"/></svg>',
  restart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3.5 3.5v5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  view: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  retry: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><path d="M8.5 12a3.5 3.5 0 1 0 1-2.5M8.5 7.5v2.5H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6c1 1.7 2.3 2.7 4.3 2.7H21M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4c.8-.9 1.8-1.4 3.2-1.4H21M18 4l3 3-3 3M18 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4a1.5 1.5 0 0 1 3 0v6m0-.5V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7-2.8 0-4.3-1.4-5.6-3.6L3.6 14a1.5 1.5 0 0 1 2.5-1.6L8 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* ---------- SVG diagram helpers ---------- */
const PHI = Math.PI / 6, CPH = Math.cos(PHI), SPH = Math.sin(PHI), RT = Math.SQRT1_2;
const v3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
function proj(p, view) {
  const [x, y, z] = p, h = (x + z) * RT;
  return view === 'down' ? [(x - z) * RT, -h * SPH - y * CPH] : [(x - z) * RT, h * SPH - y * CPH];
}
const f2 = n => Math.round(n * 1000) / 1000;
const ptsStr = a => a.map(p => f2(p[0]) + ',' + f2(p[1])).join(' ');

function arrowDefs(m) {
  const base = m.replace(/['2]/g, ''), prime = m.endsWith("'");
  const col = (xc, up) => { const p = [[xc, -1.2, 1.56], [xc, 1.56, 1.56], [xc, 1.56, -0.95]]; return up ? p : p.reverse(); };
  const row = (yc, left) => { const p = [[1.56, yc, -1.2], [1.56, yc, 1.56], [-0.95, yc, 1.56]]; return left ? p : p.reverse(); };
  const arc = (rad, cw) => { const p = []; for (let t = 140; t >= -150; t -= 10) { const a = t * Math.PI / 180; p.push([rad * Math.cos(a), rad * Math.sin(a), 1.56]); } p.arc = true; if (!cw) { const q = p.reverse(); q.arc = true; return q; } return p; };
  const bk = cw => { const p = [[1.56, -1.2, -1], [1.56, 1.56, -1], [-0.95, 1.56, -1]]; return cw ? p : p.reverse(); };
  const sl = cw => { const p = [[-1.2, 1.56, 0], [1.56, 1.56, 0], [1.56, -0.95, 0]]; return cw ? p : p.reverse(); };
  const d = !prime;
  switch (base) {
    case 'R': return [col(1, d)]; case 'L': return [col(-1, !d)]; case 'M': return [col(0, !d)];
    case 'r': return [col(1, d), col(0, d)]; case 'l': return [col(-1, !d), col(0, !d)];
    case 'x': return [col(1, d), col(0, d), col(-1, d)];
    case 'U': return [row(1, d)]; case 'D': return [row(-1, !d)]; case 'E': return [row(0, !d)];
    case 'u': return [row(1, d), row(0, d)]; case 'd': return [row(-1, !d), row(0, !d)];
    case 'y': return [row(1, d), row(0, d), row(-1, d)];
    case 'F': return [arc(0.95, d)]; case 'B': return [bk(d)]; case 'S': return [sl(d)];
    case 'f': return [arc(0.95, d), sl(d)]; case 'b': return [bk(d)]; case 'z': return [arc(0.95, d), sl(d)];
  }
  return [];
}
function arrowSVG(m, view) {
  const two = m.endsWith('2');
  let out = '';
  for (const pts3 of arrowDefs(m)) {
    let d;
    if (pts3.arc) {
      const P = pts3.map(p => proj(p, view));
      d = 'M' + P.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L');
    } else {
      const [a, b, c] = pts3;
      const t = 0.32;
      const b1 = v3(b, v3(a, b, -1), t / dist3(a, b)); // point before corner
      const b2 = v3(b, v3(c, b, -1), t / dist3(c, b));
      const A = proj(a, view), B1 = proj(b1, view), B = proj(b, view), B2 = proj(b2, view), Cc = proj(c, view);
      d = `M${f2(A[0])} ${f2(A[1])} L${f2(B1[0])} ${f2(B1[1])} Q${f2(B[0])} ${f2(B[1])} ${f2(B2[0])} ${f2(B2[1])} L${f2(Cc[0])} ${f2(Cc[1])}`;
    }
    const P2 = proj(pts3[pts3.length - 1], view), P1 = proj(pts3[pts3.length - 2], view);
    const dx = P2[0] - P1[0], dy = P2[1] - P1[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const tip = [P2[0] + ux * 0.28, P2[1] + uy * 0.28];
    const bl = [P2[0] - ux * 0.08 + uy * 0.26, P2[1] - uy * 0.08 - ux * 0.26];
    const br = [P2[0] - ux * 0.08 - uy * 0.26, P2[1] - uy * 0.08 + ux * 0.26];
    out += `<path d="${d}" fill="none" stroke="#fff" stroke-width=".27" stroke-linecap="round" stroke-linejoin="round"/>`;
    out += `<polygon points="${ptsStr([tip, bl, br])}" fill="#fff" stroke="#fff" stroke-width=".16" stroke-linejoin="round"/>`;
    out += `<path d="${d}" fill="none" stroke="${BODY}" stroke-width=".13" stroke-linecap="round" stroke-linejoin="round"/>`;
    out += `<polygon points="${ptsStr([tip, bl, br])}" fill="${BODY}"/>`;
    if (two) {
      const cx = P2[0] - ux * 0.1 + uy * 0.5, cy = P2[1] - uy * 0.1 - ux * 0.5;
      out += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r=".3" fill="${BODY}" stroke="#fff" stroke-width=".06"/><text x="${f2(cx)}" y="${f2(cy + 0.11)}" text-anchor="middle" font-size=".34" font-weight="700" fill="#fff" font-family="Fredoka, sans-serif">2</text>`;
    }
  }
  return out;
}
function dist3(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

function faceSVG(state, f, view, o) {
  const { n, r, d } = Cube.FD[f];
  const c0 = n.map(v => v * 1.5);
  const P = (a, b) => proj(v3(v3(c0, r, a), d, b), view);
  let s = `<polygon points="${ptsStr([P(-1.5, -1.5), P(1.5, -1.5), P(1.5, 1.5), P(-1.5, 1.5)])}" fill="${BODY}" stroke="${BODY}" stroke-width=".12" stroke-linejoin="round"/>`;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const k = Cube.FACES.indexOf(f) * 9 + i * 3 + j;
    const cc = v3(v3(c0, r, j - 1), d, i - 1);
    const Q = (a, b) => proj(v3(v3(cc, r, a), d, b), view);
    const q = 0.41;
    const col = HEX[state[k]] || HEX.X;
    const dim = o.hl && !o.hl.has(k);
    s += `<polygon points="${ptsStr([Q(-q, -q), Q(q, -q), Q(q, q), Q(-q, q)])}" fill="${col}" stroke="${col}" stroke-width=".07" stroke-linejoin="round"${dim ? ' opacity=".22"' : ''}/>`;
  }
  return s;
}
function isoSVG(state, o = {}) {
  const view = o.view || 'up';
  if (view === 'both') {
    return `<div class="iso-pair">${isoSVG(state, { ...o, view: 'up' })}${isoSVG(state, { ...o, view: 'down', move: null })}</div>`;
  }
  const faces = view === 'down' ? ['D', 'F', 'R'] : ['U', 'F', 'R'];
  let s = faces.map(f => faceSVG(state, f, view, o)).join('');
  if (o.move && view === 'up') s += arrowSVG(o.move, view);
  if (o.marks) for (const k in o.marks) {
    const sl = Cube.SLOTS[k];
    if (!faces.includes(sl.f)) continue;
    const C = proj(v3(sl.n, sl.p, 0).map((v, i) => sl.p[i] + sl.n[i] * 0.5), view);
    s += `<circle cx="${f2(C[0])}" cy="${f2(C[1])}" r=".29" fill="${BODY}" stroke="#fff" stroke-width=".05"/><text x="${f2(C[0])}" y="${f2(C[1] + 0.12)}" text-anchor="middle" font-size=".34" font-weight="700" fill="#fff" font-family="Fredoka, sans-serif">${esc(o.marks[k])}</text>`;
  }
  const cap = view === 'down' ? '<text x="0" y="2.95" text-anchor="middle" font-size=".34" class="svg-cap">从下面看</text>' : '';
  const vb = view === 'down' ? '-2.6 -2.5 5.2 5.6' : '-2.6 -2.75 5.2 5.3';
  return `<svg class="iso" viewBox="${vb}" role="img" aria-label="${esc(o.label || '魔术方块图')}">${s}${cap}</svg>`;
}
function topSVG(state, o = {}) {
  let s = `<rect x="-1.62" y="-1.62" width="3.24" height="3.24" rx=".2" fill="${BODY}"/>`;
  const dim = k => o.hl && !o.hl.has(k) ? ' opacity=".22"' : '';
  for (const sl of Cube.SLOTS) {
    if (sl.p[1] !== 1) continue;
    const col = HEX[state[sl.k]] || HEX.X;
    if (sl.f === 'U') {
      s += `<rect x="${sl.p[0] - 0.44}" y="${sl.p[2] - 0.44}" width=".88" height=".88" rx=".12" fill="${col}"${dim(sl.k)}/>`;
    } else {
      const n = sl.n;
      let x, y, w, h;
      if (n[0]) { w = 0.34; h = 0.9; x = n[0] * 1.9 - w / 2; y = sl.p[2] - h / 2; }
      else { w = 0.9; h = 0.34; y = n[2] * 1.9 - h / 2; x = sl.p[0] - w / 2; }
      s += `<rect x="${f2(x)}" y="${f2(y)}" width="${w}" height="${h}" rx=".09" fill="${col}" stroke="${BODY}" stroke-width=".07"${dim(sl.k)}/>`;
    }
  }
  if (o.alg) s += pllArrowsSVG(o.alg);
  if (o.labels !== false) {
    s += `<text x="0" y="2.62" text-anchor="middle" font-size=".34" class="svg-cap">前（对着你）</text>`;
    s += `<text x="0" y="-2.4" text-anchor="middle" font-size=".34" class="svg-cap">后</text>`;
    s += `<text x="-2.42" y=".12" text-anchor="middle" font-size=".34" class="svg-cap">左</text>`;
    s += `<text x="2.42" y=".12" text-anchor="middle" font-size=".34" class="svg-cap">右</text>`;
  }
  return `<svg class="top" viewBox="-2.75 -2.75 5.5 5.6" role="img" aria-label="${esc(o.label || '顶面图（黄色面朝上，从上往下看）')}">${s}</svg>`;
}
function pllArrowsSVG(alg) {
  const ids = Array.from({ length: 54 }, (_, i) => i);
  const after = Cube.apply(ids, alg);
  const pairs = [];
  for (let np = 0; np < 54; np++) {
    const old = after[np];
    if (old !== np && Cube.SLOTS[old].f === 'U' && Cube.SLOTS[np].f === 'U') pairs.push([old, np]);
  }
  let s = '';
  const done = new Set();
  for (const [a, b] of pairs) {
    if (done.has(a + '-' + b)) continue;
    const back = pairs.some(([x, y]) => x === b && y === a);
    done.add(a + '-' + b); if (back) done.add(b + '-' + a);
    const A = Cube.SLOTS[a].p, B = Cube.SLOTS[b].p;
    let x1 = A[0], y1 = A[2], x2 = B[0], y2 = B[2];
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const sh = 0.2;
    x1 += ux * sh; y1 += uy * sh; x2 -= ux * sh; y2 -= uy * sh;
    const head = (x, y, dx, dy) => `<polygon points="${ptsStr([[x + dx * .02, y + dy * .02], [x - dx * .3 + dy * .17, y - dy * .3 - dx * .17], [x - dx * .3 - dy * .17, y - dy * .3 + dx * .17]])}" fill="${BODY}" stroke="#fff" stroke-width=".05"/>`;
    s += `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="#fff" stroke-width=".2" stroke-linecap="round"/>`;
    s += `<line x1="${f2(x1 + (back ? ux * .2 : 0))}" y1="${f2(y1 + (back ? uy * .2 : 0))}" x2="${f2(x2 - ux * .2)}" y2="${f2(y2 - uy * .2)}" stroke="${BODY}" stroke-width=".09" stroke-linecap="round"/>`;
    s += head(x2, y2, ux, uy);
    if (back) s += head(x1, y1, -ux, -uy);
  }
  return s;
}
const NET_POS = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };
function netSVG(state, o = {}) {
  let s = '';
  for (const f of Cube.FACES) {
    const [fx, fy] = NET_POS[f];
    s += `<rect x="${fx + .02}" y="${fy + .02}" width="2.96" height="2.96" rx=".22" fill="${BODY}"/>`;
    if (o.faceLabels) s += `<text x="${fx + 1.5}" y="${fy - .12}" text-anchor="middle" font-size=".42" class="svg-cap">${o.faceLabels[f]}</text>`;
  }
  for (const sl of Cube.SLOTS) {
    const [fx, fy] = NET_POS[sl.f];
    const col = HEX[state[sl.k]] || HEX.X;
    const dim = o.hl && !o.hl.has(sl.k) ? ' opacity=".25"' : '';
    s += `<rect class="net-st" data-slot="${sl.k}" x="${fx + sl.j + .1}" y="${fy + sl.i + .1}" width=".8" height=".8" rx=".12" fill="${col}"${dim}/>`;
  }
  const top = o.faceLabels ? -0.7 : 0;
  return `<svg class="net" viewBox="-.1 ${top} 12.2 ${9.2 - top}" role="img" aria-label="${esc(o.label || '展开图')}">${s}</svg>`;
}
function stickerGridSVG(cells, o = {}) { // 3x3 face from 9 colors
  let s = `<rect x="0" y="0" width="3.2" height="3.2" rx=".28" fill="${BODY}"/>`;
  cells.forEach((c, i) => { const x = i % 3, y = Math.floor(i / 3); s += `<rect data-i="${i}" x="${x + .18}" y="${y + .18}" width=".86" height=".86" rx=".14" fill="${HEX[c] || 'transparent'}" ${c ? '' : 'stroke="#5a6170" stroke-width=".05" stroke-dasharray=".12 .1"'}/>`; });
  return `<svg class="grid3" viewBox="0 0 3.2 3.2" role="img" aria-label="${esc(o.label || '一个面')}">${s}</svg>`;
}

/* ---------- 3D cube (CSS 3D) ---------- */
const FACE_TF = { U: 'rotateX(90deg)', D: 'rotateX(-90deg)', F: 'rotateY(0deg)', B: 'rotateY(180deg)', R: 'rotateY(90deg)', L: 'rotateY(-90deg)' };
class CubeView {
  constructor(host, o = {}) {
    this.host = host;
    this.state = (o.state || Cube.solved()).slice();
    this.home = [o.rx ?? -26, o.ry ?? -36];
    [this.rx, this.ry] = this.home;
    this.dur = o.dur || 380;
    this.gen = 0;
    this.onSticker = o.onSticker || null;
    this.onUserRotate = o.onUserRotate || null;
    host.classList.add('cv');
    host.innerHTML = '<div class="cv-scene"><div class="cv-cube"></div></div>';
    this.scene = host.firstChild; this.cube = this.scene.firstChild;
    this.cubies = []; this.stickers = new Array(54);
    for (const P of Cube.POS) {
      const p = P.p;
      const el = document.createElement('div');
      el.className = 'cubie';
      const base = `translate3d(${p[0]}em,${-p[1]}em,${p[2]}em)`;
      el.style.transform = base;
      let html = '';
      for (const f of ['U', 'D', 'F', 'B', 'R', 'L']) {
        const k = Cube.slotAt(p, Cube.N[f]);
        html += `<div class="cf" style="transform:${FACE_TF[f]} translateZ(.5em)">${k !== undefined ? `<div class="st" data-slot="${k}"></div>` : ''}</div>`;
      }
      el.innerHTML = html;
      this.cube.appendChild(el);
      this.cubies.push({ el, p, base });
    }
    host.querySelectorAll('.st').forEach(s => { this.stickers[+s.dataset.slot] = s; });
    this.paint(); this.applyView();
    if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(host); }
    this.fit();
    this.bindDrag();
  }
  fit() {
    const w = this.host.clientWidth || 300;
    const s = w / 5.6;
    this.scene.style.fontSize = s + 'px';
    this.scene.style.perspective = (s * 22) + 'px';
  }
  paint() { for (let k = 0; k < 54; k++) this.stickers[k].dataset.c = this.state[k]; }
  setState(s) { this.gen++; cancelAnimationFrame(this.raf); this.cubies.forEach(c => c.el.style.transform = c.base); this.state = s.slice(); this.paint(); }
  setHighlight(set) { for (let k = 0; k < 54; k++) this.stickers[k].classList.toggle('dim', !!set && !set.has(k)); }
  applyView() { this.cube.style.transform = `rotateX(${this.rx}deg) rotateY(${this.ry}deg)`; }
  resetView() {
    const [tx, ty] = this.home, sx = this.rx, sy = this.ry;
    let ny = ((sy - ty) % 360 + 540) % 360 - 180;
    const t0 = performance.now(), D = 450;
    const st = now => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
      this.rx = sx + (tx - sx) * e; this.ry = ty + ny * (1 - e);
      this.applyView();
      if (t < 1) requestAnimationFrame(st);
    };
    requestAnimationFrame(st);
  }
  bindDrag() {
    let down = null;
    this.host.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, rx: this.rx, ry: this.ry, moved: false, target: e.target };
      try { this.host.setPointerCapture(e.pointerId); } catch (_) { }
    });
    this.host.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) < 6) return;
      down.moved = true;
      this.ry = down.ry + dx * 0.55;
      this.rx = Math.max(-88, Math.min(88, down.rx - dy * 0.55));
      this.applyView();
      if (this.onUserRotate) this.onUserRotate();
    });
    const up = e => {
      if (!down) return;
      const d = down; down = null;
      if (!d.moved && this.onSticker) {
        const t = d.target.closest && d.target.closest('.st');
        if (t) this.onSticker(+t.dataset.slot, t);
      }
    };
    this.host.addEventListener('pointerup', up);
    this.host.addEventListener('pointercancel', () => { down = null; });
    this.host.addEventListener('dblclick', () => this.resetView());
  }
  turn(m, dur = this.dur) {
    return new Promise(res => {
      const base = m.replace(/['2]/g, '');
      const def = Cube.MD[base];
      if (!def) { res(); return; }
      const [axis, sign, layer] = def;
      const q = m.endsWith('2') ? 2 : (m.endsWith("'") ? -1 : 1);
      const ours = sign * 90 * q;
      const css = axis === 1 ? ours : -ours;
      const fn = ['rotateX', 'rotateY', 'rotateZ'][axis];
      const parts = this.cubies.filter(c => layer(c.p));
      const total = (Math.abs(q) === 2 ? 1.45 : 1) * dur;
      const gen = this.gen;
      const finish = () => {
        parts.forEach(c => c.el.style.transform = c.base);
        if (gen === this.gen) { this.state = Cube.apply(this.state, [m]); this.paint(); }
        res();
      };
      if (reduceMotion() || total < 30) { finish(); return; }
      const t0 = performance.now();
      const step = now => {
        if (gen !== this.gen) { res(); return; }
        const t = Math.min(1, (now - t0) / total);
        const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const a = css * e;
        for (const c of parts) c.el.style.transform = `${fn}(${a}deg) ${c.base}`;
        if (t < 1) this.raf = requestAnimationFrame(step); else finish();
      };
      this.raf = requestAnimationFrame(step);
    });
  }
  destroy() { this.gen++; cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); }
}

/* ---------- annotate move lists into readable groups ---------- */
const KNOWN = [
  { name: '往右放公式', alg: "U R U' R' U' F' U F" },
  { name: '往左放公式', alg: "U' L' U L U F U' F'" },
  { name: '棱块公式', alg: "R U' R U R U R U' R' U' R2" },
  { name: '车灯公式', alg: "R' F R' B2 R F' R' B2 R2" },
  { name: '小鱼公式', alg: "R U R' U R U2 R'" },
  { name: '黄十字公式', alg: "F R U R' U' F'" },
  { name: '上左下右', alg: "R U R' U'", rep: true },
].map(k => ({ ...k, m: Cube.parse(k.alg) }));
function annotate(moves, stage) {
  const segs = [];
  let i = 0;
  const pushMisc = (m) => {
    let name = /^[U]/.test(m) ? '转顶层' : /^[y]/.test(m) ? '整个方块转' : '转动';
    if (stage === 'daisy') name = '送花瓣上去';
    if (stage === 'cross' && /2$/.test(m) && m[0] !== 'U') name = '转两下';
    const last = segs[segs.length - 1];
    if (last && last.misc && last.name === name && stage === 'daisy') { last.moves.push(m); return; }
    segs.push({ name, moves: [m], misc: true });
  };
  while (i < moves.length) {
    let hit = null;
    for (const k of KNOWN) {
      if (k.m.every((x, j) => moves[i + j] === x)) { hit = k; break; }
    }
    if (hit) {
      let reps = 1;
      if (hit.rep) while (hit.m.every((x, j) => moves[i + reps * 4 + j] === x)) reps++;
      const ms = moves.slice(i, i + hit.m.length * reps);
      segs.push({ name: hit.name + (reps > 1 ? ' ×' + reps : ''), moves: ms, alg: hit.alg, reps });
      i += ms.length;
    } else { pushMisc(moves[i]); i++; }
  }
  return segs;
}

/* ---------- step player ---------- */
const SPEEDS = { slow: 700, mid: 400, fast: 210, turbo: 105 };
class Player {
  constructor(host, o = {}) {
    this.host = host;
    host.classList.add('pl');
    host.innerHTML = `
      <div class="pl-head"><div class="pl-title"></div><div class="pl-sub"></div></div>
      <div class="pl-stage">
        <div class="pl-cube"></div>
        <button class="icon-btn pl-viewbtn" type="button" aria-label="把视角转回正面" title="回到正面">${ICON.view}</button>
        <div class="pl-drag">${ICON.hand}<span>拖动可以转着看</span></div>
      </div>
      <div class="pl-next" aria-live="polite"></div>
      <div class="pl-ctrl">
        <button class="icon-btn" type="button" data-a="restart" aria-label="从头开始" title="从头开始">${ICON.restart}</button>
        <button class="icon-btn" type="button" data-a="back" aria-label="退一步" title="退一步">${ICON.back}</button>
        <button class="btn pl-play" type="button" data-a="play">${ICON.play}<span>播放</span></button>
        <button class="icon-btn" type="button" data-a="fwd" aria-label="走一步" title="走一步">${ICON.fwd}</button>
        <div class="seg" role="group" aria-label="速度">
          <button type="button" data-s="slow">慢</button><button type="button" data-s="mid">中</button><button type="button" data-s="fast">快</button>
        </div>
      </div>
      <div class="pl-chips"></div>`;
    this.view = new CubeView(host.querySelector('.pl-cube'), { state: o.state });
    this.speed = Store.get('speed', 'mid');
    this.start = this.view.state.slice(); this.moves = []; this.idx = 0; this.segs = [];
    this.gen = 0; this.busy = false; this.playing = false; this.playTok = 0;
    host.querySelector('.pl-viewbtn').onclick = () => this.view.resetView();
    host.querySelector('.pl-ctrl').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { this.speed = b.dataset.s; Store.set('speed', this.speed); this.renderSpeed(); return; }
      const a = b.dataset.a;
      if (a === 'play') this.playing ? this.pause() : this.play();
      if (a === 'fwd') { this.pause(); this.fwd(); }
      if (a === 'back') { this.pause(); this.back(); }
      if (a === 'restart') { this.pause(); this.seek(0); }
    });
    host.querySelector('.pl-chips').addEventListener('click', e => {
      const b = e.target.closest('.mv'); if (!b) return;
      this.pause(); this.seek(+b.dataset.i);
    });
    this.renderSpeed();
    this.load({ state: this.start, moves: [], title: o.title || '', sub: o.sub || '' });
  }
  get dur() { return SPEEDS[this.speedOverride || this.speed] || 400; }
  renderSpeed() { this.host.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.s === this.speed)); }
  load(spec) {
    this.pause();
    this.gen++;
    this.busy = false;
    this.start = spec.state.slice();
    this.moves = (spec.moves || []).slice();
    this.segs = spec.segs || (this.moves.length ? [{ name: spec.groupName || '公式', moves: this.moves }] : []);
    let i = 0; this.segs.forEach(s => { s.from = i; i += s.moves.length; s.to = i; });
    this.finishText = spec.finishText || '完成！';
    this.idx = 0;
    this.view.setState(this.start);
    this.host.querySelector('.pl-title').textContent = spec.title || '';
    this.host.querySelector('.pl-sub').textContent = spec.sub || '';
    this.renderChips();
    this.render();
  }
  renderChips() {
    const box = this.host.querySelector('.pl-chips');
    if (!this.moves.length) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    let html = '', lastStage = null;
    this.segs.forEach((s, si) => {
      if (s.stage && s.stage !== lastStage) { html += `<div class="pl-stagehead">${esc(s.stage)}</div>`; lastStage = s.stage; }
      html += `<div class="pl-seg"><div class="pl-segname">${esc(s.name)}</div><div class="pl-segchips">`;
      s.moves.forEach((m, j) => { const i = s.from + j; html += `<button type="button" class="mv" data-i="${i}" aria-label="第${i + 1}步 ${m}"><b>${esc(m)}</b><small>${esc(shortOf(m))}</small></button>`; });
      html += '</div></div>';
    });
    box.innerHTML = html;
  }
  segAt(i) { return this.segs.find(s => i >= s.from && i < s.to); }
  render() {
    const chips = this.host.querySelectorAll('.mv');
    chips.forEach((c, i) => { c.classList.toggle('done', i < this.idx); c.classList.toggle('now', i === this.idx); });
    const now = chips[this.idx];
    if (now) {
      const box = this.host.querySelector('.pl-chips');
      const top = now.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 50) box.scrollTop = top - 40;
    }
    const nx = this.host.querySelector('.pl-next');
    if (!this.moves.length) { nx.innerHTML = ''; nx.hidden = true; }
    else if (this.idx >= this.moves.length) {
      nx.hidden = false;
      nx.innerHTML = `<div class="nx-done">${ICON.check}<div><b>${esc(this.finishText)}</b><span>一共 ${this.moves.length} 步。按 ${ICON.restart} 可以再看一次。</span></div></div>`;
    } else {
      nx.hidden = false;
      const m = this.moves[this.idx], seg = this.segAt(this.idx);
      let segInfo = seg ? esc(seg.name) : '';
      if (seg && seg.reps > 1) { const k = Math.floor((this.idx - seg.from) / 4) + 1; segInfo += `（第 ${k} 次）`; }
      nx.innerHTML = `<div class="nx-pic">${isoSVG(this.view.state, { move: m, label: '下一步的转法' })}</div>
        <div class="nx-text"><span class="nx-k">下一步 · ${this.idx + 1}/${this.moves.length}</span>
        <div class="nx-move"><b>${esc(m)}</b><span>${esc(shortOf(m))}</span></div>
        <p>${esc(longOf(m))}</p>${segInfo ? `<span class="nx-seg">${seg && seg.stage ? esc(seg.stage) + ' · ' : ''}${segInfo}</span>` : ''}</div>`;
    }
    const pb = this.host.querySelector('.pl-play');
    pb.innerHTML = this.playing ? `${ICON.pause}<span>暂停</span>` : `${ICON.play}<span>${this.idx >= this.moves.length && this.moves.length ? '再看一次' : '播放'}</span>`;
    pb.disabled = !this.moves.length;
    if (this.onChange) this.onChange(this.idx);
  }
  async fwd() {
    if (this.busy || this.idx >= this.moves.length) return;
    this.busy = true; const g = this.gen;
    await this.view.turn(this.moves[this.idx], this.dur);
    if (g !== this.gen) return;
    this.idx++; this.busy = false; this.render();
  }
  async back() {
    if (this.busy || this.idx <= 0) return;
    this.busy = true; const g = this.gen;
    await this.view.turn(Cube.invMove(this.moves[this.idx - 1]), this.dur);
    if (g !== this.gen) return;
    this.idx--; this.busy = false; this.render();
  }
  seek(i) {
    this.gen++; this.busy = false;
    this.view.setState(Cube.apply(this.start, this.moves.slice(0, i)));
    this.idx = i; this.render();
  }
  async play() {
    if (!this.moves.length || this.playing) return;
    if (this.idx >= this.moves.length) { this.seek(0); }
    this.playing = true; const tok = ++this.playTok; this.render();
    const g = this.gen;
    await sleep(120);
    while (this.playing && tok === this.playTok && g === this.gen && this.idx < this.moves.length) {
      if (this.busy) { await sleep(40); continue; }
      const before = this.segAt(this.idx);
      await this.fwd();
      if (g !== this.gen || tok !== this.playTok) break;
      const after = this.segAt(this.idx);
      if (before && after && before.stage && after.stage !== before.stage) await sleep(Math.max(500, this.dur * 2));
      else if (this.dur >= 600) await sleep(120);
    }
    if (tok === this.playTok && g === this.gen) { this.playing = false; this.render(); }
  }
  pause() { if (this.playing) { this.playing = false; this.playTok++; this.render(); } }
  destroy() { this.pause(); this.gen++; this.view.destroy(); }
}

/* ---------- small helpers for rendering chips ---------- */
function algChips(alg, o = {}) {
  const ms = Cube.parse(alg);
  return `<div class="alg-chips${o.big ? ' big' : ''}">${ms.map(m => `<span class="mv static"><b>${esc(m)}</b><small>${esc(shortOf(m))}</small></span>`).join('')}</div>`;
}
function colorDots(cols) { return cols.map(c => `<i class="dot" style="background:${HEX[c]}"></i>`).join(''); }
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

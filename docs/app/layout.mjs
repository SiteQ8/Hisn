// Lay out a blueprint as trust tiers. Each zone becomes a vertical band, and the
// bands are ordered by trust from least trusted on the left to most trusted on
// the right, which is how a defence in depth diagram reads. Components stack
// inside their band, and flows are routed between components, so a flow that
// crosses from one band to another is visibly a boundary crossing. Pure and
// deterministic.

import { TRUST_RANK } from "./parse.mjs";

const TITLE_H = 46;
const BAND_HEADER_H = 40;
const BAND_PAD = 16;
const BAND_GAP = 46;
const COMP_H = 58;
const COMP_H_CONTROLS = 68;
const COMP_GAP = 20;
const CHAR_W = 6.9;
const GLYPH_W = 26;
const MIN_CW = 150;
const MAX_CW = 300;
const MARGIN = 28;
const LEGEND_H = 54;

function compWidth(c) {
  const labelW = c.label.length * CHAR_W;
  const ctrlW = c.controls.length ? c.controls.join(", ").length * 5.4 : 0;
  return Math.max(MIN_CW, Math.min(MAX_CW, Math.round(Math.max(labelW, ctrlW) + GLYPH_W + 26)));
}
function compHeight(c) {
  return c.controls.length ? COMP_H_CONTROLS : COMP_H;
}

export function layout(ir) {
  const comps = ir.components.map((c) => ({ ...c, w: compWidth(c), h: compHeight(c) }));
  const byId = {};
  comps.forEach((c) => (byId[c.id] = c));

  // build the ordered list of bands: unzoned first, then zones by trust rank
  const bands = [];
  const hasUnzoned = comps.some((c) => !c.zone);
  if (hasUnzoned) bands.push({ id: "", label: "", trust: "untrusted", members: comps.filter((c) => !c.zone) });
  const zonesSorted = ir.zones.slice().sort((a, b) => (TRUST_RANK[a.trust] - TRUST_RANK[b.trust]) || 0);
  for (const z of zonesSorted) {
    bands.push({ ...z, members: comps.filter((c) => c.zone === z.id) });
  }

  // band widths from their widest member, then place bands left to right
  let x = MARGIN;
  const top = MARGIN + TITLE_H;
  let maxContentH = 0;
  for (const b of bands) {
    const memW = b.members.length ? Math.max(...b.members.map((m) => m.w)) : MIN_CW;
    b.w = Math.max(memW + BAND_PAD * 2, 182);
    b.x = x;
    b.y = top;
    let contentH = BAND_HEADER_H + BAND_PAD;
    for (const m of b.members) contentH += m.h + COMP_GAP;
    contentH = contentH - (b.members.length ? COMP_GAP : 0) + BAND_PAD;
    b.contentH = contentH;
    maxContentH = Math.max(maxContentH, contentH);
    x += b.w + BAND_GAP;
  }
  for (const b of bands) b.h = maxContentH;

  // place components inside their band
  for (const b of bands) {
    let cy = b.y + BAND_HEADER_H + BAND_PAD;
    for (const m of b.members) {
      m.w = b.w - BAND_PAD * 2;
      m.x = b.x + BAND_PAD;
      m.y = cy;
      m.cx = m.x + m.w / 2;
      m.cy = m.y + m.h / 2;
      cy += m.h + COMP_GAP;
    }
  }

  const width = Math.round(x - BAND_GAP + MARGIN);
  const legendY = top + maxContentH + 18;
  const height = Math.round(legendY + LEGEND_H + MARGIN);

  // route flows between components
  const flows = ir.flows
    .filter((f) => byId[f.from] && byId[f.to])
    .map((f, i) => {
      const a = byId[f.from], b = byId[f.to];
      let d, mx, my;
      if (a.id === b.id) {
        const sx = a.x + a.w, sy = a.cy - 8;
        d = `M ${sx} ${sy} C ${sx + 34} ${sy - 16}, ${sx + 34} ${a.cy + 24}, ${sx} ${a.cy + 8}`;
        mx = sx + 30; my = a.cy;
      } else {
        const rightward = b.cx >= a.cx;
        const sx = rightward ? a.x + a.w : a.x;
        const tx = rightward ? b.x : b.x + b.w;
        const sy = a.cy, ty = b.cy;
        const off = Math.max(38, Math.abs(tx - sx) * 0.4);
        const c1 = rightward ? sx + off : sx - off;
        const c2 = rightward ? tx - off : tx + off;
        d = `M ${sx} ${sy} C ${c1} ${sy}, ${c2} ${ty}, ${tx} ${ty}`;
        mx = (sx + tx) / 2; my = (sy + ty) / 2 - 4;
      }
      const boundary = (a.zone || "") !== (b.zone || "");
      return { ...f, d, mx, my, id: "f" + i, boundary };
    });

  // adjacency for the viewer: component -> incident flow ids
  const incident = {};
  comps.forEach((c) => (incident[c.id] = []));
  flows.forEach((f) => { incident[f.from].push(f.id); if (f.to !== f.from) incident[f.to].push(f.id); });

  // which trust levels and data classes actually appear, for the legend
  const trustsUsed = [...new Set(bands.filter((b) => b.id).map((b) => b.trust))]
    .sort((a, c) => TRUST_RANK[a] - TRUST_RANK[c]);
  const dataUsed = [...new Set(ir.flows.map((f) => f.data))];

  return {
    title: ir.title,
    framework: ir.framework,
    width,
    height,
    bands,
    components: comps,
    flows,
    incident,
    legendY,
    trustsUsed,
    dataUsed,
  };
}

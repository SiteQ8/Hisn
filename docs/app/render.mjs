// Render a laid out blueprint to SVG: trust bands tinted by their level, the
// components inside them with a type glyph and any control references, the flows
// between components colored by data classification with boundary crossings
// marked, and a legend. Colors come from the palette and are written as literal
// attributes so the result renders in any tool; classes are kept so the page can
// theme it.

import { palette, TRUST_LABEL, DATA_LABEL } from "./theme.mjs";
import { glyph } from "./icons.mjs";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function truncate(label, w, per) {
  const max = Math.floor((w - 8) / (per || 6.9));
  return label.length <= max ? label : label.slice(0, Math.max(1, max - 1)) + "\u2026";
}
function hexA(hex, a) {
  // hex like #rrggbb -> rgba() at alpha a; passthrough for rgba already
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function renderSVG(model, P) {
  P = P || palette("dark");
  const parts = [];
  parts.push(
    `<svg class="hn-svg" viewBox="0 0 ${model.width} ${model.height}" ` +
    `xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">`
  );
  // arrowhead markers, one per data class plus a hot one
  const defs = [];
  for (const dc of Object.keys(P.data)) {
    defs.push(`<marker id="hn-a-${dc}" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="${P.data[dc]}"/></marker>`);
  }
  defs.push(`<marker id="hn-a-hot" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="${P.accent}"/></marker>`);
  parts.push(`<defs>${defs.join("")}</defs>`);

  parts.push(`<g class="hn-viewport">`);

  // title
  if (model.title) {
    parts.push(`<text class="hn-title" x="28" y="30" fill="${P.text}" font-size="18" font-weight="650">${esc(model.title)}</text>`);
  }

  // trust bands (behind components)
  for (const b of model.bands) {
    if (!b.id) continue; // the implicit unzoned band draws no box
    const col = P.trust[b.trust] || P.trust.restricted;
    const badge = (TRUST_LABEL[b.trust] || b.trust).toUpperCase();
    const badgeW = badge.length * 6.6 + 14;
    parts.push(
      `<g class="hn-band" data-band="${esc(b.id)}" data-trust="${b.trust}">` +
      `<rect class="hn-band-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${hexA(col, 0.06)}" stroke="${hexA(col, 0.5)}" stroke-width="1.3"/>` +
      `<rect class="hn-band-head" x="${b.x}" y="${b.y}" width="${b.w}" height="28" rx="12" fill="${hexA(col, 0.14)}"/>` +
      `<rect x="${b.x}" y="${b.y + 14}" width="${b.w}" height="14" fill="${hexA(col, 0.14)}"/>` +
      `<circle cx="${b.x + 14}" cy="${b.y + 14}" r="4" fill="${col}"/>` +
      `<text class="hn-band-label" x="${b.x + 24}" y="${b.y + 18}" fill="${P.text}" font-size="12" font-weight="600">${esc(truncate(b.label, b.w - badgeW - 30))}</text>` +
      `<text class="hn-band-trust" x="${b.x + b.w - 10}" y="${b.y + 18}" text-anchor="end" fill="${col}" font-size="10" font-weight="600" letter-spacing="0.5">${esc(badge)}</text>` +
      `</g>`
    );
  }

  // flows (between components, above bands)
  for (const f of model.flows) {
    const col = P.data[f.data] || P.data.internal;
    const label = f.label || (f.data !== "internal" ? DATA_LABEL[f.data] : "");
    parts.push(
      `<g class="hn-flow" data-flow="${f.id}" data-from="${esc(f.from)}" data-to="${esc(f.to)}" data-data="${f.data}">` +
      `<path class="hn-flow-path" d="${f.d}" fill="none" stroke="${col}" stroke-width="1.8"${f.boundary ? ' stroke-dasharray="0"' : ""} marker-end="url(#hn-a-${f.data})"/>` +
      (f.boundary ? `<circle class="hn-cross" cx="${f.mx}" cy="${f.my + 4}" r="0"/>` : "") +
      (label
        ? `<g class="hn-flow-label"><rect class="hn-flow-bg" x="${f.mx - label.length * 3.3 - 5}" y="${f.my - 9}" width="${label.length * 6.6 + 10}" height="16" rx="4" fill="${P.flowBg}" opacity="0.85"/>` +
          `<text x="${f.mx}" y="${f.my + 3}" text-anchor="middle" fill="${col}" font-size="10.5">${esc(label)}</text></g>`
        : "") +
      `</g>`
    );
  }

  // components (on top)
  for (const c of model.components) {
    const col = P.compStroke;
    const glyphColor = P.accent;
    parts.push(
      `<g class="hn-comp" data-comp="${esc(c.id)}" data-type="${esc(c.type)}">` +
      `<rect class="hn-comp-box" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="9" fill="${P.compFill}" stroke="${col}" stroke-width="1.4"/>` +
      glyph(c.type, c.x + 12, c.y + (c.h - 22) / 2, 22, glyphColor) +
      `<text class="hn-comp-label" x="${c.x + 44}" y="${c.controls.length ? c.y + 24 : c.cy + 4}" fill="${P.compText}" font-size="13" font-weight="500">${esc(truncate(c.label, c.w - 52))}</text>` +
      (c.controls.length
        ? `<text class="hn-comp-controls" x="${c.x + 44}" y="${c.y + 44}" fill="${P.dim}" font-size="10.5">${esc(truncate(c.controls.join(", "), c.w - 52, 5.4))}</text>`
        : "") +
      `<text class="hn-comp-type" x="${c.x + c.w - 8}" y="${c.y + 15}" text-anchor="end" fill="${P.dim}" font-size="9" letter-spacing="0.4">${esc(c.type.toUpperCase())}</text>` +
      `</g>`
    );
  }

  // legend: trust levels then data classifications
  const ly = model.legendY;
  let lx = 28;
  parts.push(`<g class="hn-legend">`);
  parts.push(`<text x="${lx}" y="${ly - 4}" fill="${P.dim}" font-size="10" font-weight="600" letter-spacing="0.6">TRUST</text>`);
  for (const t of model.trustsUsed) {
    const col = P.trust[t];
    parts.push(`<rect x="${lx}" y="${ly + 6}" width="12" height="12" rx="3" fill="${hexA(col, 0.18)}" stroke="${col}" stroke-width="1.3"/><text x="${lx + 18}" y="${ly + 16}" fill="${P.text}" font-size="11">${esc(TRUST_LABEL[t] || t)}</text>`);
    lx += 24 + (TRUST_LABEL[t] || t).length * 6.6 + 16;
  }
  lx += 8;
  parts.push(`<text x="${lx}" y="${ly - 4}" fill="${P.dim}" font-size="10" font-weight="600" letter-spacing="0.6">DATA</text>`);
  for (const dc of model.dataUsed) {
    const col = P.data[dc];
    parts.push(`<line x1="${lx}" y1="${ly + 12}" x2="${lx + 18}" y2="${ly + 12}" stroke="${col}" stroke-width="2.4"/><text x="${lx + 24}" y="${ly + 16}" fill="${P.text}" font-size="11">${esc(DATA_LABEL[dc] || dc)}</text>`);
    lx += 24 + (DATA_LABEL[dc] || dc).length * 6.6 + 18;
  }
  parts.push(`</g>`);

  parts.push(`</g></svg>`);
  return parts.join("");
}

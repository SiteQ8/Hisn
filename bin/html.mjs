// Assemble one self contained HTML file: the blueprint, the stylesheet, and the
// viewer inlined, with a small bootstrap that wires the toolbar. It opens anywhere
// with no server. Also composes a 1200 by 630 share card. Node only.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { palette } from "../docs/app/theme.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..", "docs", "app");

function slug(s) { return (s || "hisn").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hisn"; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

export function toHTML(model, svg, options) {
  options = options || {};
  const css = readFileSync(join(APP, "styles.css"), "utf8");
  const viewer = readFileSync(join(APP, "viewer.js"), "utf8");
  const reviewJs = readFileSync(join(APP, "review.js"), "utf8");
  const light = options.theme === "light";
  const P = palette(light ? "light" : "dark");
  const title = model.title || options.title || "Security blueprint";
  const name = slug(title);
  const framework = model.framework || "";
  const review = options.review || { findings: [], counts: { high: 0, medium: 0, low: 0 }, coverage: { named: 0 } };

  const toolbar = `
    <div class="hn-toolbar">
      <span class="hn-name">${esc(title)}</span>
      <button class="hn-btn" id="hn-zout" title="Zoom out (-)">&#8722;</button>
      <button class="hn-btn" id="hn-zin" title="Zoom in (+)">&#43;</button>
      <button class="hn-btn" id="hn-zreset" title="Reset view (0)">Reset</button>
      <button class="hn-btn" id="hn-svg" title="Export SVG">SVG</button>
      <button class="hn-btn" id="hn-png" title="Export PNG">PNG</button>
      <button class="hn-btn" id="hn-card" title="Export a 1200 by 630 share image">Card</button>
      <span class="hn-spacer"></span>
      <span class="hn-hint">click a component to trace its data flows</span>
    </div>`;

  const panel = `<div class="hn-review" id="hn-review" data-open="0"></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="generator" content="Hisn">
<style>
html,body{margin:0;height:100%}
body{background:var(--hn-bg);color:var(--hn-text);font:14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:12px}
${css}
</style>
</head>
<body>
<div id="hn-root" class="hn-app${light ? " hn-light" : ""}">
${toolbar}
<div class="hn-stage">${svg}</div>
${panel}
</div>
<script>${viewer}</script>
<script>${reviewJs}</script>
<script>
(function(){
  var opts = { keys:true, name:${JSON.stringify(name)}, title:${JSON.stringify(title)}, framework:${JSON.stringify(framework)},
    bg:${JSON.stringify(P.bg)}, text:${JSON.stringify(P.text)}, dim:${JSON.stringify(P.dim)}, line:${JSON.stringify(P.line)}, accent:${JSON.stringify(P.accent)} };
  var review = ${JSON.stringify(review)};
  opts.flagged = window.HisnReview.flagged(review);
  var api = window.HisnViewer.init(document.getElementById("hn-root"), opts);
  if(!api) return;
  window.HisnReview.render(document.getElementById("hn-review"), review, api);
  document.getElementById("hn-zin").onclick=function(){api.zoomBy(1.15)};
  document.getElementById("hn-zout").onclick=function(){api.zoomBy(1/1.15)};
  document.getElementById("hn-zreset").onclick=function(){api.resetView()};
  document.getElementById("hn-svg").onclick=function(){api.exportSVG()};
  document.getElementById("hn-png").onclick=function(){api.exportPNG()};
  document.getElementById("hn-card").onclick=function(){api.exportCard()};
})();
</script>
</body>
</html>`;
}

export function toCard(model, svg, options) {
  options = options || {};
  const P = palette(options.theme === "light" ? "light" : "dark");
  const W = 1200, H = 630, PAD = 56, FONT = "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
  const title = model.title || options.title || "Security blueprint";
  const sub = ((model.framework ? model.framework.toUpperCase() + " " : "") + "REFERENCE ARCHITECTURE");
  const dw = model.width, dh = model.height;
  const areaX = PAD, areaY = 132, areaW = W - 2 * PAD, areaH = H - areaY - 60;
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<rect width="${W}" height="${H}" fill="${P.bg}"/>
<text x="${PAD}" y="54" fill="${P.dim}" font-size="14" letter-spacing="2">${esc(sub)}</text>
<text x="${PAD}" y="92" fill="${P.text}" font-size="32" font-weight="700">${esc(title)}</text>
<line x1="${PAD}" y1="108" x2="${W - PAD}" y2="108" stroke="${P.line}" stroke-width="1"/>
<svg x="${areaX}" y="${areaY}" width="${areaW}" height="${areaH}" viewBox="0 0 ${dw} ${dh}" preserveAspectRatio="xMidYMid meet">${inner}</svg>
<text x="${W - PAD}" y="${H - 30}" fill="${P.accent}" font-size="19" font-weight="600" text-anchor="end">Hisn</text>
</svg>`;
}

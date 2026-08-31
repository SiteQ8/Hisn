// Demo glue. Loads a blueprint, re renders it live as the source is edited, wires
// the toolbar to the viewer, and switches theme by re rendering the diagram with
// the other palette (the diagram bakes its colors, so a re render is how it
// themes). The engine is the same module the command line uses.
import { build, palette, templates, templateNames, templateLabels } from "./engine.mjs";

const src = document.getElementById("hn-src");
const stage = document.getElementById("hn-stage");
const err = document.getElementById("hn-err");
const root = document.getElementById("hn-root");
const reviewEl = document.getElementById("hn-review");
const picker = document.getElementById("hn-picker");
let theme = "dark";
let api = null;

function wire() {
  const set = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  set("hn-zin", () => api && api.zoomBy(1.15));
  set("hn-zout", () => api && api.zoomBy(1 / 1.15));
  set("hn-zreset", () => api && api.resetView());
  set("hn-svg", () => api && api.exportSVG());
  set("hn-png", () => api && api.exportPNG());
  set("hn-card", () => api && api.exportCard());
}

function render() {
  let built;
  try {
    built = build(src.value, theme);
    err.textContent = "";
  } catch (e) {
    err.textContent = e.message;
    return;
  }
  stage.innerHTML = built.svg;
  if (api) api.destroy();
  const P = palette(theme);
  const review = { findings: built.findings, counts: built.counts, coverage: built.coverage };
  api = window.HisnViewer.init(root, {
    flagged: window.HisnReview.flagged(review),
    name: (built.model.title || "hisn").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hisn",
    title: built.model.title,
    framework: built.model.framework,
    bg: P.bg, text: P.text, dim: P.dim, line: P.line, accent: P.accent,
    keys: false,
  });
  window.HisnReview.render(reviewEl, review, api);
  wire();
}

let t = null;
src.addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 280); });

for (const name of templateNames) {
  const b = document.createElement("button");
  b.className = "hn-btn";
  b.textContent = templateLabels[name] || name;
  b.addEventListener("click", () => {
    picker.querySelectorAll(".hn-on").forEach((x) => x.classList.remove("hn-on"));
    b.classList.add("hn-on");
    src.value = templates[name] || "";
    render();
  });
  picker.appendChild(b);
}

document.getElementById("hn-theme").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  document.body.classList.toggle("hn-light", theme === "light");
  root.classList.toggle("hn-light", theme === "light");
  document.getElementById("hn-theme").textContent = theme === "dark" ? "Light" : "Dark";
  render();
});

src.value = templates.pci;
if (picker.firstChild) picker.firstChild.classList.add("hn-on");
render();

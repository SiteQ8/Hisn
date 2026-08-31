/* The Hisn viewer. Plain browser script, no modules and no dependencies, so it
   drops into a generated file and also runs the demo. It makes the blueprint
   explorable: pan and zoom, click a component to light every data flow it takes
   part in and the components at the other end, and export a clean SVG, a PNG, or
   a share card. The diagram already carries its colors as attributes, so export
   is a straight copy with a background added. */
(function (global) {
  "use strict";

  function init(root, opts) {
    opts = opts || {};
    const svg = root.querySelector(".hn-svg");
    const vp = root.querySelector(".hn-viewport");
    if (!svg || !vp) return null;
    const bg = opts.bg || "#0e1320";

    const state = { x: 0, y: 0, k: 1 };
    function apply() { vp.setAttribute("transform", "translate(" + state.x + "," + state.y + ") scale(" + state.k + ")"); }

    let dragging = false, sx = 0, sy = 0;
    svg.addEventListener("mousedown", function (e) {
      if (e.target.closest(".hn-comp")) return;
      dragging = true; sx = e.clientX - state.x; sy = e.clientY - state.y; svg.style.cursor = "grabbing";
    });
    const onMove = function (e) { if (!dragging) return; state.x = e.clientX - sx; state.y = e.clientY - sy; apply(); };
    const onUp = function () { dragging = false; svg.style.cursor = ""; };
    global.addEventListener("mousemove", onMove);
    global.addEventListener("mouseup", onUp);

    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const nk = Math.max(0.2, Math.min(4, state.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      state.x = mx - (mx - state.x) * (nk / state.k);
      state.y = my - (my - state.y) * (nk / state.k);
      state.k = nk; apply();
    }, { passive: false });

    function zoomBy(f) {
      const rect = svg.getBoundingClientRect();
      const mx = rect.width / 2, my = rect.height / 2;
      const nk = Math.max(0.2, Math.min(4, state.k * f));
      state.x = mx - (mx - state.x) * (nk / state.k);
      state.y = my - (my - state.y) * (nk / state.k);
      state.k = nk; apply();
    }
    function resetView() { state.x = 0; state.y = 0; state.k = 1; apply(); }

    // highlight a component and its data flows
    let focused = null;
    function clearFocus() {
      focused = null;
      svg.classList.remove("hn-focusing");
      svg.querySelectorAll(".hn-hot, .hn-seed").forEach(function (el) { el.classList.remove("hn-hot", "hn-seed"); });
    }
    function focus(id) {
      if (focused === id) { clearFocus(); return; }
      clearFocus();
      focused = id;
      const hot = new Set([id]);
      svg.querySelectorAll(".hn-flow").forEach(function (el) {
        const f = el.getAttribute("data-from"), t = el.getAttribute("data-to");
        if (f === id || t === id) { hot.add(f); hot.add(t); }
      });
      svg.classList.add("hn-focusing");
      svg.querySelectorAll(".hn-flow").forEach(function (el) {
        const f = el.getAttribute("data-from"), t = el.getAttribute("data-to");
        if (f === id || t === id) el.classList.add("hn-hot");
      });
      svg.querySelectorAll(".hn-comp").forEach(function (el) {
        const cid = el.getAttribute("data-comp");
        if (cid === id) el.classList.add("hn-hot", "hn-seed");
        else if (hot.has(cid)) el.classList.add("hn-hot");
      });
    }
    // light a specific set, used when a review finding is selected
    function highlight(compIds, flowIds) {
      clearFocus();
      focused = "\u0000set";
      svg.classList.add("hn-focusing");
      (flowIds || []).forEach(function (id) {
        const el = svg.querySelector('.hn-flow[data-flow="' + id + '"]');
        if (el) el.classList.add("hn-hot");
      });
      (compIds || []).forEach(function (id) {
        const el = svg.querySelector('.hn-comp[data-comp="' + id + '"]');
        if (el) el.classList.add("hn-hot");
      });
    }

    // mark the elements a review finding touches, so the gaps are visible at rest
    function mark(compIds, flowIds) {
      svg.querySelectorAll(".hn-flagged").forEach(function (el) { el.classList.remove("hn-flagged"); });
      (compIds || []).forEach(function (id) {
        const el = svg.querySelector('.hn-comp[data-comp="' + id + '"]');
        if (el) el.classList.add("hn-flagged");
      });
      (flowIds || []).forEach(function (id) {
        const el = svg.querySelector('.hn-flow[data-flow="' + id + '"]');
        if (el) el.classList.add("hn-flagged");
      });
    }

    svg.querySelectorAll(".hn-comp").forEach(function (el) {
      el.addEventListener("click", function (e) { e.stopPropagation(); focus(el.getAttribute("data-comp")); });
    });
    svg.addEventListener("click", function (e) { if (!e.target.closest(".hn-comp")) clearFocus(); });

    // export
    function standaloneSVG() {
      const clone = svg.cloneNode(true);
      const cvp = clone.querySelector(".hn-viewport");
      if (cvp) cvp.removeAttribute("transform");
      clone.querySelectorAll(".hn-hot, .hn-seed, .hn-flagged").forEach(function (el) { el.classList.remove("hn-hot", "hn-seed", "hn-flagged"); });
      clone.classList.remove("hn-focusing");
      const vb = svg.getAttribute("viewBox").split(/\s+/);
      const w = Math.round(parseFloat(vb[2])), h = Math.round(parseFloat(vb[3]));
      clone.setAttribute("width", w); clone.setAttribute("height", h);
      let s = clone.outerHTML;
      if (!/xmlns=/.test(s)) s = s.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      s = s.replace(/(<g class="hn-viewport)/, '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>$1');
      return { svg: s, w: w, h: h };
    }
    function download(name, blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
    function exportSVG() {
      download((opts.name || "hisn") + ".svg", new Blob([standaloneSVG().svg], { type: "image/svg+xml" }));
    }
    function raster(scale, then) {
      const o = standaloneSVG();
      const img = new Image();
      const url = URL.createObjectURL(new Blob([o.svg], { type: "image/svg+xml" }));
      img.onload = function () { then(img, o); URL.revokeObjectURL(url); };
      img.src = url;
    }
    function exportPNG() {
      raster(2, function (img, o) {
        const c = document.createElement("canvas");
        c.width = o.w * 2; c.height = o.h * 2;
        const ctx = c.getContext("2d"); ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
        c.toBlob(function (b) { download((opts.name || "hisn") + ".png", b); });
      });
    }
    function exportCard() {
      const W = 1200, H = 630, PAD = 56, FONT = "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
      const title = opts.title || "Blueprint";
      const sub = (opts.framework ? opts.framework.toUpperCase() + " " : "") + "REFERENCE ARCHITECTURE";
      raster(2, function (img, o) {
        const c = document.createElement("canvas");
        c.width = W * 2; c.height = H * 2;
        const ctx = c.getContext("2d"); ctx.scale(2, 2);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "left"; ctx.fillStyle = opts.dim || "#93a1ba"; ctx.font = "600 14px " + FONT;
        ctx.fillText(sub, PAD, 54);
        ctx.fillStyle = opts.text || "#e8edf6"; ctx.font = "700 32px " + FONT; ctx.fillText(title, PAD, 92);
        ctx.strokeStyle = opts.line || "#26314a"; ctx.beginPath(); ctx.moveTo(PAD, 108); ctx.lineTo(W - PAD, 108); ctx.stroke();
        const areaX = PAD, areaY = 132, areaW = W - 2 * PAD, areaH = H - areaY - 60;
        const scale = Math.min(areaW / o.w, areaH / o.h);
        const dw = o.w * scale, dh = o.h * scale;
        ctx.drawImage(img, areaX + (areaW - dw) / 2, areaY + (areaH - dh) / 2, dw, dh);
        ctx.fillStyle = opts.accent || "#4bd6c8"; ctx.font = "600 19px " + FONT; ctx.textAlign = "right";
        ctx.fillText("Hisn", W - PAD, H - 30);
        c.toBlob(function (b) { download((opts.name || "hisn") + "-card.png", b); });
      });
    }

    if (opts.flagged) mark(opts.flagged.components, opts.flagged.flows);

    const api = { zoomBy, resetView, focus, clearFocus, highlight, mark, exportSVG, exportPNG, exportCard, state };
    let onKey = null;
    if (opts.keys) {
      onKey = function (e) {
        if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
        if (e.key === "+" || e.key === "=") zoomBy(1.15);
        else if (e.key === "-") zoomBy(1 / 1.15);
        else if (e.key === "0") resetView();
        else if (e.key === "Escape") clearFocus();
      };
      global.addEventListener("keydown", onKey);
    }
    api.destroy = function () {
      global.removeEventListener("mousemove", onMove);
      global.removeEventListener("mouseup", onUp);
      if (onKey) global.removeEventListener("keydown", onKey);
    };
    return api;
  }

  global.HisnViewer = { init: init };
})(typeof window !== "undefined" ? window : this);

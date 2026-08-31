/* Builds the review panel and wires it to the viewer. Plain browser script with
   no modules, so the same code runs inside a generated file and inside the demo.
   Selecting a finding lights the components and flows it concerns. */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function summary(counts, coverage) {
    const bits = [];
    if (counts.high) bits.push(counts.high + " high");
    if (counts.medium) bits.push(counts.medium + " medium");
    if (counts.low) bits.push(counts.low + " low");
    const found = bits.length ? bits.join(", ") : "nothing to flag";
    let out = found + "  |  controls named on " + coverage.named + "% of elements";
    if (coverage.framework) out += "  |  " + coverage.framework.label + " " + coverage.framework.percent + "%";
    return out;
  }

  // the framework checklist, shown under the findings
  function coverageBlock(coverage) {
    const fc = coverage && coverage.framework;
    if (!fc) return "";
    let html = '<div class="hn-cover"><div class="hn-cover-h">' + esc(fc.label) +
      ": " + fc.addressed.length + " of " + fc.expected + " areas addressed</div>";
    for (const a of fc.addressed) {
      html += '<div class="hn-cover-row"><span class="hn-tick hn-yes"></span><span class="hn-cid">' +
        esc(a.id) + '</span><span class="hn-ct">' + esc(a.title) + "</span></div>";
    }
    for (const m of fc.missing) {
      html += '<div class="hn-cover-row"><span class="hn-tick hn-no"></span><span class="hn-cid">' +
        esc(m.id) + '</span><span class="hn-ct">' + esc(m.title) + "</span></div>";
    }
    html += "</div>";
    return html;
  }

  // container: the element to fill. review: { findings, counts, coverage }.
  // api: a viewer returned by HisnViewer.init.
  function render(container, review, api) {
    const f = review.findings || [];
    const counts = review.counts || { high: 0, medium: 0, low: 0 };
    const coverage = review.coverage || { named: 0 };
    const open = container.getAttribute("data-open") === "1";

    let html =
      '<div class="hn-review-head" role="button" tabindex="0">' +
      '<span class="hn-review-title">Review</span>' +
      '<span class="hn-review-sum">' + esc(summary(counts, coverage)) + "</span>" +
      '<span style="flex:1"></span>' +
      '<span class="hn-pill">' + (open ? "hide" : "show") + "</span>" +
      "</div>";

    if (!f.length) {
      html += '<div class="hn-review-list"><div class="hn-clean">No gaps found by the rules Hisn checks. That means the blueprint names a control everywhere these rules look, not that any control is implemented.</div>' + coverageBlock(coverage) + "</div>";
    } else {
      html += '<div class="hn-review-list">';
      for (const item of f) {
        html +=
          '<div class="hn-finding" data-finding="' + esc(item.id) + '">' +
          '<span class="hn-sev hn-sev-' + esc(item.severity) + '"></span>' +
          '<div class="hn-finding-body">' +
          '<div class="hn-finding-t">' + esc(item.title) + "</div>" +
          '<div class="hn-finding-d">' + esc(item.detail) + "</div>" +
          '<div class="hn-finding-f">' + esc(item.fix) + "</div>" +
          "</div></div>";
      }
      html += coverageBlock(coverage) + "</div>";
    }
    container.innerHTML = html;
    container.setAttribute("data-open", open ? "1" : "0");

    const head = container.querySelector(".hn-review-head");
    const toggle = function () {
      const isOpen = container.getAttribute("data-open") === "1";
      container.setAttribute("data-open", isOpen ? "0" : "1");
      const pill = container.querySelector(".hn-pill");
      if (pill) pill.textContent = isOpen ? "show" : "hide";
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    const byId = {};
    f.forEach(function (item) { byId[item.id] = item; });
    container.querySelectorAll(".hn-finding").forEach(function (el) {
      el.addEventListener("click", function () {
        const item = byId[el.getAttribute("data-finding")];
        if (!item || !api) return;
        const already = el.classList.contains("hn-picked");
        container.querySelectorAll(".hn-picked").forEach(function (x) { x.classList.remove("hn-picked"); });
        if (already) { api.clearFocus(); return; }
        el.classList.add("hn-picked");
        api.highlight(item.components, item.flows);
      });
    });
  }

  // every element any finding touches, so the drawing can mark them at rest
  function flagged(review) {
    const components = new Set(), flows = new Set();
    (review.findings || []).forEach(function (f) {
      (f.components || []).forEach(function (c) { components.add(c); });
      (f.flows || []).forEach(function (x) { flows.add(x); });
    });
    return { components: [...components], flows: [...flows] };
  }

  global.HisnReview = { render: render, flagged: flagged, summary: summary };
})(typeof window !== "undefined" ? window : this);

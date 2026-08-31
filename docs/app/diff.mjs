// Compare two revisions of a blueprint.
//
// The useful question about an architecture change is not only what moved, it is
// whether the change weakened the design. This module reports both: a structural
// diff of zones, components, and flows, and a posture read that separates
// regressions from improvements. A control removed, a zone made less trusted, a
// component moved somewhere less trusted, a flow carrying more sensitive data than
// it did before, and any review finding that did not exist in the earlier revision
// are all regressions. The reverse are improvements.
//
// It also builds a union of the two revisions, marking every element as added,
// removed, changed, or unchanged, so the difference can be drawn.

import { TRUST_RANK } from "./parse.mjs";
import { check } from "./checks.mjs";

const DATA_RANK = { public: 0, internal: 1, pii: 2, chd: 3, secret: 4 };
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const flowKey = (f) => f.from + "\u0000" + f.to + "\u0000" + (f.label || "");
const byId = (list) => {
  const m = {};
  list.forEach((x) => (m[x.id] = x));
  return m;
};
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Findings move as flows are added and removed, so compare them by what they are
// about rather than by the flow index they happened to land on.
function findingKeys(ir) {
  const keys = new Set();
  const r = check(ir);
  for (const f of r.findings) {
    const edges = (f.flows || [])
      .map((id) => ir.flows[Number(String(id).slice(1))])
      .filter(Boolean)
      .map((x) => x.from + ">" + x.to)
      .sort();
    keys.add([f.rule, (f.components || []).slice().sort().join("+"), edges.join("+")].join("|"));
  }
  return { keys, findings: r.findings, counts: r.counts };
}

export function unionIR(before, after) {
  const zonesB = byId(before.zones), zonesA = byId(after.zones);
  const zones = after.zones.map((z) => ({ ...z, status: zonesB[z.id] ? (zonesB[z.id].trust !== z.trust || zonesB[z.id].label !== z.label ? "changed" : "same") : "added" }));
  for (const z of before.zones) if (!zonesA[z.id]) zones.push({ ...z, status: "removed" });

  const compsB = byId(before.components), compsA = byId(after.components);
  const components = after.components.map((c) => {
    const b = compsB[c.id];
    if (!b) return { ...c, status: "added" };
    const changed = b.zone !== c.zone || b.type !== c.type || b.label !== c.label || !sameList(b.controls, c.controls);
    return { ...c, status: changed ? "changed" : "same" };
  });
  for (const c of before.components) if (!compsA[c.id]) components.push({ ...c, status: "removed" });

  const flowsB = {}, flowsA = {};
  before.flows.forEach((f) => (flowsB[flowKey(f)] = f));
  after.flows.forEach((f) => (flowsA[flowKey(f)] = f));
  const flows = after.flows.map((f) => {
    const b = flowsB[flowKey(f)];
    if (!b) return { ...f, status: "added" };
    const changed = b.data !== f.data || !sameList(b.controls, f.controls);
    return { ...f, status: changed ? "changed" : "same" };
  });
  for (const f of before.flows) if (!flowsA[flowKey(f)]) flows.push({ ...f, status: "removed" });

  return { title: after.title || before.title, framework: after.framework || before.framework, zones, components, flows };
}

export function diffBlueprints(before, after) {
  const union = unionIR(before, after);
  // where each flow landed in the union, so a regression can point at it
  const flowIdOf = {};
  union.flows.forEach((f, i) => { flowIdOf[flowKey(f)] = "f" + i; });

  const regressions = [], improvements = [];
  let n = 0;
  const add = (list, rule, severity, title, detail, components, flows) => {
    list.push({ id: "d" + n++, rule, severity, title, detail, fix: "", components: components || [], flows: flows || [] });
  };

  const zonesB = byId(before.zones);
  for (const z of after.zones) {
    const b = zonesB[z.id];
    if (!b || b.trust === z.trust) continue;
    const moved = TRUST_RANK[z.trust] - TRUST_RANK[b.trust];
    if (moved < 0) {
      add(regressions, "zone-trust-lowered", "high", "A zone is less trusted than it was",
        `${z.label} moved from ${b.trust} to ${z.trust}, so everything in it now sits at a lower tier.`, [], []);
    } else {
      add(improvements, "zone-trust-raised", "low", "A zone is more trusted than it was",
        `${z.label} moved from ${b.trust} to ${z.trust}.`, [], []);
    }
  }

  const compsB = byId(before.components);
  const zoneTrust = (ir, id) => {
    const z = ir.zones.find((x) => x.id === id);
    return z ? TRUST_RANK[z.trust] : null;
  };
  for (const c of after.components) {
    const b = compsB[c.id];
    if (!b) continue;
    const lost = b.controls.filter((k) => !c.controls.includes(k));
    const gained = c.controls.filter((k) => !b.controls.includes(k));
    if (lost.length) {
      add(regressions, "control-removed", "medium", "A component lost a control",
        `${c.label} no longer names ${lost.join(", ")}.`, [c.id], []);
    }
    if (gained.length) {
      add(improvements, "control-added", "low", "A component names a new control",
        `${c.label} now names ${gained.join(", ")}.`, [c.id], []);
    }
    if (b.zone !== c.zone) {
      const rb = zoneTrust(before, b.zone), ra = zoneTrust(after, c.zone);
      if (rb !== null && ra !== null && ra < rb) {
        add(regressions, "component-less-trusted", "high", "A component moved to a less trusted zone",
          `${c.label} moved out of ${b.zone} into ${c.zone}, which sits at a lower tier.`, [c.id], []);
      } else {
        add(improvements, "component-moved", "low", "A component moved zone",
          `${c.label} moved from ${b.zone || "no zone"} to ${c.zone || "no zone"}.`, [c.id], []);
      }
    }
  }

  const flowsB = {};
  before.flows.forEach((f) => (flowsB[flowKey(f)] = f));
  for (const f of after.flows) {
    const b = flowsB[flowKey(f)];
    const fid = flowIdOf[flowKey(f)];
    if (!b) continue;
    const lost = b.controls.filter((k) => !f.controls.includes(k));
    const gained = f.controls.filter((k) => !b.controls.includes(k));
    if (lost.length) {
      add(regressions, "control-removed", "medium", "A flow lost a control",
        `The flow from ${f.from} to ${f.to} no longer names ${lost.join(", ")}.`, [f.from, f.to], [fid]);
    }
    if (gained.length) {
      add(improvements, "control-added", "low", "A flow names a new control",
        `The flow from ${f.from} to ${f.to} now names ${gained.join(", ")}.`, [f.from, f.to], [fid]);
    }
    if (b.data !== f.data) {
      const up = DATA_RANK[f.data] - DATA_RANK[b.data];
      if (up > 0) {
        add(regressions, "data-escalated", "medium", "A flow carries more sensitive data",
          `The flow from ${f.from} to ${f.to} changed from ${b.data} to ${f.data}.`, [f.from, f.to], [fid]);
      } else {
        add(regressions, "data-declassified", "medium", "A flow is marked less sensitive than before",
          `The flow from ${f.from} to ${f.to} changed from ${b.data} to ${f.data}. Check this is a correction rather than a relabel that hides the flow.`,
          [f.from, f.to], [fid]);
      }
    }
  }

  // any finding the earlier revision did not have
  const kb = findingKeys(before), ka = findingKeys(after);
  for (const f of ka.findings) {
    const edges = (f.flows || [])
      .map((id) => after.flows[Number(String(id).slice(1))])
      .filter(Boolean)
      .map((x) => x.from + ">" + x.to)
      .sort();
    const key = [f.rule, (f.components || []).slice().sort().join("+"), edges.join("+")].join("|");
    if (kb.keys.has(key)) continue;
    add(regressions, "new-finding", f.severity, "New: " + f.title, f.detail,
      f.components, (f.flows || []).map((id) => {
        const orig = after.flows[Number(String(id).slice(1))];
        return orig ? flowIdOf[flowKey(orig)] : null;
      }).filter(Boolean));
  }
  const resolved = kb.findings.filter((f) => {
    const edges = (f.flows || [])
      .map((id) => before.flows[Number(String(id).slice(1))])
      .filter(Boolean)
      .map((x) => x.from + ">" + x.to)
      .sort();
    return !ka.keys.has([f.rule, (f.components || []).slice().sort().join("+"), edges.join("+")].join("|"));
  });
  for (const f of resolved) {
    add(improvements, "finding-resolved", "low", "Resolved: " + f.title, f.detail, [], []);
  }

  regressions.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const counts = { high: 0, medium: 0, low: 0 };
  regressions.forEach((r) => counts[r.severity]++);

  const status = (list, kind) => list.filter((x) => x.status === kind).length;
  return {
    union,
    regressions,
    improvements,
    counts,
    summary: {
      zones: { added: status(union.zones, "added"), removed: status(union.zones, "removed"), changed: status(union.zones, "changed") },
      components: { added: status(union.components, "added"), removed: status(union.components, "removed"), changed: status(union.components, "changed") },
      flows: { added: status(union.flows, "added"), removed: status(union.flows, "removed"), changed: status(union.flows, "changed") },
      findingsBefore: kb.counts,
      findingsAfter: ka.counts,
    },
  };
}

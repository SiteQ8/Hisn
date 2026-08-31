// Review a blueprint rather than just draw it.
//
// A blueprint states an intended architecture, so the intent can be checked. This
// module reads the intermediate representation and reports where sensitive data
// moves without a named control, where a flow skips trust tiers, where a data
// store holding sensitive data names nothing that protects it, and where the
// design has no way to see what happened. It also builds a coverage view: which
// controls are named, and what each one covers.
//
// It is pure, so the same rules run in the command line and in the browser. It
// reasons about the blueprint, not about a running system: a clean report means
// the drawing names a control in every place these rules look, not that any
// control is implemented.

import { TRUST_RANK } from "./parse.mjs";
import { frameworkCoverage } from "./catalog.mjs";

const SENSITIVE = new Set(["chd", "secret"]);
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function label(map, id) {
  return map[id] ? map[id].label : id;
}

export function check(ir, options) {
  const findings = [];
  const zoneById = {};
  ir.zones.forEach((z) => (zoneById[z.id] = z));
  const compById = {};
  ir.components.forEach((c) => (compById[c.id] = c));

  const flows = ir.flows.map((f, i) => ({ ...f, id: "f" + i }));
  const rankOf = (id) => {
    const c = compById[id];
    if (!c || !c.zone) return null;
    const z = zoneById[c.zone];
    return z ? TRUST_RANK[z.trust] : null;
  };

  let n = 0;
  const add = (rule, severity, title, detail, fix, components, flowIds) => {
    findings.push({
      id: "k" + n++,
      rule,
      severity,
      title,
      detail,
      fix,
      components: components || [],
      flows: flowIds || [],
    });
  };

  // sensitive data moving with no named control
  for (const f of flows) {
    if (!f.controls.length && SENSITIVE.has(f.data)) {
      const what = f.data === "chd" ? "cardholder data" : "secret material";
      add(
        "sensitive-flow-uncontrolled",
        "high",
        "Sensitive data moves with no named control",
        `The flow from ${label(compById, f.from)} to ${label(compById, f.to)} carries ${what} and names no control.`,
        "Name the control that protects this path, such as the encryption in transit or key management requirement your framework uses.",
        [f.from, f.to],
        [f.id]
      );
    } else if (!f.controls.length && f.data === "pii") {
      add(
        "pii-flow-uncontrolled",
        "medium",
        "Personal data moves with no named control",
        `The flow from ${label(compById, f.from)} to ${label(compById, f.to)} carries personal data and names no control.`,
        "Name the control that covers this path, such as an access control or transmission requirement.",
        [f.from, f.to],
        [f.id]
      );
    }
  }

  // a flow that skips trust tiers on the way in.
  // Two cases are not a leap. A boundary device such as a gateway, firewall, or
  // proxy exists precisely to receive a crossing, so reaching one is the
  // controlled path rather than a way around it. And a person operating a device
  // is not a network hop, so a flow that starts at a user is left alone.
  const BOUNDARY_DEVICE = new Set(["gateway", "proxy", "firewall", "waf", "lb"]);
  for (const f of flows) {
    const a = rankOf(f.from), b = rankOf(f.to);
    if (a === null || b === null) continue;
    if (b - a < 2) continue;
    const target = compById[f.to], source = compById[f.from];
    if (target && BOUNDARY_DEVICE.has(target.type)) continue;
    if (source && source.type === "user") continue;
    add(
      "trust-leap",
      "high",
      "A flow skips a trust tier",
      `${label(compById, f.from)} reaches ${label(compById, f.to)} directly, crossing more than one trust level in a single step.`,
      "Route it through the tier in between, such as a gateway, proxy, or jump host, so the crossing has somewhere to be inspected.",
      [f.from, f.to],
      [f.id]
    );
  }

  // an ordinary crossing that still names nothing
  for (const f of flows) {
    if (f.controls.length) continue;
    if (SENSITIVE.has(f.data) || f.data === "pii") continue; // already reported above
    const ca = compById[f.from], cb = compById[f.to];
    if (!ca || !cb) continue;
    if ((ca.zone || "") === (cb.zone || "")) continue;
    add(
      "crossing-uncontrolled",
      "medium",
      "A boundary crossing names no control",
      `The flow from ${label(compById, f.from)} to ${label(compById, f.to)} leaves one zone and enters another without naming a control.`,
      "Name what governs the crossing, such as a firewall rule set, a boundary protection requirement, or an authorization control.",
      [f.from, f.to],
      [f.id]
    );
  }

  // a store holding sensitive data that names nothing
  const STORES = new Set(["db", "store", "queue"]);
  for (const c of ir.components) {
    if (!STORES.has(c.type) || c.controls.length) continue;
    const touching = flows.filter((f) => (f.from === c.id || f.to === c.id) && SENSITIVE.has(f.data));
    if (!touching.length) continue;
    add(
      "sensitive-store-uncontrolled",
      "high",
      "A store holds sensitive data and names no control",
      `${c.label} takes part in a flow carrying sensitive data but names no control of its own.`,
      "Name what protects the data at rest, such as an encryption, key management, or retention requirement.",
      [c.id],
      touching.map((f) => f.id)
    );
  }

  // nothing that can see what happened
  const hasSensitive = flows.some((f) => SENSITIVE.has(f.data) || f.data === "pii");
  const hasMonitoring = ir.components.some((c) => c.type === "siem" || c.type === "ids");
  if (hasSensitive && !hasMonitoring) {
    add(
      "no-monitoring",
      "medium",
      "Sensitive data moves with nothing watching",
      "The blueprint carries sensitive or personal data but shows no logging or monitoring component.",
      "Add the component that collects logs or detects anomalies, and connect the systems that feed it.",
      [],
      []
    );
  }

  // secrets with no key management shown
  const hasSecrets = flows.some((f) => f.data === "secret");
  const hasKeyMgmt = ir.components.some((c) => c.type === "hsm");
  if (hasSecrets && !hasKeyMgmt) {
    add(
      "no-key-management",
      "low",
      "Secret material moves with no key management shown",
      "The blueprint carries secret material but shows no key management component.",
      "If keys are managed somewhere, draw it, so the blueprint says where trust in those keys comes from.",
      [],
      []
    );
  }

  // components that sit outside every zone
  if (ir.zones.length) {
    for (const c of ir.components) {
      if (c.zone) continue;
      add(
        "unzoned-component",
        "medium",
        "A component sits in no zone",
        `${c.label} is not placed in a trust zone, so the blueprint says nothing about how much it is trusted.`,
        "Put it in a zone, or add the zone it belongs to.",
        [c.id],
        []
      );
    }
  }

  // components nothing connects to
  const touched = new Set();
  flows.forEach((f) => { touched.add(f.from); touched.add(f.to); });
  for (const c of ir.components) {
    if (touched.has(c.id)) continue;
    add(
      "orphan-component",
      "low",
      "A component has no flows",
      `Nothing flows to or from ${c.label}, so the blueprint does not say how it is used.`,
      "Draw the flows it takes part in, or remove it.",
      [c.id],
      []
    );
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const controlled = (x) => x.controls.length > 0;
  const sensitiveFlows = flows.filter((f) => SENSITIVE.has(f.data) || f.data === "pii");
  const controls = new Set();
  ir.components.forEach((c) => c.controls.forEach((x) => controls.add(x)));
  ir.flows.forEach((f) => f.controls.forEach((x) => controls.add(x)));
  const elements = ir.components.length + ir.flows.length;
  const controlledElements = ir.components.filter(controlled).length + ir.flows.filter(controlled).length;

  const counts = { high: 0, medium: 0, low: 0 };
  findings.forEach((f) => counts[f.severity]++);

  return {
    findings,
    counts,
    coverage: {
      components: { total: ir.components.length, controlled: ir.components.filter(controlled).length },
      flows: { total: ir.flows.length, controlled: ir.flows.filter(controlled).length },
      sensitiveFlows: { total: sensitiveFlows.length, controlled: sensitiveFlows.filter(controlled).length },
      controls: [...controls].sort(),
      named: elements ? Math.round((controlledElements / elements) * 100) : 0,
      framework: frameworkCoverage(ir, options && options.catalog),
    },
  };
}

// Which elements each named control covers, for an export or a review table.
export function matrix(ir) {
  const rows = new Map();
  const touch = (control) => {
    if (!rows.has(control)) rows.set(control, { control, components: [], flows: [] });
    return rows.get(control);
  };
  for (const c of ir.components) for (const k of c.controls) touch(k).components.push({ id: c.id, label: c.label });
  for (const f of ir.flows) for (const k of f.controls) touch(k).flows.push({ from: f.from, to: f.to, label: f.label, data: f.data });
  return [...rows.values()].sort((a, b) => a.control.localeCompare(b.control, "en", { numeric: true }));
}

export function matrixMarkdown(ir) {
  const rows = matrix(ir);
  const title = ir.title || "Blueprint";
  const out = [`# Control coverage: ${title}`, ""];
  if (ir.framework) out.push(`Framework: ${ir.framework}`, "");
  if (!rows.length) {
    out.push("No controls are named in this blueprint.");
    return out.join("\n") + "\n";
  }
  out.push("| Control | Components | Flows |", "| --- | --- | --- |");
  for (const r of rows) {
    const comps = r.components.map((c) => c.label).join(", ") || "";
    const flows = r.flows.map((f) => `${f.from} to ${f.to}`).join(", ") || "";
    out.push(`| ${r.control} | ${comps} | ${flows} |`);
  }
  out.push("", "Naming a control here records where it belongs in the design. It is not evidence that the control is implemented.");
  return out.join("\n") + "\n";
}

export function matrixCSV(ir) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ["control,kind,element,detail"];
  for (const r of matrix(ir)) {
    for (const c of r.components) lines.push([q(r.control), q("component"), q(c.id), q(c.label)].join(","));
    for (const f of r.flows) lines.push([q(r.control), q("flow"), q(f.from + " -> " + f.to), q(f.label || f.data)].join(","));
  }
  return lines.join("\n") + "\n";
}

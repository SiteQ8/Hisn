// Parse the Hisn source language into a typed intermediate representation.
//
// A Hisn source describes a security or compliance reference architecture as
// trust zones, the components inside them, and the data flows between those
// components. Every line is one statement, text after a hash is a comment, and
// labels are wrapped in double quotes. This module is pure, so the same code runs
// in Node for the command line and in the browser for the demo.
//
//   title PCI DSS cardholder data environment
//   framework pci
//   zone cde "Cardholder data environment" trust=secure
//   component db "Card vault" zone=cde type=db controls="Req 3.4"
//   flow app -> db "store token" data=chd controls="Req 3.4"

export const TRUST_LEVELS = ["untrusted", "dmz", "restricted", "secure", "management"];
export const TRUST_RANK = { untrusted: 0, dmz: 1, restricted: 2, secure: 3, management: 4 };
export const DATA_CLASSES = ["public", "internal", "pii", "chd", "secret"];
export const COMPONENT_TYPES = [
  "user", "internet", "firewall", "waf", "gateway", "proxy", "lb", "server",
  "app", "api", "db", "store", "queue", "hsm", "ids", "siem", "cloud", "service",
];

function tokenize(line) {
  const out = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    while (i < n && /\s/.test(line[i])) i++;
    if (i >= n) break;
    let tok = "";
    if (line[i] === '"') {
      i++;
      while (i < n && line[i] !== '"') { tok += line[i]; i++; }
      i++;
      out.push({ v: tok, quoted: true });
    } else {
      // a bareword, which may contain a quoted run so that controls="a, b" with
      // spaces survives as a single token
      while (i < n && !/\s/.test(line[i])) {
        if (line[i] === '"') {
          tok += line[i]; i++;
          while (i < n && line[i] !== '"') { tok += line[i]; i++; }
          if (i < n) { tok += line[i]; i++; }
        } else { tok += line[i]; i++; }
      }
      out.push({ v: tok, quoted: false });
    }
  }
  return out;
}

function opts(tokens) {
  // key=value tokens; a quoted value keeps its spaces (controls="Req 3.4, 4.1")
  const o = {};
  for (const t of tokens) {
    const s = t.v;
    const eq = s.indexOf("=");
    if (eq > 0 && !t.quoted) {
      const k = s.slice(0, eq).toLowerCase();
      o[k] = s.slice(eq + 1);
    }
  }
  return o;
}

// controls="a, b, c" arrives as one token whose value may still hold the quotes
function parseControls(raw) {
  if (!raw) return [];
  return raw.replace(/^"|"$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function parse(text) {
  const ir = {
    title: "",
    framework: "",
    zones: [],
    components: [],
    flows: [],
  };
  const zoneIds = new Set();
  const compIds = new Set();
  const lines = String(text).split("\n");

  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln].split("#")[0].trim();
    if (!line) continue;
    const tokens = tokenize(line);
    const head = tokens[0].v.toLowerCase();

    if (head === "title") {
      ir.title = line.slice(line.toLowerCase().indexOf("title") + 5).trim().replace(/^"|"$/g, "");
    } else if (head === "framework") {
      ir.framework = (tokens[1] ? tokens[1].v : "").toLowerCase();
    } else if (head === "zone") {
      if (tokens.length < 2) throw new Error(`line ${ln + 1}: zone needs an id`);
      const id = tokens[1].v;
      const label = tokens[2] && tokens[2].quoted ? tokens[2].v : id;
      const o = opts(tokens.slice(2));
      let trust = (o.trust || "restricted").toLowerCase();
      if (!TRUST_LEVELS.includes(trust)) trust = "restricted";
      if (!zoneIds.has(id)) { zoneIds.add(id); ir.zones.push({ id, label, trust }); }
      else { const z = ir.zones.find((x) => x.id === id); z.label = label; z.trust = trust; }
    } else if (head === "component" || head === "node") {
      if (tokens.length < 2) throw new Error(`line ${ln + 1}: component needs an id`);
      const id = tokens[1].v;
      const label = tokens[2] && tokens[2].quoted ? tokens[2].v : id;
      const o = opts(tokens.slice(2));
      let type = (o.type || "server").toLowerCase();
      if (!COMPONENT_TYPES.includes(type)) type = "server";
      const controls = parseControls(o.controls);
      const comp = { id, label, zone: o.zone || "", type, controls };
      if (!compIds.has(id)) { compIds.add(id); ir.components.push(comp); }
      else { Object.assign(ir.components.find((x) => x.id === id), comp); }
    } else if (head === "flow" || head === "edge" || tokens.some((t) => t.v === "->")) {
      const arrow = tokens.findIndex((t) => t.v === "->");
      if (arrow < 1) throw new Error(`line ${ln + 1}: a flow needs 'a -> b'`);
      const from = tokens[arrow - 1].v;
      const to = tokens[arrow + 1] ? tokens[arrow + 1].v : "";
      if (!to) throw new Error(`line ${ln + 1}: a flow needs a target after '->'`);
      const rest = tokens.slice(arrow + 2);
      const label = rest[0] && rest[0].quoted ? rest[0].v : "";
      const o = opts(rest);
      let data = (o.data || "internal").toLowerCase();
      if (!DATA_CLASSES.includes(data)) data = "internal";
      const controls = parseControls(o.controls);
      ir.flows.push({ from, to, label, data, controls });
    } else {
      throw new Error(`line ${ln + 1}: unknown statement '${tokens[0].v}'`);
    }
  }

  // components referenced by a flow but never declared become plain services
  for (const f of ir.flows) {
    for (const id of [f.from, f.to]) {
      if (!compIds.has(id)) { compIds.add(id); ir.components.push({ id, label: id, zone: "", type: "service", controls: [] }); }
    }
  }
  // a component in an undeclared zone is treated as unzoned
  for (const c of ir.components) if (c.zone && !zoneIds.has(c.zone)) c.zone = "";
  return ir;
}

export function validate(ir) {
  const problems = [];
  const ids = new Set(ir.components.map((c) => c.id));
  for (const f of ir.flows) {
    if (!ids.has(f.from)) problems.push(`flow references unknown component '${f.from}'`);
    if (!ids.has(f.to)) problems.push(`flow references unknown component '${f.to}'`);
  }
  return problems;
}

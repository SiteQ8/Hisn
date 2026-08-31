import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../docs/app/parse.mjs";
import { diffBlueprints, unionIR } from "../docs/app/diff.mjs";
import { buildDiff, templates } from "../docs/app/engine.mjs";

const base = `zone n "Net" trust=untrusted
zone s "Secure" trust=secure
component u "User" zone=n type=user
component g "Gateway" zone=s type=gateway controls="A 1"
component d "Store" zone=s type=db controls="A 2"
component log "Logs" zone=s type=siem controls="A 3"
flow u -> g "in" data=internal controls="A 1"
flow g -> d "write" data=chd controls="A 2"
flow d -> log "audit" data=internal controls="A 3"`;

const diff = (a, b) => diffBlueprints(parse(a), parse(b));
const rules = (a, b) => diff(a, b).regressions.map((r) => r.rule);

test("an unchanged revision reports nothing", () => {
  const d = diff(base, base);
  assert.equal(d.regressions.length, 0);
  assert.equal(d.improvements.length, 0);
  assert.equal(d.summary.components.changed, 0);
});

test("the union marks added, removed, and unchanged elements", () => {
  const after = base.replace('component log "Logs" zone=s type=siem controls="A 3"', 'component log "Logs" zone=s type=siem controls="A 3"\ncomponent x "New" zone=s type=app controls="A 4"');
  const u = unionIR(parse(base), parse(after));
  assert.equal(u.components.find((c) => c.id === "x").status, "added");
  assert.equal(u.components.find((c) => c.id === "d").status, "same");
  const removedSide = unionIR(parse(after), parse(base));
  assert.equal(removedSide.components.find((c) => c.id === "x").status, "removed");
});

test("removing a control from a component is a regression", () => {
  const after = base.replace('component d "Store" zone=s type=db controls="A 2"', 'component d "Store" zone=s type=db');
  const r = diff(base, after).regressions.find((x) => x.rule === "control-removed");
  assert.ok(r);
  assert.match(r.detail, /no longer names A 2/);
});

test("adding a control is an improvement", () => {
  const after = base.replace('component d "Store" zone=s type=db controls="A 2"', 'component d "Store" zone=s type=db controls="A 2, A 9"');
  assert.ok(diff(base, after).improvements.find((x) => x.rule === "control-added"));
  assert.equal(diff(base, after).regressions.filter((x) => x.rule === "control-removed").length, 0);
});

test("lowering the trust of a zone is a high regression", () => {
  const after = base.replace('zone s "Secure" trust=secure', 'zone s "Secure" trust=dmz');
  const r = diff(base, after).regressions.find((x) => x.rule === "zone-trust-lowered");
  assert.ok(r);
  assert.equal(r.severity, "high");
});

test("raising the trust of a zone is an improvement", () => {
  const after = base.replace('zone s "Secure" trust=secure', 'zone s "Secure" trust=management');
  assert.ok(diff(base, after).improvements.find((x) => x.rule === "zone-trust-raised"));
});

test("moving a component to a less trusted zone is a high regression", () => {
  const after = base.replace('component d "Store" zone=s type=db controls="A 2"', 'component d "Store" zone=n type=db controls="A 2"');
  const r = diff(base, after).regressions.find((x) => x.rule === "component-less-trusted");
  assert.ok(r);
  assert.equal(r.severity, "high");
});

test("a flow carrying more sensitive data than before is a regression", () => {
  const after = base.replace('flow d -> log "audit" data=internal controls="A 3"', 'flow d -> log "audit" data=secret controls="A 3"');
  assert.ok(rules(base, after).includes("data-escalated"));
});

test("a flow marked less sensitive is raised for checking", () => {
  const after = base.replace('flow g -> d "write" data=chd controls="A 2"', 'flow g -> d "write" data=internal controls="A 2"');
  const r = diff(base, after).regressions.find((x) => x.rule === "data-declassified");
  assert.ok(r);
  assert.match(r.detail, /hides the flow/);
});

test("a finding the earlier revision did not have is a regression", () => {
  const after = base.replace('component log "Logs" zone=s type=siem controls="A 3"',
    'component log "Logs" zone=s type=siem controls="A 3"\ncomponent out "Export" zone=n type=cloud')
    + '\nflow d -> out "export" data=chd';
  const newOnes = diff(base, after).regressions.filter((x) => x.rule === "new-finding");
  assert.ok(newOnes.length >= 1);
  assert.ok(newOnes.some((x) => /Sensitive data moves with no named control/.test(x.title)));
});

test("a finding that goes away is an improvement", () => {
  const weak = base.replace('flow g -> d "write" data=chd controls="A 2"', 'flow g -> d "write" data=chd');
  const resolved = diff(weak, base).improvements.filter((x) => x.rule === "finding-resolved");
  assert.ok(resolved.length >= 1);
});

test("a regression points at elements using union flow ids", () => {
  const after = base.replace('flow g -> d "write" data=chd controls="A 2"', 'flow g -> d "write" data=chd');
  const d = diff(base, after);
  const r = d.regressions.find((x) => x.flows.length);
  assert.ok(r);
  const idx = Number(r.flows[0].slice(1));
  assert.ok(d.union.flows[idx], "the id should resolve inside the union");
});

test("regressions are sorted with the highest severity first", () => {
  const after = base
    .replace('zone s "Secure" trust=secure', 'zone s "Secure" trust=dmz')
    .replace('component d "Store" zone=s type=db controls="A 2"', 'component d "Store" zone=s type=db');
  const rs = diff(base, after).regressions;
  const order = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < rs.length; i++) assert.ok(order[rs[i - 1].severity] <= order[rs[i].severity]);
});

test("buildDiff draws the union with change status attributes", () => {
  const after = base.replace('component log "Logs" zone=s type=siem controls="A 3"',
    'component log "Logs" zone=s type=siem controls="A 3"\ncomponent x "New" zone=s type=app controls="A 4"') + '\nflow x -> d "new path" data=internal controls="A 4"';
  const r = buildDiff(base, after);
  assert.match(r.svg, /data-status="added"/);
  assert.match(r.svg, /CHANGE/);
  assert.ok(r.model.components.find((c) => c.id === "x"));
});

test("comparing a reference blueprint with itself is clean", () => {
  const r = buildDiff(templates.hipaa, templates.hipaa);
  assert.equal(r.diff.regressions.length, 0);
  assert.equal(r.diff.counts.high, 0);
});

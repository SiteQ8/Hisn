import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../docs/app/parse.mjs";
import { check, matrix, matrixMarkdown, matrixCSV } from "../docs/app/checks.mjs";
import { templates, templateNames } from "../docs/app/templates.mjs";

const rules = (src) => check(parse(src)).findings.map((f) => f.rule);

test("sensitive data with no named control is a high finding", () => {
  const f = check(parse('component a "A" type=app\ncomponent b "B" type=app\nflow a -> b data=chd')).findings;
  const hit = f.find((x) => x.rule === "sensitive-flow-uncontrolled");
  assert.ok(hit);
  assert.equal(hit.severity, "high");
});

test("naming a control clears that finding", () => {
  assert.ok(!rules('component a "A"\ncomponent b "B"\nflow a -> b data=chd controls="Req 4.1"').includes("sensitive-flow-uncontrolled"));
});

test("personal data with no control is a medium finding", () => {
  const f = check(parse('component a "A"\ncomponent b "B"\nflow a -> b data=pii')).findings;
  assert.equal(f.find((x) => x.rule === "pii-flow-uncontrolled").severity, "medium");
});

test("a flow that skips a trust tier is flagged", () => {
  const src = `zone n "N" trust=untrusted
zone s "S" trust=secure
component a "A" zone=n type=app
component b "B" zone=s type=app
flow a -> b data=internal controls="X"`;
  assert.ok(rules(src).includes("trust-leap"));
});

test("reaching a boundary device is not a trust leap", () => {
  const src = `zone n "N" trust=untrusted
zone s "S" trust=secure
component a "A" zone=n type=app
component g "G" zone=s type=gateway
flow a -> g data=internal controls="X"`;
  assert.ok(!rules(src).includes("trust-leap"));
});

test("a person using a device is not a trust leap", () => {
  const src = `zone n "N" trust=untrusted
zone s "S" trust=secure
component u "U" zone=n type=user
component b "B" zone=s type=app
flow u -> b data=internal controls="X"`;
  assert.ok(!rules(src).includes("trust-leap"));
});

test("a store holding sensitive data with no control is flagged", () => {
  const src = `component a "A" type=app
component d "D" type=db
flow a -> d data=secret controls="X"`;
  assert.ok(rules(src).includes("sensitive-store-uncontrolled"));
});

test("sensitive data with no monitoring component is flagged once", () => {
  const src = `component a "A" type=app
component b "B" type=app
flow a -> b data=chd controls="X"`;
  assert.equal(rules(src).filter((r) => r === "no-monitoring").length, 1);
});

test("a monitoring component clears the monitoring finding", () => {
  const src = `component a "A" type=app
component b "B" type=app
component s "S" type=siem
flow a -> b data=chd controls="X"
flow a -> s data=internal controls="X"`;
  assert.ok(!rules(src).includes("no-monitoring"));
});

test("an unzoned component is flagged only when zones exist", () => {
  assert.ok(rules('zone z "Z" trust=secure\ncomponent a "A" zone=z\ncomponent b "B"\nflow a -> b').includes("unzoned-component"));
  assert.ok(!rules('component a "A"\ncomponent b "B"\nflow a -> b').includes("unzoned-component"));
});

test("a component with no flows is flagged", () => {
  assert.ok(rules('component a "A"\ncomponent b "B"\ncomponent lonely "L"\nflow a -> b').includes("orphan-component"));
});

test("findings are sorted with the highest severity first", () => {
  const f = check(parse(`zone n "N" trust=untrusted
zone s "S" trust=secure
component u "U" zone=n type=user
component a "A" zone=n type=app
component d "D" zone=s type=db
component orphan "O" zone=s type=server
flow u -> a data=chd
flow a -> d data=chd`)).findings;
  const order = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < f.length; i++) assert.ok(order[f[i - 1].severity] <= order[f[i].severity]);
});

test("every finding names a rule, a fix, and what it touches", () => {
  const f = check(parse('component a "A"\ncomponent b "B"\nflow a -> b data=chd')).findings;
  for (const x of f) {
    assert.ok(x.rule && x.title && x.detail && x.fix);
    assert.ok(Array.isArray(x.components) && Array.isArray(x.flows));
  }
});

test("finding flow ids match the ids the drawing uses", () => {
  const ir = parse('component a "A"\ncomponent b "B"\ncomponent c "C"\nflow a -> b data=internal controls="X"\nflow b -> c data=chd');
  const f = check(ir).findings.find((x) => x.rule === "sensitive-flow-uncontrolled");
  assert.deepEqual(f.flows, ["f1"]);
});

test("coverage counts what names a control", () => {
  const c = check(parse('component a "A" controls="X"\ncomponent b "B"\nflow a -> b controls="Y"')).coverage;
  assert.equal(c.components.total, 2);
  assert.equal(c.components.controlled, 1);
  assert.equal(c.flows.controlled, 1);
  assert.deepEqual(c.controls, ["X", "Y"]);
  assert.equal(c.named, 67);
});

test("every reference blueprint passes its own review", () => {
  for (const name of templateNames) {
    const r = check(parse(templates[name]));
    assert.equal(r.findings.length, 0, name + " should be clean but reported: " + r.findings.map((f) => f.rule).join(", "));
  }
});

test("the matrix lists what each control covers", () => {
  const ir = parse('component a "A" controls="Req 1"\ncomponent b "B"\nflow a -> b controls="Req 1, 2"');
  const rows = matrix(ir);
  const one = rows.find((r) => r.control === "Req 1");
  assert.equal(one.components.length, 1);
  assert.equal(one.flows.length, 1);
  assert.ok(rows.find((r) => r.control === "Req 2"));
});

test("the matrix exports as markdown and csv", () => {
  const ir = parse('component a "A" controls="Req 1"\ncomponent b "B"\nflow a -> b controls="Req 1"');
  const md = matrixMarkdown(ir);
  assert.match(md, /\| Control \|/);
  assert.match(md, /Req 1/);
  const csv = matrixCSV(ir);
  assert.match(csv, /^control,kind,element,detail/);
  assert.match(csv, /"Req 1","component"/);
});

test("a blueprint naming no controls yields an empty matrix", () => {
  assert.equal(matrix(parse('component a "A"\nflow a -> a')).length, 0);
  assert.match(matrixMarkdown(parse('component a "A"\nflow a -> a')), /No controls are named/);
});

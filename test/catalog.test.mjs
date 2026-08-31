import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../docs/app/parse.mjs";
import { catalogs, catalogNames, addresses, frameworkCoverage, readCatalog } from "../docs/app/catalog.mjs";
import { templates, templateNames } from "../docs/app/templates.mjs";
import { check } from "../docs/app/checks.mjs";

test("a catalog exists for every framework blueprint", () => {
  for (const name of templateNames) assert.ok(catalogs[name], name + " needs a catalog");
  assert.deepEqual(catalogNames.slice().sort(), templateNames.slice().sort());
});

test("every catalog entry has an id and a title", () => {
  for (const name of catalogNames) {
    assert.ok(catalogs[name].label && catalogs[name].note);
    assert.ok(catalogs[name].controls.length >= 5);
    for (const c of catalogs[name].controls) assert.ok(c.id && c.title);
  }
});

test("a more specific control addresses its family", () => {
  assert.ok(addresses("Req 3.4", "Req 3"));
  assert.ok(addresses("Req 1.3", "Req 1"));
  assert.ok(addresses("SR 5.2", "SR 5"));
  assert.ok(addresses("AC-3", "AC"));
  assert.ok(addresses("164.312(e)(1)", "164.312(e)"));
  assert.ok(addresses("800-207 3.1", "800-207"));
});

test("a neighbouring number does not address a family", () => {
  assert.ok(!addresses("Req 10.2", "Req 1"));
  assert.ok(!addresses("A.8.24", "A.8.2"));
  assert.ok(!addresses("Art. 32", "Art. 3"));
  assert.ok(!addresses("ACME-1", "AC"));
});

test("coverage reports what is addressed and what is missing", () => {
  const ir = parse('framework pci\ncomponent a "A" controls="Req 3.4"\nflow a -> a controls="Req 10.2"');
  const fc = frameworkCoverage(ir);
  assert.equal(fc.label, "PCI DSS");
  assert.ok(fc.addressed.find((x) => x.id === "Req 3"));
  assert.ok(fc.addressed.find((x) => x.id === "Req 10"));
  assert.ok(fc.missing.find((x) => x.id === "Req 1"));
  assert.equal(fc.addressed.length + fc.missing.length, fc.expected);
});

test("coverage records which control addressed each entry", () => {
  const ir = parse('framework pci\ncomponent a "A" controls="Req 3.4, 3.5"\nflow a -> a');
  const entry = frameworkCoverage(ir).addressed.find((x) => x.id === "Req 3");
  assert.deepEqual(entry.by, ["Req 3.4", "Req 3.5"]);
});

test("an unknown or absent framework has no coverage", () => {
  assert.equal(frameworkCoverage(parse('component a "A"\nflow a -> a')), null);
  assert.equal(frameworkCoverage(parse('framework nonesuch\ncomponent a "A"\nflow a -> a')), null);
});

test("check carries the framework coverage", () => {
  const r = check(parse(templates.pci));
  assert.ok(r.coverage.framework);
  assert.equal(r.coverage.framework.id, "pci");
});

test("every reference blueprint addresses its whole catalog", () => {
  for (const name of templateNames) {
    const fc = frameworkCoverage(parse(templates[name]));
    assert.equal(fc.missing.length, 0,
      name + " leaves these unaddressed: " + fc.missing.map((m) => m.id).join(", "));
  }
});

test("a custom catalog is read and validated", () => {
  const cat = readCatalog('{"label":"Team","controls":[{"id":"SEC-1","title":"Segmentation"}]}');
  assert.equal(cat.label, "Team");
  assert.equal(cat.controls[0].id, "SEC-1");
  assert.ok(cat.note, "a default note is supplied");
});

test("a control with no title falls back to its id", () => {
  assert.equal(readCatalog({ controls: [{ id: "SEC-1" }] }).controls[0].title, "SEC-1");
});

test("a bad catalog explains what is wrong", () => {
  assert.throws(() => readCatalog("{}"), /controls array/);
  assert.throws(() => readCatalog({ controls: [] }), /controls array/);
  assert.throws(() => readCatalog({ controls: [{ title: "no id" }] }), /needs an id/);
  assert.throws(() => readCatalog({ controls: [{ id: "A" }, { id: "A" }] }), /appears twice/);
});

test("a custom catalog is used instead of the framework one", () => {
  const ir = parse('framework pci\ncomponent a "A" controls="SEC-1"\nflow a -> a controls="Req 3.4"');
  const fc = frameworkCoverage(ir, { label: "Team", controls: [{ id: "SEC-1", title: "One" }, { id: "SEC-2", title: "Two" }] });
  assert.equal(fc.label, "Team");
  assert.equal(fc.id, "custom");
  assert.equal(fc.addressed.length, 1);
  assert.equal(fc.missing[0].id, "SEC-2");
});

test("check accepts a custom catalog", () => {
  const r = check(parse('component a "A" controls="SEC-1"\nflow a -> a'), { catalog: { controls: [{ id: "SEC-1", title: "One" }] } });
  assert.equal(r.coverage.framework.percent, 100);
});

test("a blueprint with no framework still gets coverage from a custom catalog", () => {
  const r = check(parse('component a "A" controls="X"\nflow a -> a'), { catalog: { controls: [{ id: "Y", title: "Why" }] } });
  assert.equal(r.coverage.framework.missing.length, 1);
});

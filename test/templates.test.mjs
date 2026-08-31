import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, validate } from "../docs/app/parse.mjs";
import { templates, templateNames, templateLabels } from "../docs/app/templates.mjs";

test("the eight framework blueprints exist", () => {
  assert.deepEqual(
    templateNames.slice().sort(),
    ["cis", "gdpr", "hipaa", "iec62443", "iso27001", "nca", "nis2", "pci", "soc2", "swift", "zerotrust"]
  );
});

test("every blueprint has a short label for a picker", () => {
  for (const name of templateNames) assert.ok(templateLabels[name], name + " needs a label");
});

test("each blueprint parses cleanly", () => {
  for (const name of templateNames) {
    assert.deepEqual(validate(parse(templates[name])), [], name + " should validate");
  }
});

test("blueprints carry their framework control references", () => {
  assert.match(templates.pci, /Req /);
  assert.match(templates.swift, /CSCF /);
  assert.match(templates.hipaa, /164\.312/);
  assert.match(templates.gdpr, /Art\. /);
  assert.match(templates.soc2, /CC6\./);
  assert.match(templates.iso27001, /A\.8\./);
  assert.match(templates.iec62443, /SR /);
  assert.match(templates.nca, /ECC /);
  assert.match(templates.nis2, /Art\. 21/);
  assert.match(templates.cis, /CIS /);
});

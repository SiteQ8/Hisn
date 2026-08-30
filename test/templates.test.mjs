import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, validate } from "../docs/app/parse.mjs";
import { templates, templateNames } from "../docs/app/templates.mjs";

test("the three named blueprints exist", () => {
  assert.deepEqual(templateNames.sort(), ["pci", "swift", "zerotrust"]);
});

test("each blueprint parses cleanly", () => {
  for (const name of templateNames) {
    assert.deepEqual(validate(parse(templates[name])), [], name + " should validate");
  }
});

test("blueprints carry their framework control references", () => {
  assert.match(templates.pci, /Req /);
  assert.match(templates.swift, /CSCF /);
  assert.match(templates.zerotrust, /policy/i);
});

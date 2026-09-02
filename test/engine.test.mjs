import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { build, VERSION, templates, templateNames } from "../docs/app/engine.mjs";

test("version follows package.json", () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(VERSION, JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
});

test("build returns ir, model, svg, and a review", () => {
  const r = build('zone z "Z" trust=secure\ncomponent a "A" zone=z\nflow a -> a');
  assert.ok(r.ir && r.model && typeof r.svg === "string");
  assert.ok(Array.isArray(r.findings));
  assert.ok(r.counts && typeof r.counts.high === "number");
  assert.ok(r.coverage && typeof r.coverage.named === "number");
});

test("light and dark themes render different colors", () => {
  const dark = build('component a "A" type=db\nflow a -> a', "dark").svg;
  const light = build('component a "A" type=db\nflow a -> a', "light").svg;
  assert.notEqual(dark, light);
});

test("every template builds", () => {
  for (const name of templateNames) {
    const { model } = build(templates[name]);
    assert.ok(model.components.length >= 5, name + " should have components");
    assert.ok(model.flows.length >= 4, name + " should have flows");
  }
});

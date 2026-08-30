import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../docs/app/engine.mjs";

const src = `title Env
zone z "Z" trust=secure
component a "A" zone=z type=db
component b "B" zone=z type=app
flow a -> b "go" data=chd`;

test("svg has a band, components, and a flow", () => {
  const { svg } = build(src);
  assert.equal((svg.match(/class="hn-band"/g) || []).length, 1);
  assert.equal((svg.match(/class="hn-comp"/g) || []).length, 2);
  assert.equal((svg.match(/class="hn-flow"/g) || []).length, 1);
});

test("data attributes are present for the viewer", () => {
  const { svg } = build(src);
  assert.match(svg, /data-comp="a"/);
  assert.match(svg, /data-from="a" data-to="b"/);
  assert.match(svg, /data-trust="secure"/);
  assert.match(svg, /data-data="chd"/);
});

test("labels are escaped", () => {
  const { svg } = build('component x "a<b>c" type=app\nflow x -> x');
  assert.match(svg, /a&lt;b&gt;c/);
  assert.ok(!svg.includes("a<b>c"));
});

test("legend and title render", () => {
  const { svg } = build(src);
  assert.match(svg, />TRUST</);
  assert.match(svg, />DATA</);
  assert.match(svg, />Env</);
});

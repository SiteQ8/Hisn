import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../docs/app/parse.mjs";
import { layout } from "../docs/app/layout.mjs";

const src = `zone out "Out" trust=untrusted
zone secure "Secure" trust=secure
component u "User" zone=out type=user
component db "DB" zone=secure type=db
component app "App" zone=secure type=app
flow u -> app "in" data=chd
flow app -> db "store" data=chd`;

test("bands are ordered by trust from least to most trusted", () => {
  const m = layout(parse(src));
  const bands = m.bands.filter((b) => b.id);
  assert.equal(bands[0].trust, "untrusted");
  assert.equal(bands[1].trust, "secure");
  assert.ok(bands[0].x < bands[1].x);
});

test("unzoned components get a leading band", () => {
  const m = layout(parse("component lonely \"L\" type=app\nflow lonely -> lonely"));
  assert.equal(m.bands[0].id, "");
  assert.ok(m.bands[0].members.some((c) => c.id === "lonely"));
});

test("components sit inside their band", () => {
  const m = layout(parse(src));
  const band = m.bands.find((b) => b.id === "secure");
  for (const c of m.components.filter((x) => x.zone === "secure")) {
    assert.ok(c.x >= band.x && c.x + c.w <= band.x + band.w);
    assert.ok(c.y >= band.y);
  }
});

test("boundary flag marks flows that cross zones", () => {
  const m = layout(parse(src));
  const crossing = m.flows.find((f) => f.from === "u" && f.to === "app");
  const inside = m.flows.find((f) => f.from === "app" && f.to === "db");
  assert.equal(crossing.boundary, true);
  assert.equal(inside.boundary, false);
});

test("incident map lists a component's flows", () => {
  const m = layout(parse(src));
  assert.equal(m.incident.app.length, 2);
  assert.equal(m.incident.u.length, 1);
});

test("legend sets reflect what is used", () => {
  const m = layout(parse(src));
  assert.deepEqual(m.trustsUsed, ["untrusted", "secure"]);
  assert.ok(m.dataUsed.includes("chd"));
});

test("canvas has positive size", () => {
  const m = layout(parse(src));
  assert.ok(m.width > 0 && m.height > 0);
});

test("RL direction mirrors bands, components, and flows across the width", () => {
  const src = 'title t\nzone pub "Public" trust=untrusted\nzone core "Core" trust=restricted\ncomponent a "A" zone=pub\ncomponent b "B" zone=core\nflow a -> b "x" controls=SR1';
  const lr = layout(parse(src));
  const rl = layout(parse("direction RL\n" + src));
  assert.equal(rl.direction, "RL");
  assert.equal(rl.width, lr.width);
  const bandLr = lr.bands.find((b) => b.id === "pub"), bandRl = rl.bands.find((b) => b.id === "pub");
  assert.ok(Math.abs(bandRl.x - (lr.width - bandLr.x - bandLr.w)) < 0.01, "band mirrored");
  assert.ok(bandRl.x > rl.bands.find((b) => b.id === "core").x, "least trusted zone sits on the right");
  const cLr = lr.components.find((c) => c.id === "a"), cRl = rl.components.find((c) => c.id === "a");
  assert.ok(Math.abs(cRl.x - (lr.width - cLr.x - cLr.w)) < 0.01 && cRl.y === cLr.y, "component mirrored");
  assert.ok(Math.abs(rl.flows[0].mx - (lr.width - lr.flows[0].mx)) < 0.01, "flow label mirrored");
});

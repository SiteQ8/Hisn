import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, validate, TRUST_RANK } from "../docs/app/parse.mjs";

test("parses zones with trust levels", () => {
  const ir = parse('zone a "A" trust=untrusted\nzone b "B" trust=secure');
  assert.equal(ir.zones.length, 2);
  assert.equal(ir.zones[0].trust, "untrusted");
  assert.equal(ir.zones[1].trust, "secure");
});

test("zone trust defaults to restricted and bad values fall back", () => {
  const ir = parse('zone a "A"\nzone b "B" trust=nonsense');
  assert.equal(ir.zones[0].trust, "restricted");
  assert.equal(ir.zones[1].trust, "restricted");
});

test("parses components with type and zone", () => {
  const ir = parse('zone z "Z" trust=secure\ncomponent db "Vault" zone=z type=db');
  const c = ir.components[0];
  assert.equal(c.id, "db");
  assert.equal(c.label, "Vault");
  assert.equal(c.zone, "z");
  assert.equal(c.type, "db");
});

test("bad component type falls back to server", () => {
  const ir = parse('component x "X" type=wat');
  assert.equal(ir.components[0].type, "server");
});

test("controls with spaces survive tokenizing", () => {
  const ir = parse('component db "V" type=db controls="Req 3.4, 3.5, 4.1"');
  assert.deepEqual(ir.components[0].controls, ["Req 3.4", "3.5", "4.1"]);
});

test("parses flows with data classification and controls", () => {
  const ir = parse('flow a -> b "send" data=chd controls="Req 4.1"');
  const f = ir.flows[0];
  assert.equal(f.from, "a");
  assert.equal(f.to, "b");
  assert.equal(f.label, "send");
  assert.equal(f.data, "chd");
  assert.deepEqual(f.controls, ["Req 4.1"]);
});

test("bad data classification falls back to internal", () => {
  const ir = parse('flow a -> b data=secretsauce');
  assert.equal(ir.flows[0].data, "internal");
});

test("flow shorthand a -> b works", () => {
  const ir = parse('a -> b');
  assert.equal(ir.flows.length, 1);
  assert.equal(ir.flows[0].from, "a");
});

test("undeclared flow endpoints become service components", () => {
  const ir = parse('flow a -> b');
  assert.equal(ir.components.length, 2);
  assert.ok(ir.components.every((c) => c.type === "service"));
});

test("component in an undeclared zone becomes unzoned", () => {
  const ir = parse('component x "X" zone=ghost type=app');
  assert.equal(ir.components[0].zone, "");
});

test("title and framework are read", () => {
  const ir = parse('title My env\nframework pci');
  assert.equal(ir.title, "My env");
  assert.equal(ir.framework, "pci");
});

test("comments and blank lines are ignored", () => {
  const ir = parse('# a comment\n\nzone z "Z" trust=secure  # trailing\n');
  assert.equal(ir.zones.length, 1);
});

test("trust ranks order least to most trusted", () => {
  assert.ok(TRUST_RANK.untrusted < TRUST_RANK.dmz);
  assert.ok(TRUST_RANK.dmz < TRUST_RANK.secure);
  assert.ok(TRUST_RANK.secure < TRUST_RANK.management);
});

test("validate is clean for a well formed blueprint", () => {
  const ir = parse('zone z "Z" trust=secure\ncomponent a "A" zone=z\ncomponent b "B" zone=z\nflow a -> b');
  assert.deepEqual(validate(ir), []);
});

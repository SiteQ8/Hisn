import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const bin = new URL("../bin/hisn.mjs", import.meta.url).pathname;
const run = (args) => execFileSync("node", [bin, ...args], { encoding: "utf8" });

test("report writes a markdown review with summary, findings, coverage, zones, and a sign off", () => {
  const dir = mkdtempSync(join(tmpdir(), "hisn-"));
  const src = join(dir, "t.hisn");
  writeFileSync(src, 'title Test\nframework pci\nzone pub "Public" trust=untrusted\nzone cde "Cardholder data" trust=secure\ncomponent web "Web" zone=pub type=app\ncomponent db "Vault" zone=cde type=db controls="Req 3.4"\nflow web -> db "store" data=chd\n');
  const out = join(dir, "r.md");
  const log = run(["report", src, "-o", out]);
  assert.match(log, /wrote .*r\.md/);
  const md = readFileSync(out, "utf8");
  for (const h of ["# Blueprint review report: Test", "## Summary", "## Findings", "## Framework coverage", "## Zones", "## What this report means", "## Sign off"]) assert.ok(md.includes(h), h);
  assert.match(md, /\| high \|/, "an uncontrolled sensitive flow across trust levels is a high finding in the table");
  assert.ok(md.includes("| Cardholder data | secure | Vault |"), "zones table lists components");
});

test("report speaks arabic with --lang ar", () => {
  const dir = mkdtempSync(join(tmpdir(), "hisn-"));
  const src = join(dir, "t.hisn");
  writeFileSync(src, 'title اختبار\nzone a "عام" trust=untrusted\ncomponent u "مستخدم" zone=a type=user\n');
  const md = run(["report", src, "--lang", "ar"]);
  assert.ok(md.includes("# تقرير مراجعة المخطط: اختبار") && md.includes("## الاعتماد") && md.includes("غير موثوق"), "arabic headings and trust names");
});

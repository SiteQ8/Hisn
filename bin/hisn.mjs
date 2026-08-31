#!/usr/bin/env node
// The Hisn command line. Turn a blueprint source into a self contained interactive
// diagram, print a reference blueprint to start from, export a share image, or
// serve the browser demo.
import { readFileSync, writeFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve, basename } from "node:path";
import { createServer } from "node:http";

import { build, validate, templates, templateNames, templateLabels, matrixMarkdown, matrixCSV, catalogs, catalogNames } from "../docs/app/engine.mjs";
import { toHTML, toCard } from "./html.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const VERSION = "0.3.0";

function usage() {
  process.stdout.write(
`Hisn ${VERSION}
Diagram as code for security and compliance reference architectures.

Usage:
  hisn render <source> [-o out.html] [--theme dark|light]   build a blueprint
  hisn template <name> [-o file.hisn]                       print a reference blueprint
  hisn check <source> [--json] [--strict]                   review a blueprint for gaps
  hisn matrix <source> [-o table.md] [--csv]                what each named control covers
  hisn controls <framework>                                 what a framework expects a design to show
  hisn card <source> [-o card.svg] [--theme dark|light]     a 1200 by 630 share image
  hisn serve [--port 8400] [--open]                         run the browser demo
  hisn version

A blueprint source (a .hisn file):
  title My environment
  framework pci                            any of the framework names below
  zone cde "Cardholder data" trust=secure  untrusted dmz restricted secure management
  component db "Vault" zone=cde type=db controls="Req 3.4"
  flow app -> db "store" data=chd controls="Req 3.4"

Frameworks: ${templateNames.join(" ")}.
Data classes: public internal pii chd secret.
Component types: user internet firewall waf gateway proxy lb server app api db store queue hsm ids siem cloud service.

check exits 1 when a high finding is present and --strict is given, so it can
gate a pipeline.
`);
}

function argValue(args, name) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
}

function cmdRender(args) {
  const src = args[0];
  if (!src || src.startsWith("-")) { console.error("hisn: render needs a source file"); return 2; }
  if (!existsSync(src)) { console.error("hisn: no such file: " + src); return 2; }
  const theme = argValue(args, "--theme") === "light" ? "light" : "dark";
  let built;
  try { built = build(readFileSync(src, "utf8"), theme); }
  catch (e) { console.error("hisn: could not read the source: " + e.message); return 2; }
  for (const p of validate(built.ir)) console.error("warning: " + p);
  const html = toHTML(built.model, built.svg, { theme, review: { findings: built.findings, counts: built.counts, coverage: built.coverage } });
  const out = argValue(args, "-o") || argValue(args, "--output") ||
    join(dirname(resolve(src)), basename(src).replace(/\.[^.]+$/, "") + ".html");
  writeFileSync(out, html);
  const m = built.model;
  console.log("wrote " + out + "  (" + m.bands.filter((b) => b.id).length + " zones, " + m.components.length + " components, " + m.flows.length + " flows)");
  const c = built.counts;
  if (c.high + c.medium + c.low === 0) console.log("review: nothing to flag, controls named on " + built.coverage.named + "% of elements");
  else console.log("review: " + c.high + " high, " + c.medium + " medium, " + c.low + " low. Run 'hisn check' for the detail.");
  return 0;
}

function cmdTemplate(args) {
  const name = (args[0] || "").toLowerCase();
  if (!templates[name]) {
    console.error("hisn: unknown template '" + args[0] + "'. Try one of: " + templateNames.join(", "));
    return 2;
  }
  const out = argValue(args, "-o") || argValue(args, "--output");
  if (out) { writeFileSync(out, templates[name]); console.log("wrote " + out); }
  else process.stdout.write(templates[name] + "\n");
  return 0;
}

function cmdCard(args) {
  const src = args[0];
  if (!src || src.startsWith("-")) { console.error("hisn: card needs a source file"); return 2; }
  if (!existsSync(src)) { console.error("hisn: no such file: " + src); return 2; }
  const theme = argValue(args, "--theme") === "light" ? "light" : "dark";
  let built;
  try { built = build(readFileSync(src, "utf8"), theme); }
  catch (e) { console.error("hisn: could not read the source: " + e.message); return 2; }
  const card = toCard(built.model, built.svg, { theme });
  const out = argValue(args, "-o") || argValue(args, "--output") ||
    join(dirname(resolve(src)), basename(src).replace(/\.[^.]+$/, "") + "-card.svg");
  writeFileSync(out, card);
  console.log("wrote " + out + "  (1200 by 630 share card)");
  return 0;
}


function readSource(src) {
  if (!src || src.startsWith("-")) { console.error("hisn: this command needs a source file"); return null; }
  if (!existsSync(src)) { console.error("hisn: no such file: " + src); return null; }
  return readFileSync(src, "utf8");
}

function cmdCheck(args) {
  const text = readSource(args[0]);
  if (text === null) return 2;
  let built;
  try { built = build(text); }
  catch (e) { console.error("hisn: could not read the source: " + e.message); return 2; }

  const { findings, counts, coverage } = built;
  if (args.includes("--json")) {
    console.log(JSON.stringify({ title: built.ir.title, framework: built.ir.framework, counts, coverage, findings }, null, 2));
  } else {
    const title = built.ir.title || args[0];
    console.log(title + (built.ir.framework ? "  (" + built.ir.framework + ")" : ""));
    console.log("");
    if (!findings.length) {
      console.log("  nothing to flag");
    } else {
      for (const f of findings) {
        console.log("  " + (f.severity + "        ").slice(0, 7) + f.title);
        console.log("          " + f.detail);
        console.log("          fix: " + f.fix);
        console.log("");
      }
    }
    console.log("  " + counts.high + " high, " + counts.medium + " medium, " + counts.low + " low");
    console.log("  controls named on " + coverage.named + "% of elements: " +
      coverage.components.controlled + " of " + coverage.components.total + " components, " +
      coverage.flows.controlled + " of " + coverage.flows.total + " flows");
    console.log("  sensitive flows with a named control: " + coverage.sensitiveFlows.controlled + " of " + coverage.sensitiveFlows.total);
    if (coverage.controls.length) console.log("  controls referenced: " + coverage.controls.join(", "));

    const fc = coverage.framework;
    if (fc) {
      console.log("");
      console.log("  " + fc.label + " coverage: " + fc.percent + "% (" + fc.addressed.length + " of " + fc.expected + " areas addressed)");
      for (const a of fc.addressed) console.log("    yes  " + (a.id + "            ").slice(0, 14) + a.title);
      for (const m of fc.missing) console.log("    no   " + (m.id + "            ").slice(0, 14) + m.title);
    }
    console.log("");
    console.log("  Naming a control records where it belongs. It is not evidence that the control is implemented.");
  }
  if (args.includes("--strict") && counts.high > 0) return 1;
  return 0;
}

function cmdControls(args) {
  const name = (args[0] || "").toLowerCase();
  if (!catalogs[name]) {
    console.error("hisn: no catalog for '" + (args[0] || "") + "'. Try one of: " + catalogNames.join(", "));
    return 2;
  }
  const cat = catalogs[name];
  console.log(cat.label);
  console.log(cat.note);
  console.log("");
  for (const c of cat.controls) console.log("  " + (c.id + "              ").slice(0, 16) + c.title);
  console.log("");
  console.log("  A blueprint control addresses an entry when it starts with it, so Req 3.4 addresses Req 3.");
  console.log("  This is a subset chosen for what a drawing can show, not the whole framework.");
  return 0;
}

function cmdMatrix(args) {
  const text = readSource(args[0]);
  if (text === null) return 2;
  let built;
  try { built = build(text); }
  catch (e) { console.error("hisn: could not read the source: " + e.message); return 2; }
  const csv = args.includes("--csv");
  const body = csv ? matrixCSV(built.ir) : matrixMarkdown(built.ir);
  const out = argValue(args, "-o") || argValue(args, "--output");
  if (out) { writeFileSync(out, body); console.log("wrote " + out); }
  else process.stdout.write(body);
  return 0;
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".hisn": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

function cmdServe(args) {
  const docs = join(ROOT, "docs");
  const port = parseInt(argValue(args, "--port") || "8400", 10);
  const server = createServer(function (req, res) {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/" || p === "") p = "/index.html";
    const full = join(docs, p.replace(/^\/+/, ""));
    if (!full.startsWith(docs) || !existsSync(full) || !statSync(full).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(full).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    createReadStream(full).pipe(res);
  });
  server.listen(port, "127.0.0.1", function () {
    const url = "http://127.0.0.1:" + port + "/";
    console.log("Hisn demo at " + url + "  (Ctrl+C to stop)");
    if (args.includes("--open")) {
      import("node:child_process").then(function (cp) {
        const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
        try { cp.spawn(cmd, [url], { stdio: "ignore", detached: true }); } catch (e) {}
      });
    }
  });
  return 0;
}

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "render") return cmdRender(args);
  if (cmd === "template") return cmdTemplate(args);
  if (cmd === "card") return cmdCard(args);
  if (cmd === "check") return cmdCheck(args);
  if (cmd === "matrix") return cmdMatrix(args);
  if (cmd === "controls") return cmdControls(args);
  if (cmd === "serve") return cmdServe(args);
  if (cmd === "version" || cmd === "--version" || cmd === "-v") { console.log("hisn " + VERSION); return 0; }
  if (cmd === "help" || cmd === "--help" || cmd === "-h" || !cmd) { usage(); return 0; }
  console.error("hisn: unknown command '" + cmd + "'");
  usage();
  return 2;
}

const code = main();
if (code && code !== 0 && !process.argv.includes("serve")) process.exit(code);

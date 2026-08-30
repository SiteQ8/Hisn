#!/usr/bin/env node
// The Hisn command line. Turn a blueprint source into a self contained interactive
// diagram, print a reference blueprint to start from, export a share image, or
// serve the browser demo.
import { readFileSync, writeFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve, basename } from "node:path";
import { createServer } from "node:http";

import { build, validate, templates, templateNames } from "../docs/app/engine.mjs";
import { toHTML, toCard } from "./html.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const VERSION = "0.1.0";

function usage() {
  process.stdout.write(
`Hisn ${VERSION}
Diagram as code for security and compliance reference architectures.

Usage:
  hisn render <source> [-o out.html] [--theme dark|light]   build a blueprint
  hisn template <${templateNames.join("|")}> [-o file.hisn]      print a reference blueprint
  hisn card <source> [-o card.svg] [--theme dark|light]     a 1200 by 630 share image
  hisn serve [--port 8400] [--open]                         run the browser demo
  hisn version

A blueprint source (a .hisn file):
  title My environment
  framework pci                            pci, swift, or zerotrust
  zone cde "Cardholder data" trust=secure  untrusted dmz restricted secure management
  component db "Vault" zone=cde type=db controls="Req 3.4"
  flow app -> db "store" data=chd controls="Req 3.4"

Data classes: public internal pii chd secret.
Component types: user internet firewall waf gateway proxy lb server app api db store queue hsm ids siem cloud service.
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
  const html = toHTML(built.model, built.svg, { theme });
  const out = argValue(args, "-o") || argValue(args, "--output") ||
    join(dirname(resolve(src)), basename(src).replace(/\.[^.]+$/, "") + ".html");
  writeFileSync(out, html);
  const m = built.model;
  console.log("wrote " + out + "  (" + m.bands.filter((b) => b.id).length + " zones, " + m.components.length + " components, " + m.flows.length + " flows)");
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
  if (cmd === "serve") return cmdServe(args);
  if (cmd === "version" || cmd === "--version" || cmd === "-v") { console.log("hisn " + VERSION); return 0; }
  if (cmd === "help" || cmd === "--help" || cmd === "-h" || !cmd) { usage(); return 0; }
  console.error("hisn: unknown command '" + cmd + "'");
  usage();
  return 2;
}

const code = main();
if (code && code !== 0 && !process.argv.includes("serve")) process.exit(code);

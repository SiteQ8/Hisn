// The Hisn engine: parse a blueprint source into IR, lay it out as trust tiers,
// render SVG. Pure and browser safe, shared by the command line and the demo.
export { parse, validate, TRUST_LEVELS, DATA_CLASSES, COMPONENT_TYPES } from "./parse.mjs";
export { layout } from "./layout.mjs";
export { renderSVG } from "./render.mjs";
export { palette } from "./theme.mjs";
export { templates, templateNames, templateLabels } from "./templates.mjs";
export { check, matrix, matrixMarkdown, matrixCSV } from "./checks.mjs";
export { catalogs, catalogNames, frameworkCoverage, addresses, readCatalog } from "./catalog.mjs";
export { diffBlueprints, unionIR } from "./diff.mjs";

import { parse } from "./parse.mjs";
import { layout } from "./layout.mjs";
import { renderSVG } from "./render.mjs";
import { palette } from "./theme.mjs";
import { check } from "./checks.mjs";
import { diffBlueprints } from "./diff.mjs";

export const VERSION = "0.5.0";

// Compare two revisions and draw the difference.
export function buildDiff(beforeSource, afterSource, theme) {
  const before = parse(beforeSource);
  const after = parse(afterSource);
  const d = diffBlueprints(before, after);
  const model = layout(d.union);
  const svg = renderSVG(model, palette(theme === "light" ? "light" : "dark"), { diff: true });
  return { before, after, diff: d, model, svg };
}

export function build(source, theme, options) {
  const ir = parse(source);
  const model = layout(ir);
  const review = check(ir, options);
  return {
    ir,
    model,
    svg: renderSVG(model, palette(theme === "light" ? "light" : "dark")),
    findings: review.findings,
    counts: review.counts,
    coverage: review.coverage,
  };
}

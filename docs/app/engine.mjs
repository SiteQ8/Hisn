// The Hisn engine: parse a blueprint source into IR, lay it out as trust tiers,
// render SVG. Pure and browser safe, shared by the command line and the demo.
export { parse, validate, TRUST_LEVELS, DATA_CLASSES, COMPONENT_TYPES } from "./parse.mjs";
export { layout } from "./layout.mjs";
export { renderSVG } from "./render.mjs";
export { palette } from "./theme.mjs";
export { templates, templateNames } from "./templates.mjs";

import { parse } from "./parse.mjs";
import { layout } from "./layout.mjs";
import { renderSVG } from "./render.mjs";
import { palette } from "./theme.mjs";

export const VERSION = "0.1.0";

export function build(source, theme) {
  const ir = parse(source);
  const model = layout(ir);
  return { ir, model, svg: renderSVG(model, palette(theme === "light" ? "light" : "dark")) };
}

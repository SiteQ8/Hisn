// Literal colors for each theme, used both as CSS variable values for the
// interactive page and written as presentation attributes so a share image
// renders in any tool. Trust levels and data classifications each have their own
// color so the blueprint is readable at a glance.

const DARK = {
  bg: "#0e1320", panel: "#161f31", line: "#26314a", text: "#e8edf6", dim: "#93a1ba", accent: "#4bd6c8",
  compFill: "#1a2438", compStroke: "#3a4a6e", compText: "#eaf0f9",
  flowText: "#9aa8c4", flowBg: "#111a2b",
  trust: { untrusted: "#e5647d", dmz: "#e0913a", restricted: "#d4b83a", secure: "#46c07a", management: "#6f8dff" },
  data: { public: "#8aa0c0", internal: "#6b7ea6", pii: "#e0b13a", chd: "#e5647d", secret: "#a78bff" },
};
const LIGHT = {
  bg: "#f5f7fb", panel: "#ffffff", line: "#dbe3ef", text: "#17203a", dim: "#586a8e", accent: "#12a594",
  compFill: "#ffffff", compStroke: "#b7c4dc", compText: "#17203a",
  flowText: "#586a8e", flowBg: "#ffffff",
  trust: { untrusted: "#d6455f", dmz: "#c07a1a", restricted: "#a98d1a", secure: "#1a9e5f", management: "#3a5fe0" },
  data: { public: "#6a7fa0", internal: "#7f90ad", pii: "#b1841a", chd: "#d6455f", secret: "#7c5cff" },
};
export function palette(theme) { return theme === "light" ? LIGHT : DARK; }

export const TRUST_LABEL = {
  untrusted: "untrusted", dmz: "DMZ", restricted: "restricted", secure: "secure", management: "management",
};
export const DATA_LABEL = {
  public: "public", internal: "internal", pii: "PII", chd: "cardholder data", secret: "secret",
};

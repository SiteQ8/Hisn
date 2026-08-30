// Small line glyphs for component types, drawn inside an s by s box at (x, y).
// They are intentionally simple so they read at a small size next to the label.
// Each returns SVG using the given stroke color; fills stay open.

function g(inner, color) {
  return `<g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}

export function glyph(type, x, y, s, color) {
  const u = (v) => x + v * s;
  const w = (v) => y + v * s;
  switch (type) {
    case "user":
      return g(`<circle cx="${u(0.5)}" cy="${w(0.32)}" r="${s * 0.16}"/><path d="M${u(0.2)} ${w(0.86)} a${s*0.3} ${s*0.3} 0 0 1 ${s*0.6} 0"/>`, color);
    case "internet":
    case "cloud":
      return g(`<path d="M${u(0.24)} ${w(0.66)} a${s*0.16} ${s*0.16} 0 0 1 ${s*0.02} -${s*0.31} a${s*0.2} ${s*0.2} 0 0 1 ${s*0.38} -${s*0.02} a${s*0.15} ${s*0.15} 0 0 1 ${s*0.1} ${s*0.34} z"/>`, color);
    case "firewall":
      return g(`<rect x="${u(0.16)}" y="${w(0.2)}" width="${s*0.68}" height="${s*0.6}" rx="2"/><line x1="${u(0.16)}" y1="${w(0.4)}" x2="${u(0.84)}" y2="${w(0.4)}"/><line x1="${u(0.16)}" y1="${w(0.6)}" x2="${u(0.84)}" y2="${w(0.6)}"/><line x1="${u(0.4)}" y1="${w(0.2)}" x2="${u(0.4)}" y2="${w(0.4)}"/><line x1="${u(0.62)}" y1="${w(0.4)}" x2="${u(0.62)}" y2="${w(0.6)}"/><line x1="${u(0.4)}" y1="${w(0.6)}" x2="${u(0.4)}" y2="${w(0.8)}"/>`, color);
    case "waf":
    case "shield":
      return g(`<path d="M${u(0.5)} ${w(0.16)} L${u(0.82)} ${w(0.3)} V${w(0.55)} a${s*0.32} ${s*0.32} 0 0 1 ${-s*0.32} ${s*0.3} a${s*0.32} ${s*0.32} 0 0 1 ${-s*0.32} ${-s*0.3} V${w(0.3)} z"/>`, color);
    case "gateway":
      return g(`<path d="M${u(0.2)} ${w(0.8)} V${w(0.42)} a${s*0.3} ${s*0.3} 0 0 1 ${s*0.6} 0 V${w(0.8)}"/><line x1="${u(0.5)}" y1="${w(0.42)}" x2="${u(0.5)}" y2="${w(0.8)}"/>`, color);
    case "proxy":
      return g(`<line x1="${u(0.18)}" y1="${w(0.36)}" x2="${u(0.72)}" y2="${w(0.36)}"/><path d="M${u(0.6)} ${w(0.26)} L${u(0.74)} ${w(0.36)} L${u(0.6)} ${w(0.46)}"/><line x1="${u(0.82)}" y1="${w(0.64)}" x2="${u(0.28)}" y2="${w(0.64)}"/><path d="M${u(0.4)} ${w(0.54)} L${u(0.26)} ${w(0.64)} L${u(0.4)} ${w(0.74)}"/>`, color);
    case "lb":
      return g(`<circle cx="${u(0.5)}" cy="${w(0.24)}" r="${s*0.1}"/><circle cx="${u(0.24)}" cy="${w(0.78)}" r="${s*0.1}"/><circle cx="${u(0.76)}" cy="${w(0.78)}" r="${s*0.1}"/><path d="M${u(0.5)} ${w(0.34)} V${w(0.56)} M${u(0.5)} ${w(0.56)} C${u(0.5)} ${w(0.7)} ${u(0.3)} ${w(0.62)} ${u(0.26)} ${w(0.68)} M${u(0.5)} ${w(0.56)} C${u(0.5)} ${w(0.7)} ${u(0.7)} ${w(0.62)} ${u(0.74)} ${w(0.68)}"/>`, color);
    case "db":
    case "store":
      return g(`<ellipse cx="${u(0.5)}" cy="${w(0.26)}" rx="${s*0.3}" ry="${s*0.12}"/><path d="M${u(0.2)} ${w(0.26)} V${w(0.74)} a${s*0.3} ${s*0.12} 0 0 0 ${s*0.6} 0 V${w(0.26)}"/><path d="M${u(0.2)} ${w(0.5)} a${s*0.3} ${s*0.12} 0 0 0 ${s*0.6} 0"/>`, color);
    case "queue":
      return g(`<rect x="${u(0.16)}" y="${w(0.3)}" width="${s*0.16}" height="${s*0.4}"/><rect x="${u(0.42)}" y="${w(0.3)}" width="${s*0.16}" height="${s*0.4}"/><rect x="${u(0.68)}" y="${w(0.3)}" width="${s*0.16}" height="${s*0.4}"/>`, color);
    case "hsm":
      return g(`<rect x="${u(0.22)}" y="${w(0.44)}" width="${s*0.56}" height="${s*0.4}" rx="2"/><path d="M${u(0.32)} ${w(0.44)} V${w(0.32)} a${s*0.18} ${s*0.18} 0 0 1 ${s*0.36} 0 V${w(0.44)}"/><circle cx="${u(0.5)}" cy="${w(0.62)}" r="${s*0.06}"/>`, color);
    case "ids":
    case "siem":
      return g(`<path d="M${u(0.16)} ${w(0.5)} a${s*0.4} ${s*0.28} 0 0 1 ${s*0.68} 0 a${s*0.4} ${s*0.28} 0 0 1 ${-s*0.68} 0 z"/><circle cx="${u(0.5)}" cy="${w(0.5)}" r="${s*0.12}"/>`, color);
    case "app":
      return g(`<rect x="${u(0.16)}" y="${w(0.22)}" width="${s*0.68}" height="${s*0.56}" rx="2"/><line x1="${u(0.16)}" y1="${w(0.4)}" x2="${u(0.84)}" y2="${w(0.4)}"/><circle cx="${u(0.26)}" cy="${w(0.31)}" r="${s*0.03}"/>`, color);
    case "api":
      return g(`<path d="M${u(0.36)} ${w(0.24)} C${u(0.24)} ${w(0.24)} ${u(0.28)} ${w(0.5)} ${u(0.18)} ${w(0.5)} C${u(0.28)} ${w(0.5)} ${u(0.24)} ${w(0.76)} ${u(0.36)} ${w(0.76)}"/><path d="M${u(0.64)} ${w(0.24)} C${u(0.76)} ${w(0.24)} ${u(0.72)} ${w(0.5)} ${u(0.82)} ${w(0.5)} C${u(0.72)} ${w(0.5)} ${u(0.76)} ${w(0.76)} ${u(0.64)} ${w(0.76)}"/>`, color);
    case "server":
    default:
      return g(`<rect x="${u(0.18)}" y="${w(0.2)}" width="${s*0.64}" height="${s*0.26}" rx="2"/><rect x="${u(0.18)}" y="${w(0.54)}" width="${s*0.64}" height="${s*0.26}" rx="2"/><line x1="${u(0.28)}" y1="${w(0.33)}" x2="${u(0.28)}" y2="${w(0.33)}"/><circle cx="${u(0.7)}" cy="${w(0.33)}" r="${s*0.03}"/><circle cx="${u(0.7)}" cy="${w(0.67)}" r="${s*0.03}"/>`, color);
  }
}

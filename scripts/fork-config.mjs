// SPDX-License-Identifier: Apache-2.0
// kenbunshoku.config.json: everything a fork changes to make this extension its own, read and
// checked here. The build refuses a file with any problem (and says which); the extension's code
// reads the same file through src/config.ts, so the two never disagree.
//
//   name, shortName, description   the extension's names (manifest, popup header) and description
//   icons                          a folder of icon-16.png, icon-32.png, icon-48.png, icon-128.png
//   videoSites                     { "youtube": bool, "twitch": bool }: where it runs (at least one)
//   imageHosts                     hosts it may request: card pictures, the settings file, the
//                                  card-feature index (host permissions and the pages' connect-src)
//   settingsUrl                    https address of the settings file, or null: no fetch at all,
//                                  the bundled cdn/config.json only
//   outlineColor, outlineGlowColor optional: the hovered card's outline, a solid edge and the glow
//                                  around it, CSS colors (#hex, rgb()/rgba()/hsl()/hsla(), or a
//                                  color name); a card-back navy edge and a blue glow if absent
//   printedNumber                  how the number printed on a card is found: { "regex": "…" }
//                                  (its first capture group, matched on the card id), "catalog" (an
//                                  optional `printed` field on each catalog card), or "none"
//   geometric                      { "settings": path, "manifestSha256": hex } or null (stage off)
//   updateUrlPrefix                where "New version available" may link, or null (never shown)
//   projectUrl, runtimeUrl         the popup's two links; modelUrl, maintainerContactUrl: README's
//   packageName                    the release zip's name (`<packageName>-<version>.zip`)

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const CONFIG_PATH = join(ROOT, "kenbunshoku.config.json");
export const ICON_SIZES = [16, 32, 48, 128];

const KEYS = [
  "$comment", "name", "shortName", "description", "icons", "videoSites", "imageHosts", "settingsUrl", "outlineColor", "outlineGlowColor",
  "printedNumber", "geometric", "updateUrlPrefix", "projectUrl", "modelUrl", "runtimeUrl", "maintainerContactUrl", "packageName",
];
/** The CSS named colors (CSS Color 4), without `transparent` and `currentcolor`. */
const CSS_COLOR_NAMES = new Set(
  [
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue",
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson",
    "cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen",
    "darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet",
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro",
    "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred",
    "indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan",
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey",
    "lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid",
    "mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin",
    "navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen",
    "paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple",
    "red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver",
    "skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle",
    "tomato turquoise violet wheat white whitesmoke yellow yellowgreen",
  ]
    .join(" ")
    .split(" "),
);

/** A color function's arguments: "a, b, c" or "a, b, c, alpha", or "a b c" or "a b c / alpha"
 *  (ASCII spaces only), with which form it was; null for anything else (empty arguments, a
 *  wrong count, mixed forms). */
function colorArguments(inside) {
  const text = inside.replace(/^ +| +$/g, "");
  if (text.includes(",")) {
    if (text.includes("/")) return null;
    const parts = text.split(",").map((x) => x.replace(/^ +| +$/g, ""));
    return (parts.length === 3 || parts.length === 4) && parts.every((x) => x !== "" && !x.includes(" ")) ? { parts, comma: true } : null;
  }
  const [main, alpha, ...rest] = text.split("/");
  if (rest.length > 0) return null;
  const parts = main.replace(/^ +| +$/g, "").split(/ +/);
  if (parts.length !== 3 || parts.some((x) => x === "")) return null;
  if (alpha === undefined) return { parts, comma: false };
  const a = alpha.replace(/^ +| +$/g, "");
  return a === "" || a.includes(" ") ? null : { parts: [...parts, a], comma: false };
}

/**
 * Whether a value is a plain, visible CSS color: #hex (3, 4, 6 or 8 digits), rgb()/rgba()/
 * hsl()/hsla() holding only digits, ".", "%", "deg", "/", "," and ASCII spaces, or a named
 * color. Nothing else can get into the outline's style through it. Fully transparent colors
 * (alpha 0, `transparent`) are refused: the outline would not show.
 */
export function cssColorProblem(value) {
  const what = "outlineColor: a CSS color (#hex, rgb()/rgba()/hsl()/hsla() with plain numbers, or a color name)";
  const invisible = "outlineColor: a visible color (not transparent, alpha above 0)";
  if (typeof value !== "string") return what;
  const hex = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(value);
  if (hex) {
    const h = hex[1];
    return (h.length === 4 && h[3] === "0") || (h.length === 8 && h.slice(6) === "00") ? invisible : null;
  }
  const fn = /^(rgb|rgba|hsl|hsla)\(([0-9.,%/ deg]{1,60})\)$/.exec(value);
  if (fn) {
    const args = colorArguments(fn[2]);
    if (!args) return what;
    // A number has digits after any point ("1." is not one).
    const NUM = "(\\d+(\\.\\d+)?|\\.\\d+)";
    const plain = new RegExp(`^${NUM}%?$`); // a channel or an alpha: a number, or a percentage
    const hue = new RegExp(`^${NUM}(deg)?$`);
    const percent = new RegExp(`^${NUM}%$`);
    const [a, b, c, alpha] = args.parts;
    const rgb = fn[1].startsWith("rgb");
    // The comma form takes rgb channels all as numbers or all as percentages, never mixed.
    const mixed = rgb && args.comma && new Set([a, b, c].map((x) => x.endsWith("%"))).size > 1;
    const channelsOk = rgb ? !mixed && [a, b, c].every((x) => plain.test(x)) : hue.test(a) && percent.test(b) && percent.test(c);
    if (!channelsOk || (alpha !== undefined && !plain.test(alpha))) return what;
    return alpha !== undefined && Number.parseFloat(alpha) === 0 ? invisible : null;
  }
  if (/^[a-zA-Z]+$/.test(value)) {
    if (value.toLowerCase() === "transparent") return invisible;
    return CSS_COLOR_NAMES.has(value.toLowerCase()) ? null : what;
  }
  return what;
}

const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

function httpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** The problems of a parsed config, or [] when there is none. `root` resolves its paths (null:
 *  paths are not checked on disk). */
export function configProblems(c, root = ROOT) {
  const p = [];
  if (typeof c !== "object" || c === null || Array.isArray(c)) return ["not a JSON object"];
  for (const k of Object.keys(c)) if (!KEYS.includes(k)) p.push(`unknown key "${k}"`);
  const text = (k, max) => {
    if (typeof c[k] !== "string" || c[k].trim() === "" || c[k].length > max) p.push(`${k}: a text of 1 to ${max} characters`);
  };
  text("name", 45);
  text("shortName", 12);
  text("description", 132);
  if ("outlineGlowColor" in c) {
    const problem = cssColorProblem(c.outlineGlowColor);
    if (problem) p.push(problem.replace(/^outlineColor:/, "outlineGlowColor:"));
  }
  if ("outlineColor" in c) {
    const problem = cssColorProblem(c.outlineColor);
    if (problem) p.push(problem);
  }
  if (typeof c.icons !== "string" || c.icons === "") p.push("icons: a folder");
  else if (root) for (const s of ICON_SIZES) if (!existsSync(join(root, c.icons, `icon-${s}.png`))) p.push(`icons: ${c.icons}/icon-${s}.png is missing`);
  const sites = c.videoSites;
  if (typeof sites !== "object" || sites === null || typeof sites.youtube !== "boolean" || typeof sites.twitch !== "boolean" || Object.keys(sites).length !== 2) {
    p.push('videoSites: { "youtube": true|false, "twitch": true|false }');
  } else if (!sites.youtube && !sites.twitch) p.push("videoSites: at least one site");
  if (!Array.isArray(c.imageHosts) || c.imageHosts.some((h) => typeof h !== "string" || !HOST.test(h))) p.push("imageHosts: a list of host names (lowercase, no scheme)");
  if (c.settingsUrl !== null) {
    const url = httpsUrl(c.settingsUrl);
    if (!url) p.push("settingsUrl: an https:// address, or null");
    else if (Array.isArray(c.imageHosts) && !c.imageHosts.includes(url.hostname)) p.push(`settingsUrl: its host ${url.hostname} must be in imageHosts`);
  }
  const pn = c.printedNumber;
  if (pn === "catalog" || pn === "none") {
    // fine
  } else if (typeof pn === "object" && pn !== null && typeof pn.regex === "string" && Object.keys(pn).length === 1) {
    try {
      const groups = new RegExp(`${pn.regex}|`).exec("")?.length ?? 1;
      if (groups < 2) p.push("printedNumber.regex: needs a capture group (the printed number)");
    } catch (e) {
      p.push(`printedNumber.regex: ${e.message}`);
    }
  } else p.push('printedNumber: { "regex": "…" }, "catalog" or "none"');
  if (c.geometric !== null) {
    const g = c.geometric;
    if (typeof g !== "object" || g === null || typeof g.settings !== "string" || typeof g.manifestSha256 !== "string" || Object.keys(g).length !== 2) {
      p.push('geometric: { "settings": "<file>", "manifestSha256": "<64 hex>" }, or null');
    } else {
      if (!/^[0-9a-f]{64}$/.test(g.manifestSha256)) p.push("geometric.manifestSha256: 64 lowercase hex digits");
      if (root && !existsSync(join(root, g.settings))) p.push(`geometric.settings: ${g.settings} is missing`);
    }
  }
  if (c.updateUrlPrefix !== null && !httpsUrl(c.updateUrlPrefix)) p.push("updateUrlPrefix: an https:// address, or null");
  for (const k of ["projectUrl", "runtimeUrl"]) if (!httpsUrl(c[k])) p.push(`${k}: an https:// address`);
  for (const k of ["modelUrl", "maintainerContactUrl"]) if (c[k] !== null && !httpsUrl(c[k])) p.push(`${k}: an https:// address, or null`);
  if (typeof c.packageName !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(c.packageName)) p.push("packageName: lowercase letters, digits and hyphens");
  return p;
}

/** Read and check the config; throws with every problem listed. */
export function loadForkConfig(path = CONFIG_PATH, root = ROOT) {
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    throw new Error(`${path}: not readable JSON (${e.message})`);
  }
  const problems = configProblems(config, root);
  if (problems.length > 0) throw new Error(`${path}:\n  - ${problems.join("\n  - ")}`);
  return config;
}

/** Whether the geometric settings name their index on one of the config's image hosts (a
 *  release build may request nothing else); null when they do. */
export function geometricIndexProblem(geometric, config) {
  let url = null;
  try {
    url = new URL(geometric?.index?.path);
  } catch {
    url = null;
  }
  if (!url || url.protocol !== "https:" || !config.imageHosts.includes(url.hostname)) {
    return `index.path must be an https address on one of imageHosts (${config.imageHosts.join(", ") || "none"})`;
  }
  return null;
}

/** The manifest match patterns of the video sites the config turns on. */
export function videoSitePatterns(config) {
  return [
    ...(config.videoSites.youtube ? ["https://www.youtube.com/*"] : []),
    ...(config.videoSites.twitch ? ["https://www.twitch.tv/*"] : []),
  ];
}

/** The host permission patterns of the image hosts. */
export function imageHostPatterns(config) {
  return config.imageHosts.map((h) => `https://${h}/*`);
}

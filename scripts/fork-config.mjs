// SPDX-License-Identifier: Apache-2.0
// duelsight.config.json: everything a fork changes to make this extension its own, read and
// checked here. The build refuses a file with any problem (and says which); the extension's code
// reads the same file through src/config.ts, so the two never disagree.
//
//   name, shortName, description   the extension's names (manifest, popup header) and description
//   icons                          a folder of icon-16.png, icon-32.png, icon-48.png, icon-128.png
//   videoSites                     { "youtube": bool, "twitch": bool }: where it runs (at least one)
//   cdnBase                        the CDN and settings origin, written once (https://host, no
//                                  path), or null. When given, `imageHosts` is its host alone and
//                                  `settingsUrl` is `<cdnBase>/config.json`: both are derived by
//                                  loadForkConfig and must not be written in the file
//   imageHosts                     hosts it may request: card pictures and the settings file (host
//                                  permissions and the pages' connect-src). Written only when
//                                  there is no cdnBase (then `[]` for none)
//   settingsUrl                    https address of the settings file, or null: no fetch at all,
//                                  the bundled cdn/config.json only. Written only without cdnBase
//   outlineColor, outlineGlowColor optional: the hovered card's outline, a solid edge and the glow
//                                  around it, CSS colors (#hex, rgb()/rgba()/hsl()/hsla(), or a
//                                  color name); a navy edge and a blue glow if absent
//   printedNumber                  how the number printed on a card is found: { "regex": "…" }
//                                  (its first capture group, matched on the card id), "catalog" (an
//                                  optional `printed` field on each catalog card), or "none"
//   updateUrlPrefix                where "New version available" may link, or null (never shown)
//   projectUrl, runtimeUrl         the popup's two links; modelUrl, maintainerContactUrl: README's
//   packageName                    the release zip's name (`<packageName>-<version>.zip`)
//   firefoxAddonId                 optional: the Firefox add-on ID (`name@domain`, permanent once
//                                  listed on addons.mozilla.org); without it there is no Firefox build

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const CONFIG_PATH = join(ROOT, "duelsight.config.json");
export const ICON_SIZES = [16, 32, 48, 128];

const KEYS = [
  "$comment", "name", "shortName", "description", "icons", "videoSites", "cdnBase", "imageHosts", "settingsUrl", "outlineColor", "outlineGlowColor",
  "printedNumber", "updateUrlPrefix", "projectUrl", "modelUrl", "runtimeUrl", "maintainerContactUrl", "packageName", "firefoxAddonId",
];
/** A Firefox add-on ID in email form, as addons.mozilla.org takes it. */
export const FIREFOX_ADDON_ID = /^[a-zA-Z0-9._-]{1,64}@[a-zA-Z0-9._-]{1,128}$/;
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
  if (c.cdnBase !== null && c.cdnBase !== undefined) {
    const url = httpsUrl(c.cdnBase);
    if (!url || url.origin !== c.cdnBase || !HOST.test(url.hostname)) p.push("cdnBase: an https://host address with no path, or null");
    else if (!Array.isArray(c.imageHosts) || c.imageHosts.length !== 1 || c.imageHosts[0] !== url.hostname || c.settingsUrl !== `${c.cdnBase}/config.json`) {
      p.push("cdnBase: imageHosts and settingsUrl must be the ones it gives");
    }
  }
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
  if (c.updateUrlPrefix !== null && !httpsUrl(c.updateUrlPrefix)) p.push("updateUrlPrefix: an https:// address, or null");
  for (const k of ["projectUrl", "runtimeUrl"]) if (!httpsUrl(c[k])) p.push(`${k}: an https:// address`);
  for (const k of ["modelUrl", "maintainerContactUrl"]) if (c[k] !== null && !httpsUrl(c[k])) p.push(`${k}: an https:// address, or null`);
  if (typeof c.packageName !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(c.packageName)) p.push("packageName: lowercase letters, digits and hyphens");
  if (c.firefoxAddonId !== undefined && c.firefoxAddonId !== null && !(typeof c.firefoxAddonId === "string" && FIREFOX_ADDON_ID.test(c.firefoxAddonId))) {
    p.push("firefoxAddonId: name@domain (letters, digits, dot, hyphen, underscore), or null");
  }
  return p;
}

/** The config with what `cdnBase` gives filled in: `imageHosts` (its host) and `settingsUrl`
 *  (`<cdnBase>/config.json`). A file that writes either beside a `cdnBase` is a problem, not
 *  silently overridden. */
export function withCdnBase(raw) {
  if (typeof raw !== "object" || raw === null || raw.cdnBase === null || raw.cdnBase === undefined) return raw;
  const url = httpsUrl(raw.cdnBase);
  if (!url || url.origin !== raw.cdnBase) return raw; // configProblems says what is wrong
  const written = ["imageHosts", "settingsUrl"].filter((k) => k in raw);
  if (written.length > 0) return { ...raw, imageHosts: [], settingsUrl: null, cdnBaseConflict: written };
  return { ...raw, imageHosts: [url.hostname], settingsUrl: `${raw.cdnBase}/config.json` };
}

/** Read and check the config; throws with every problem listed. */
export function loadForkConfig(path = CONFIG_PATH, root = ROOT) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    throw new Error(`${path}: not readable JSON (${e.message})`);
  }
  const config = withCdnBase(raw);
  const problems = config?.cdnBaseConflict
    ? [`${config.cdnBaseConflict.join(" and ")}: not written beside cdnBase (it gives them)`]
    : configProblems(config, root);
  if (problems.length > 0) throw new Error(`${path}:\n  - ${problems.join("\n  - ")}`);
  return config;
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

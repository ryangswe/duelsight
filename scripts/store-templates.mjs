// SPDX-License-Identifier: Apache-2.0
// The Chrome Web Store images' layouts (scripts/store-assets.mjs renders them): four 1280×800
// screenshots, the 440×280 small promo tile and the 1400×560 marquee. Each is one HTML page with its
// captures passed in as data: URLs, so nothing is fetched. The copy says what the extension does and
// nothing more (docs/store-listing.md, "Rules for the description"); every image carries the
// unofficial-fan-project line.

export const SHOT = { width: 1280, height: 800 };
export const SMALL_TILE = { width: 440, height: 280 };
export const MARQUEE = { width: 1400, height: 560 };
export const DISCLAIMER = "Unofficial fan project, not affiliated with or endorsed by Konami.";

/** The screenshots, in listing order: what each shows and says. `capture` names the capture it uses. */
export const SCREENSHOTS = [
  { name: "1-hover", layout: "side", capture: "md-hover", title: "Hover a card to see it", lead: "A larger picture of the card beside it, with its name, type, stats and text. Master Duel, Dueling Book and paper tables, on YouTube and Twitch." },
  { name: "2-paper", layout: "side", capture: "paper-hover", title: "Paper tables too", lead: "Tournament streams with the camera above the table. It can miss a card or show a wrong one." },
  { name: "3-card-alone", layout: "side", capture: "paper-card-only", title: "Just the card, if you prefer", lead: "Switch card details off in the toolbar popup to see the enlarged card on its own." },
  { name: "4-popup", layout: "popup", capture: "popup", title: "Your settings, in the toolbar", lead: "Switch DuelSight off everywhere, choose the card size, show or hide the card details. No accounts, no tracking." },
];

/** The game's name never breaks at its hyphens. */
const GAME = '<span style="white-space:nowrap">Yu-Gi-Oh!</span>';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BASE_CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; }
body { position: relative; overflow: hidden; background: #0d0b16; color: #d9d4ea;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
.glow { position: absolute; inset: 0;
  background: radial-gradient(55% 85% at 88% 12%, rgba(139, 109, 230, 0.34), transparent 62%),
              radial-gradient(45% 60% at 6% 105%, rgba(59, 42, 120, 0.45), transparent 60%),
              linear-gradient(180deg, #15122a 0%, #0d0b16 100%); }
.brand { position: absolute; display: flex; align-items: center; font-weight: 700; color: #f4f1fb; }
.brand img { display: block; border-radius: 22%; box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.35); }
h1, p { margin: 0; }
h1 { font-weight: 800; letter-spacing: -0.025em; line-height: 1.05; color: #f4f1fb; }
.lead { color: #a9a2c3; line-height: 1.4; }
.note { position: absolute; color: #7f789a; }
.shot { position: absolute; overflow: hidden; border-radius: 14px; background: #000;
  box-shadow: 0 26px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(167, 139, 250, 0.3); }
.shot img { display: block; }
`;

function page(size, css, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${BASE_CSS}
body { width: ${size.width}px; height: ${size.height}px; }
${css}</style></head><body><div class="glow"></div>${body}</body></html>`;
}

function brand(icon, px, left, top, gap) {
  return `<div class="brand" style="left:${left}px;top:${top}px;font-size:${px}px;gap:${gap}px"><img src="${icon}" alt="" style="width:${Math.round(px * 1.65)}px;height:${Math.round(px * 1.65)}px">DuelSight</div>`;
}

/** The fitted size of a w×h picture inside a box, keeping its shape. */
export function fit(w, h, maxW, maxH) {
  const k = Math.min(maxW / w, maxH / h);
  return { width: Math.round(w * k), height: Math.round(h * k), k };
}

/** A hover, or the popup: text on the left, the capture on the right at its own shape. */
export function sideShot({ icon, title, lead, image, imageSize, maxW = 740, maxH = 640 }) {
  const f = fit(imageSize.width, imageSize.height, maxW, maxH);
  return page(SHOT, `
.head { position: absolute; left: 56px; top: 50%; width: ${1280 - 56 - 56 - 48 - f.width}px; transform: translateY(-50%); }
h1 { font-size: 46px; } .lead { margin-top: 18px; font-size: 22px; }
.shot { right: 56px; top: 50%; transform: translateY(-50%); width: ${f.width}px; height: ${f.height}px; }
.shot img { width: 100%; height: 100%; }
.note { left: 56px; bottom: 36px; font-size: 15px; }`,
  `${brand(icon, 24, 56, 44, 12)}
<div class="head"><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p></div>
<div class="shot"><img src="${image}" alt=""></div>
<p class="note">${esc(DISCLAIMER)}</p>`);
}

/** A window onto part of a capture: `crop` (capture px) shown in a box of w×h. */
function cropShot(image, imageSize, crop, box) {
  const k = box.width / crop.width;
  return `<div class="shot" style="left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px">
<img src="${image}" alt="" style="position:absolute;width:${imageSize.width * k}px;height:${imageSize.height * k}px;left:${-crop.x * k}px;top:${-crop.y * k}px"></div>`;
}

/** The part of a capture around its tooltip, at the shape w:h, kept inside the capture. */
export function cropAround(rect, imageSize, aspect, margin = 0.12) {
  let width = Math.min(imageSize.width, rect.width * (1 + 2 * margin));
  let height = width / aspect;
  if (height < rect.height * (1 + 2 * margin)) { height = Math.min(imageSize.height, rect.height * (1 + 2 * margin)); width = height * aspect; }
  if (width > imageSize.width) { width = imageSize.width; height = width / aspect; }
  if (height > imageSize.height) { height = imageSize.height; width = height * aspect; }
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const x = Math.max(0, Math.min(imageSize.width - width, cx - width / 2));
  const y = Math.max(0, Math.min(imageSize.height - height, cy - height / 2));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

/** 440×280: the name, one line, and the enlarged card. */
export function smallTile({ icon, image, imageSize, tooltip }) {
  const box = { left: 244, top: 22, width: 176, height: 236 };
  const crop = cropAround(tooltip, imageSize, box.width / box.height, 0.06);
  return page(SMALL_TILE, `
.text { position: absolute; left: 22px; top: 72px; width: 206px; }
h1 { font-size: 25px; }
.lead { margin-top: 12px; font-size: 13px; }
.note { left: 22px; bottom: 14px; width: 210px; font-size: 9.5px; line-height: 1.3; }
.shot { border-radius: 10px; }`,
  `${brand(icon, 18, 22, 20, 9)}
<div class="text"><h1>Hover a ${GAME} card to see it</h1>
<p class="lead">YouTube and Twitch. Free.</p></div>
${cropShot(image, imageSize, crop, box)}
<p class="note">${esc(DISCLAIMER)}</p>`);
}

/** 1400×560: the name large, the line, and a hover. */
export function marquee({ icon, image, imageSize, tooltip }) {
  const box = { left: 760, top: 28, width: 600, height: 504 };
  const crop = cropAround(tooltip, imageSize, box.width / box.height, 0.18);
  return page(MARQUEE, `
.text { position: absolute; left: 88px; top: 50%; width: 620px; transform: translateY(-56%); }
.name { display: flex; align-items: center; gap: 22px; }
.name img { width: 92px; height: 92px; border-radius: 22%; box-shadow: 0 0 0 1px rgba(167,139,250,.35); }
.name span { font-size: 88px; font-weight: 800; letter-spacing: -0.03em; color: #f4f1fb; }
.rule { margin: 26px 0 0 4px; width: 236px; height: 4px; border-radius: 2px; background: #8b6de6; }
h1 { margin-top: 30px; font-size: 36px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
.lead { margin-top: 14px; font-size: 24px; }
.note { left: 88px; bottom: 54px; font-size: 18px; }`,
  `<div class="text"><div class="name"><img src="${icon}" alt=""><span>DuelSight</span></div>
<div class="rule"></div>
<h1>Hover a ${GAME} card in a video to see it.</h1>
<p class="lead">YouTube and Twitch · Free and open source</p></div>
${cropShot(image, imageSize, crop, box)}
<p class="note">${esc(DISCLAIMER)}</p>`);
}

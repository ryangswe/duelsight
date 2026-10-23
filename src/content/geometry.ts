// SPDX-License-Identifier: Apache-2.0
// Page geometry of the content script: where the picture sits inside a <video> element, the size
// a picture is analyzed at, and where the tooltip goes beside a card. Pure functions.

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the picture sits inside an element's box, for the element's `object-fit` (a video is
 *  fitted inside its box by default, leaving bars). */
export function pictureRect(element: Rect, picture: { width: number; height: number }, fit: string): Rect {
  const whole = { left: element.left, top: element.top, width: element.width, height: element.height };
  if (picture.width <= 0 || picture.height <= 0 || fit === "fill") return whole;
  const sx = element.width / picture.width;
  const sy = element.height / picture.height;
  const scale = fit === "cover" ? Math.max(sx, sy) : fit === "none" ? 1 : fit === "scale-down" ? Math.min(1, sx, sy) : Math.min(sx, sy);
  const width = picture.width * scale;
  const height = picture.height * scale;
  return { left: element.left + (element.width - width) / 2, top: element.top + (element.height - height) / 2, width, height };
}

/** The pointer in fractions of a rectangle, or null when it is outside it. */
export function fractionIn(rect: Rect, x: number, y: number): { x: number; y: number } | null {
  if (!(rect.width > 0 && rect.height > 0)) return null;
  const fx = (x - rect.left) / rect.width;
  const fy = (y - rect.top) / rect.height;
  return fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1 ? { x: fx, y: fy } : null;
}

/** The size a picture is analyzed at: its width brought within the range, its aspect kept. */
export function analysisSize(sourceWidth: number, sourceHeight: number, range: { min: number; max: number }): { width: number; height: number } {
  const width = Math.max(range.min, Math.min(range.max, sourceWidth));
  return { width, height: Math.max(1, Math.round((width * sourceHeight) / sourceWidth)) };
}

export const TOOLTIP_GAP = 10;
export const VIEWPORT_MARGIN = 8;
/** How far a shown tooltip may be from a spot beside the card and still count as that spot. */
export const STICKY_PX = 24;
/** Around the hovered card, this much of the gap counts as the card when placing the tooltip
 *  (more than the outline's 2 px edge, less than TOOLTIP_GAP so the spots beside it are clear). */
export const CARD_PAD = 8;

/**
 * Where the tooltip goes for a card: to the right of the card when it fits in the viewport,
 * else to its left, else against the viewport's edge; vertically centered on the card and kept
 * inside the viewport.
 */
export function placeTooltip(card: Rect, size: { width: number; height: number }, viewport: { width: number; height: number }): { left: number; top: number } {
  const right = card.left + card.width + TOOLTIP_GAP;
  const left = card.left - TOOLTIP_GAP - size.width;
  let x: number;
  if (right + size.width <= viewport.width - VIEWPORT_MARGIN) x = right;
  else if (left >= VIEWPORT_MARGIN) x = left;
  else x = Math.max(VIEWPORT_MARGIN, viewport.width - VIEWPORT_MARGIN - size.width);
  const centered = card.top + card.height / 2 - size.height / 2;
  const y = Math.max(VIEWPORT_MARGIN, Math.min(centered, viewport.height - VIEWPORT_MARGIN - size.height));
  return { left: Math.round(x), top: Math.round(y) };
}

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** How much of the other cards a tooltip at a place covers: how many, and how much area. */
export interface Coverage {
  cards: number;
  area: number;
}

function coverage(r: Rect, others: readonly Rect[]): Coverage {
  let cards = 0;
  let area = 0;
  for (const o of others) {
    const a = overlap(r, o);
    if (a > 0) {
      cards += 1;
      area += a;
    }
  }
  return { cards, area };
}

/** Whether `next` covers clearly less than `current`: at least one card fewer, and at least
 *  25 % less area. */
export function clearlyBetter(next: Coverage, current: Coverage): boolean {
  return next.cards <= current.cards - 1 && next.area <= current.area * 0.75;
}

/**
 * Where the tooltip goes for a card, keeping off the cards around it: of the places beside the
 * card (right or left, centered on it or level with its top; below or above it), each kept
 * inside the viewport and no higher than `minTop` (the player's top, below a site's header)
 * where the viewport leaves room, the one that covers the least of the other cards is taken
 * among those that leave the hovered card uncovered (only when every place covers it, the one
 * covering least, the hovered card counting ten times as much); between equals, the first in
 * that order. When
 * the tooltip is already shown at `current`, still beside the card (within `STICKY_PX` of one
 * of those places) and off the hovered card, it stays unless another place covers clearly less
 * (`clearlyBetter`), so it does not jump.
 */
export function placeTooltipAvoiding(
  card: Rect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  others: readonly Rect[],
  minTop = 0,
  current: { left: number; top: number } | null = null,
): { left: number; top: number } {
  const top0 = Math.max(VIEWPORT_MARGIN, Math.min(minTop, viewport.height - VIEWPORT_MARGIN - size.height));
  const clampX = (x: number): number => Math.max(VIEWPORT_MARGIN, Math.min(x, viewport.width - VIEWPORT_MARGIN - size.width));
  const clampY = (y: number): number => Math.max(top0, Math.min(y, viewport.height - VIEWPORT_MARGIN - size.height));
  const right = card.left + card.width + TOOLTIP_GAP;
  const left = card.left - TOOLTIP_GAP - size.width;
  const centered = card.top + card.height / 2 - size.height / 2;
  const middleX = card.left + card.width / 2 - size.width / 2;
  const candidates = [
    { left: right, top: centered },
    { left, top: centered },
    { left: right, top: card.top },
    { left, top: card.top },
    { left: middleX, top: card.top + card.height + TOOLTIP_GAP },
    { left: middleX, top: card.top - TOOLTIP_GAP - size.height },
  ].map((c) => ({ left: Math.round(clampX(c.left)), top: Math.round(clampY(c.top)) }));
  const rectAt = (c: { left: number; top: number }): Rect => ({ left: c.left, top: c.top, width: size.width, height: size.height });
  // The hovered card with most of the gap around it: a place clamped against the viewport a
  // pixel or two from the card would cover its outline's edge (and flip under jitter).
  const pad = CARD_PAD;
  const guarded: Rect = { left: card.left - pad, top: card.top - pad, width: card.width + 2 * pad, height: card.height + 2 * pad };
  let best = candidates[0]!;
  let bestScore = Infinity;
  for (const c of candidates) {
    const r = rectAt(c);
    const onCard = overlap(r, guarded);
    // Covering the hovered card loses to any place that does not, however many others it covers.
    const score = (onCard > 0 ? 1e12 : 0) + onCard * 10 + others.reduce((sum, o) => sum + overlap(r, o), 0);
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  if (current) {
    // Only a spot still beside this card counts as "where it is" (a new card elsewhere moves it).
    const here = { left: Math.round(clampX(current.left)), top: Math.round(clampY(current.top)) };
    const besideCard = candidates.some((c) => Math.abs(c.left - here.left) <= STICKY_PX && Math.abs(c.top - here.top) <= STICKY_PX);
    if (besideCard && overlap(rectAt(here), guarded) === 0 && !clearlyBetter(coverage(rectAt(best), others), coverage(rectAt(here), others))) return here;
  }
  return best;
}

/**
 * The size asked for at the viewer's card size (the popup's dial, as a factor: 0.7 to 1.3). A card
 * picture is scaled, keeping its shape; a pill (the name) is not. The fitting below comes after,
 * so a larger picture is still kept inside the viewport and off the card.
 */
export function scaleTooltipSize<T extends { width: number; height: number; shape: "card" | "pill" }>(size: T, scale: number): T {
  if (size.shape === "pill" || !(scale > 0) || scale === 1) return size;
  return { ...size, width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
}

/** A card picture is never scaled below this width. */
export const MIN_ART_WIDTH = 200;
/** The picture's corner radius, as a share of its width (a printed card's corners). */
export const CARD_CORNER = 0.045;

/**
 * The size the tooltip is shown at. A pill (the name) is shown as it is. A card picture keeps
 * its size when it fits between the player's top (or the viewport's, if higher) and the
 * viewport's bottom, and across the viewport, inside the margins; otherwise it is scaled down,
 * keeping its shape, but never below `MIN_ART_WIDTH` wide.
 */
export function fitTooltipSize(
  size: { width: number; height: number; shape: "card" | "pill" },
  viewport: { width: number; height: number },
  minTop = 0,
): { width: number; height: number } {
  if (size.shape === "pill") return { width: size.width, height: size.height };
  const room = availableSpace(viewport, minTop);
  const scale = Math.min(1, room.width / size.width, room.height / size.height);
  if (!(scale < 1)) return { width: size.width, height: size.height };
  // Rounded down, both sides, so a scaled picture never overshoots the room by a pixel.
  const width = Math.max(Math.min(MIN_ART_WIDTH, size.width), Math.floor(size.width * Math.max(0, scale)));
  return { width, height: Math.floor((width * size.height) / size.width) };
}

/**
 * A card picture that fits nowhere beside the hovered card (right, left, below or above it,
 * inside the viewport and below `minTop`) would cover it: it is scaled down, keeping its shape,
 * to the largest size that fits on one of those sides, but not below `MIN_ART_WIDTH` wide (then
 * it covers as little as placement can manage).
 */
export function fitBesideCard(card: Rect, size: { width: number; height: number }, viewport: { width: number; height: number }, minTop = 0): { width: number; height: number } {
  const top = Math.max(VIEWPORT_MARGIN, minTop);
  const bottom = viewport.height - VIEWPORT_MARGIN;
  const fullWidth = viewport.width - 2 * VIEWPORT_MARGIN;
  const sides = [
    { width: viewport.width - VIEWPORT_MARGIN - (card.left + card.width + TOOLTIP_GAP), height: bottom - top },
    { width: card.left - TOOLTIP_GAP - VIEWPORT_MARGIN, height: bottom - top },
    { width: fullWidth, height: bottom - (card.top + card.height + TOOLTIP_GAP) },
    { width: fullWidth, height: card.top - TOOLTIP_GAP - top },
  ];
  const scale = Math.max(...sides.map((s) => Math.min(s.width / size.width, s.height / size.height)));
  if (!(scale < 1)) return size;
  const width = Math.max(Math.min(MIN_ART_WIDTH, size.width), Math.floor(size.width * Math.max(0, scale)));
  return { width, height: Math.floor((width * size.height) / size.width) };
}

/** The frame's corner radius for a shown size: a card's corners, or a pill's round ends. */
export function tooltipRadius(size: { width: number; height: number }, shape: "card" | "pill"): number {
  return shape === "pill" ? Math.round(size.height / 2) : Math.round(size.width * CARD_CORNER);
}

/** The room a tooltip has: the viewport inside its margins, below `minTop` (the player's top)
 *  when that is lower than the viewport's own top margin. */
export function availableSpace(viewport: { width: number; height: number }, minTop = 0): { width: number; height: number } {
  return { width: viewport.width - 2 * VIEWPORT_MARGIN, height: viewport.height - VIEWPORT_MARGIN - Math.max(VIEWPORT_MARGIN, minTop) };
}

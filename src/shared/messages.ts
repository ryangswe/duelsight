// SPDX-License-Identifier: Apache-2.0
// The messages between the content script (in the video page) and the tooltip frame, which shows a
// card, and the card facts channel between the extension's own frames. The messages with the
// compute frame are the toolkit's contract (computeProtocol, docs/extension-session.md), under the
// same tag.
//
// They travel by `window.postMessage`, so the page itself could post to the frames or read their
// replies. Every message is checked on arrival (`parse*`), and nothing in them is secret: frames
// are pictures the page already shows, replies are card names and boxes. Each message carries
// `duelsight: 1` so that unrelated messages on the same window are told apart.

import type { VideoSites } from "../config.js";
import { VIDEO_SITES } from "../constants.js";

export const TAG = "duelsight" as const;

/** A box in fractions of the analyzed frame (0 to 1). */
export interface FractionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Content script → tooltip frame. */
/** `seq` numbers each card the content script sends; the tooltip echoes it in its sizes, so a
 *  late size from an earlier showing of the same card is told apart. */
export type TooltipIn = { kind: "card"; cardId: string; name: string; seq?: number; releaseId?: string } | { kind: "clear" };

/**
 * Compute frame → tooltip frame, over the extension-only facts channel (FACTS_CHANNEL), never
 * through the page: a card of a remote release, with the facts its tooltip shows. The page can
 * post `card` messages to the tooltip frame, but it cannot reach this channel, so a tooltip only
 * ever shows facts that a compute frame sent for a card it showed.
 */
export interface CardFactsMessage {
  releaseId: string;
  cardId: string;
  facts: { name: string; set: string | null; art: string | null; printed?: string | null };
}

/** The BroadcastChannel the compute frame posts card facts on. Every page of the extension's origin
 *  can use it (the frames of other tabs too); a web page cannot. */
export const FACTS_CHANNEL = "duelsight-card-facts";

/** Tooltip frame → compute frames, on the facts channel: the facts of a card it was asked to show
 *  and does not have (a tooltip frame made again, or a card that came before its facts). */
export interface FactsRequest {
  want: true;
  releaseId: string;
  cardId: string;
}

export function parseFactsRequest(data: unknown): FactsRequest | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as Raw;
  return m.want === true && typeof m.releaseId === "string" && RELEASE_ID.test(m.releaseId) && isText(m.cardId)
    ? { want: true, releaseId: m.releaseId, cardId: m.cardId }
    : null;
}

const RELEASE_ID = /^[0-9a-f]{16}$/;
/** A clean relative art path: no scheme, no leading slash, no "." or ".." segment. */
const ART_PATH = /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

/** Tooltip frame → content script. */
export type TooltipOut =
  | { kind: "ready" }
  /** The tooltip's own size: a card-shaped picture (the content script may scale it down,
   *  keeping its shape) or a pill with the name (shown as is). */
  | ({ kind: "size" } & TooltipSize);

export interface TooltipSize {
  width: number;
  height: number;
  shape: "card" | "pill";
  /** The card this size is for (the frame is shown only once its card's size has come). */
  cardId?: string;
  /** The `seq` of the card message it answers. */
  seq?: number;
  /** With a card picture: the card's details panel, as the heights its whole text needs at a few
   *  widths ([width, height] pairs). The content script then sizes the frame for the picture and
   *  the panel together (panel-layout.ts); `width` and `height` stay the picture's own. */
  panel?: Array<[number, number]>;
}

/** The most [width, height] pairs a panel may carry, and the largest height (a taller text is
 *  sent as this: it is clamped anyway). */
export const MAX_PANEL_PAIRS = 12;
export const MAX_PANEL_HEIGHT = 4000;

function parsePanel(v: unknown): Array<[number, number]> | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_PANEL_PAIRS) return null;
  const out: Array<[number, number]> = [];
  for (const pair of v) {
    if (!Array.isArray(pair) || pair.length !== 2) return null;
    const [w, h] = pair as unknown[];
    if (!isNum(w) || !isNum(h) || w <= 0 || w >= 2000 || h <= 0 || h > MAX_PANEL_HEIGHT) return null;
    out.push([w, h]);
  }
  return out;
}

export type Tagged<T> = T & { [TAG]: 1 };

export function tag<T extends object>(message: T): Tagged<T> {
  return { ...message, [TAG]: 1 } as Tagged<T>;
}

type Raw = Record<string, unknown>;

function tagged(data: unknown): Raw | null {
  if (typeof data !== "object" || data === null) return null;
  const raw = data as Raw;
  return raw[TAG] === 1 && typeof raw.kind === "string" ? raw : null;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isText = (v: unknown, max = 200): v is string => typeof v === "string" && v.length > 0 && v.length <= max;

function isSeq(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
}

export function parseTooltipIn(data: unknown): TooltipIn | null {
  const m = tagged(data);
  if (!m) return null;
  if (m.kind === "clear") return { kind: "clear" };
  if (m.kind === "card" && isText(m.cardId) && isText(m.name)) {
    if (m.seq !== undefined && !isSeq(m.seq)) return null;
    const releaseId = typeof m.releaseId === "string" && RELEASE_ID.test(m.releaseId) ? m.releaseId : undefined;
    return { kind: "card", cardId: m.cardId, name: m.name, ...(isSeq(m.seq) ? { seq: m.seq } : {}), ...(releaseId ? { releaseId } : {}) };
  }
  return null;
}

const isFactText = (v: unknown): v is string | null => v === null || (typeof v === "string" && v.length <= 200);

/** A facts-channel message, checked (Addendum 1, A4): strings of at most 200 characters, a clean
 *  relative art path. Null when anything is off: the tooltip then falls back to its own table. */
export function parseCardFacts(data: unknown): CardFactsMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const m = data as Raw;
  if (typeof m.releaseId !== "string" || !RELEASE_ID.test(m.releaseId) || !isText(m.cardId)) return null;
  const f = m.facts as Raw | undefined;
  if (typeof f !== "object" || f === null || !isText(f.name) || !isFactText(f.set) || !isFactText(f.art)) return null;
  if (f.art !== null && !ART_PATH.test(f.art as string)) return null;
  if (f.printed !== undefined && !isFactText(f.printed)) return null;
  return {
    releaseId: m.releaseId,
    cardId: m.cardId,
    facts: { name: f.name, set: f.set as string | null, art: f.art as string | null, ...(f.printed !== undefined ? { printed: f.printed as string | null } : {}) },
  };
}

export function parseTooltipOut(data: unknown): TooltipOut | null {
  const m = tagged(data);
  if (!m) return null;
  if (m.kind === "ready") return { kind: "ready" };
  if (m.kind === "size" && isNum(m.width) && isNum(m.height) && m.width > 0 && m.height > 0 && m.width < 2000 && m.height < 2000 && (m.shape === "card" || m.shape === "pill")) {
    if (m.cardId !== undefined && (typeof m.cardId !== "string" || m.cardId.length === 0 || m.cardId.length > 200)) return null;
    if (m.seq !== undefined && !isSeq(m.seq)) return null;
    // A panel goes with a card picture only.
    const panel = m.panel === undefined ? undefined : m.shape === "card" ? parsePanel(m.panel) : null;
    if (panel === null) return null;
    return {
      kind: "size",
      width: m.width,
      height: m.height,
      shape: m.shape,
      ...(typeof m.cardId === "string" ? { cardId: m.cardId } : {}),
      ...(isSeq(m.seq) ? { seq: m.seq } : {}),
      ...(panel ? { panel } : {}),
    };
  }
  return null;
}

/** Background messages (chrome.runtime): pages ask for a settings refresh when one is due. */
export type BackgroundIn = { kind: "settings:refresh" };

/** The origins a frame accepts messages from: the video sites, and the local test page in a dev build. */
export function allowedParentOrigin(origin: string, dev: boolean, sites: VideoSites = VIDEO_SITES): boolean {
  if (sites.youtube && origin === "https://www.youtube.com") return true;
  if (sites.twitch && origin === "https://www.twitch.tv") return true;
  return dev && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

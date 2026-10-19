// SPDX-License-Identifier: Apache-2.0
// The messages between the content script (in the video page) and the extension's two frames
// inside that page: the compute frame, which hosts the recognition worker, and the tooltip frame,
// which shows a card.
//
// They travel by `window.postMessage`, so the page itself could post to the frames or read their
// replies. Every message is checked on arrival (`parse*`), and nothing in them is secret: frames
// are pictures the page already shows, replies are card names and boxes. Each message carries
// `kenbunshoku: 1` so that unrelated messages on the same window are told apart.

import type { VideoSites } from "../config.js";
import { VIDEO_SITES } from "../constants.js";

export const TAG = "kenbunshoku" as const;

/** A box in fractions of the analyzed frame (0 to 1). */
export interface FractionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShownCard {
  cardId: string;
  name: string;
  box: FractionBox;
  /** The other cards of the same analysis, so that the tooltip can be placed off them. */
  others?: FractionBox[];
}

/** Content script → compute frame. */
export type ComputeIn =
  /** The pointer over the picture, in fractions of the picture; `mediaTime` is the video's time. */
  | { kind: "pointer"; x: number; y: number; mediaTime: number; touch: boolean }
  /** The pointer left the picture. */
  | { kind: "leave" }
  /** The video presented a new frame (playback, a seek ended). */
  | { kind: "presented"; mediaTime: number }
  /** A seek started, or the video was given another source (`newSource`). */
  | { kind: "discontinuity"; newSource: boolean }
  /** The picture asked for by `capture`, at analysis size. */
  | { kind: "frame"; requestId: number; bitmap: ImageBitmap; mediaTime: number }
  /** The picture asked for could not be read. */
  | { kind: "capture-failed"; requestId: number; reason: string; retry?: boolean };

/** Compute frame → content script. */
export type ComputeOut =
  | { kind: "ready" }
  | { kind: "status"; state: "loading" | "ready" | "failed"; error: string | null; backend: string | null }
  /** Capture the current picture at a width within `analysisWidth` and send it back as `frame`. */
  | { kind: "capture"; requestId: number; analysisWidth: { min: number; max: number } }
  /** What a tooltip shows for the pointer's position now; null for nothing. */
  | { kind: "shown"; card: ShownCard | null };

/** Content script → tooltip frame. */
/** `seq` numbers each card the content script sends; the tooltip echoes it in its sizes, so a
 *  late size from an earlier showing of the same card is told apart. */
export type TooltipIn = { kind: "card"; cardId: string; name: string; seq?: number } | { kind: "clear" };

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
const isFraction = (v: unknown): v is number => isNum(v) && v >= 0 && v <= 1;
const isId = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
const isText = (v: unknown, max = 200): v is string => typeof v === "string" && v.length > 0 && v.length <= max;

/** The largest picture the compute frame takes, per side: above the widest analysis frame (1920)
 *  and any sane height at that width. A larger one (only a page posting to the frame could send
 *  it) is refused and closed. */
export const MAX_FRAME_SIDE = 4096;

function frameSizeOk(bitmap: ImageBitmap): boolean {
  const { width, height } = bitmap;
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= MAX_FRAME_SIDE && height <= MAX_FRAME_SIDE;
}

export function parseComputeIn(data: unknown): ComputeIn | null {
  const m = tagged(data);
  if (!m) return null;
  switch (m.kind) {
    case "pointer":
      return isFraction(m.x) && isFraction(m.y) && isNum(m.mediaTime) && typeof m.touch === "boolean"
        ? { kind: "pointer", x: m.x, y: m.y, mediaTime: m.mediaTime, touch: m.touch }
        : null;
    case "leave":
      return { kind: "leave" };
    case "presented":
      return isNum(m.mediaTime) ? { kind: "presented", mediaTime: m.mediaTime } : null;
    case "discontinuity":
      return typeof m.newSource === "boolean" ? { kind: "discontinuity", newSource: m.newSource } : null;
    case "frame":
      return isId(m.requestId) && isNum(m.mediaTime) && typeof ImageBitmap !== "undefined" && m.bitmap instanceof ImageBitmap && frameSizeOk(m.bitmap)
        ? { kind: "frame", requestId: m.requestId, bitmap: m.bitmap, mediaTime: m.mediaTime }
        : null;
    case "capture-failed":
      return isId(m.requestId) && typeof m.reason === "string"
        ? { kind: "capture-failed", requestId: m.requestId, reason: m.reason.slice(0, 200), retry: m.retry === true }
        : null;
    default:
      return null;
  }
}

function parseBox(v: unknown): FractionBox | null {
  if (typeof v !== "object" || v === null) return null;
  const b = v as Raw;
  return isNum(b.x) && isNum(b.y) && isNum(b.width) && isNum(b.height) && b.width > 0 && b.height > 0
    ? { x: b.x, y: b.y, width: b.width, height: b.height }
    : null;
}

export function parseComputeOut(data: unknown): ComputeOut | null {
  const m = tagged(data);
  if (!m) return null;
  switch (m.kind) {
    case "ready":
      return { kind: "ready" };
    case "status":
      return (m.state === "loading" || m.state === "ready" || m.state === "failed") &&
        (m.error === null || typeof m.error === "string") &&
        (m.backend === null || typeof m.backend === "string")
        ? { kind: "status", state: m.state, error: m.error, backend: m.backend }
        : null;
    case "capture": {
      const w = m.analysisWidth as Raw | undefined;
      return isId(m.requestId) && w && isNum(w.min) && isNum(w.max) && w.min > 0 && w.max >= w.min
        ? { kind: "capture", requestId: m.requestId, analysisWidth: { min: w.min, max: w.max } }
        : null;
    }
    case "shown": {
      if (m.card === null) return { kind: "shown", card: null };
      const c = m.card as Raw | undefined;
      const box = c ? parseBox(c.box) : null;
      if (!(c && isText(c.cardId) && isText(c.name) && box)) return null;
      const others = Array.isArray(c.others) ? c.others.slice(0, 40).map(parseBox).filter((b): b is FractionBox => b !== null) : [];
      return { kind: "shown", card: { cardId: c.cardId, name: c.name, box, others } };
    }
    default:
      return null;
  }
}

function isSeq(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
}

export function parseTooltipIn(data: unknown): TooltipIn | null {
  const m = tagged(data);
  if (!m) return null;
  if (m.kind === "clear") return { kind: "clear" };
  if (m.kind === "card" && isText(m.cardId) && isText(m.name)) {
    if (m.seq !== undefined && !isSeq(m.seq)) return null;
    return { kind: "card", cardId: m.cardId, name: m.name, ...(isSeq(m.seq) ? { seq: m.seq } : {}) };
  }
  return null;
}

export function parseTooltipOut(data: unknown): TooltipOut | null {
  const m = tagged(data);
  if (!m) return null;
  if (m.kind === "ready") return { kind: "ready" };
  if (m.kind === "size" && isNum(m.width) && isNum(m.height) && m.width > 0 && m.height > 0 && m.width < 2000 && m.height < 2000 && (m.shape === "card" || m.shape === "pill")) {
    if (m.cardId !== undefined && (typeof m.cardId !== "string" || m.cardId.length === 0 || m.cardId.length > 200)) return null;
    if (m.seq !== undefined && !isSeq(m.seq)) return null;
    return { kind: "size", width: m.width, height: m.height, shape: m.shape, ...(typeof m.cardId === "string" ? { cardId: m.cardId } : {}), ...(isSeq(m.seq) ? { seq: m.seq } : {}) };
  }
  return null;
}

/** Background messages (chrome.runtime): pages ask for a settings refresh when one is due. */
export type BackgroundIn = { kind: "settings:refresh" };

/** The origins a frame accepts messages from: the video sites, and the local test page in a dev build. */
export function allowedParentOrigin(origin: string, dev: boolean, sites: VideoSites = VIDEO_SITES): boolean {
  if (sites.youtube && origin === "https://www.youtube.com") return true;
  if (sites.twitch && origin === "https://www.twitch.tv") return true;
  return dev && /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

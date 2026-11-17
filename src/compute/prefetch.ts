// SPDX-License-Identifier: Apache-2.0
// Card pictures fetched ahead of the pointer (cardvision-hq#125), apart from the browser globals so
// that it can be tested.
//
// When an analysis names cards the pointer could be shown (the hover layer, and the track layer
// while it is shown), the compute frame fetches each one's picture once, from the address the
// tooltip frame will ask for: the first source of the settings in effect whose template the card
// can fill (images/chain.ts tries the same one first). The tooltip's own fetch then finds the
// picture in the browser's cache (the CDN serves pictures with `max-age`), so a card shows its
// picture at once instead of after a download.
//
//   - Nothing is fetched with `namesOnly`, with no source, or for a card the release in effect
//     does not have. The settings are read when first needed and again after they change in
//     storage (`settingsChanged`, as the tooltip does): a change to names only stops the fetching,
//     and a new picture address is fetched for the cards named after it.
//   - Each address is fetched once per compute frame (a frame made again starts over), at most
//     PREFETCH_PER_ANALYSIS new ones per analysis, PREFETCH_IN_FLIGHT at a time, and
//     PREFETCH_LIMIT in all: a duel's cards, not a whole video's.
//   - A reused analysis (the previous frame's detections again) is read too: its track layer is new.
//   - The fetch is the tooltip's (images/chain.ts): no credentials, no referrer, the browser's
//     cache, given up after IMAGE_TIMEOUT_MS; its body is read so that the cache keeps it, and
//     nothing else is done with it. A failure is dropped and not asked for again by this frame:
//     the tooltip's own fetch tries again when the card is shown, with its fallbacks.

import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { IMAGE_TIMEOUT_MS } from "../constants.js";
import type { Settings } from "../settings/schema.js";
import { type CardRef, expandTemplate } from "../settings/templates.js";

/** Addresses fetched ahead per compute frame, at most (the tooltip keeps 60 pictures). */
export const PREFETCH_LIMIT = 60;
/** New addresses started per analysis, at most. */
export const PREFETCH_PER_ANALYSIS = 4;
/** Fetches running at once, at most. */
export const PREFETCH_IN_FLIGHT = 2;

export interface PrefetchDeps {
  /** The settings in effect (read once, when first needed); null: none could be read. */
  settings(): Promise<Pick<Settings, "namesOnly" | "primary" | "fallbacks"> | null>;
  /** The card for an id in the release in effect, or null. */
  card(id: string): Promise<CardRef | null>;
  fetch(url: string, init: RequestInit): Promise<Response>;
}

export interface Prefetcher {
  /** The host's `observe.onAnalysis`. */
  onAnalysis(analysis: FrameAnalysis): void;
  /** The settings changed in storage: they are read again, and the cards named from now on are
   *  looked at again (an address already fetched is not fetched again). */
  settingsChanged(): void;
  /** Addresses started so far, oldest first (for tests and the dev build's debug record). */
  readonly started: readonly string[];
}

/** The named cards an analysis offers the pointer, hover layer first, each id once. */
export function namedCards(analysis: FrameAnalysis): string[] {
  const ids: string[] = [];
  const layers = [analysis.hover.cards, analysis.tracks.shown ? analysis.tracks.cards : []];
  for (const layer of layers) {
    for (const card of layer) {
      if (card.cardId !== null && !ids.includes(card.cardId)) ids.push(card.cardId);
    }
  }
  return ids;
}

/** The address the tooltip tries first for a card, or null when no source can serve it. */
export function firstAddress(settings: Pick<Settings, "namesOnly" | "primary" | "fallbacks">, card: CardRef): string | null {
  if (settings.namesOnly) return null;
  for (const source of [...(settings.primary ? [settings.primary] : []), ...settings.fallbacks]) {
    const url = expandTemplate(source.template, card);
    if (url !== null) return url;
  }
  return null;
}

export function createPrefetcher(deps: PrefetchDeps): Prefetcher {
  const started: string[] = [];
  /** Addresses started, and card ids taken (queued, fetched or found to have no address). */
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  /** Card ids waiting for a slot, oldest first. */
  const queue: string[] = [];
  let inFlight = 0;
  let settings: Promise<Pick<Settings, "namesOnly" | "primary" | "fallbacks"> | null> | null = null;

  const pump = (): void => {
    while (inFlight < PREFETCH_IN_FLIGHT && queue.length > 0 && started.length + inFlight < PREFETCH_LIMIT) {
      const id = queue.shift()!;
      inFlight += 1;
      void fetchOne(id).finally(() => {
        inFlight -= 1;
        pump();
      });
    }
  };

  const fetchOne = async (id: string): Promise<void> => {
    try {
      settings ??= deps.settings().catch(() => null);
      const [effective, card] = await Promise.all([settings, deps.card(id)]);
      if (!effective || !card) return;
      const url = firstAddress(effective, card);
      if (url === null || seenUrls.has(url) || started.length >= PREFETCH_LIMIT) return;
      seenUrls.add(url);
      started.push(url);
      const response = await deps.fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "default", signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
      if (response.ok) await response.arrayBuffer();
    } catch {
      // Dropped: the tooltip fetches it itself.
    }
  };

  return {
    started,
    settingsChanged() {
      settings = null;
      seenIds.clear();
    },
    onAnalysis(analysis) {
      let added = 0;
      for (const id of namedCards(analysis)) {
        // Room left: what is started, running and waiting stays within the limit.
        if (added >= PREFETCH_PER_ANALYSIS || started.length + inFlight + queue.length >= PREFETCH_LIMIT) break;
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        queue.push(id);
        added += 1;
      }
      pump();
    },
  };
}

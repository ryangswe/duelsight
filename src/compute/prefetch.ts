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
//   - A source whose fetches failed SOURCE_FAILURE_LIMIT times in a row is skipped, as the tooltip
//     skips it (images/chain.ts, SourceHealth): the cards named after that are fetched from the
//     next source they can fill, the one the tooltip then shows. The tooltip frame keeps its own
//     count, from its own fetches of the same addresses, so this one is kept close to it:
//     at most one failure per source counts per analysis (the tooltip counts the hovered card, not
//     every card an analysis names), so a short stall does not trip it sooner. Like the tooltip, it
//     does not try a skipped source again until the settings are read again (`settingsChanged`),
//     which tries every source again; a fetch started before that does not count. If a stall trips
//     it while the tooltip, seeing fewer failures, stays on the source, the tooltip's pictures load
//     without a warm cache until then, as before pictures were fetched ahead.

import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { IMAGE_TIMEOUT_MS, SOURCE_FAILURE_LIMIT } from "../constants.js";
import type { ImageSource, Settings } from "../settings/schema.js";
import { type CardRef, expandTemplate } from "../settings/templates.js";

/** Addresses fetched ahead per compute frame, at most (the tooltip keeps 60 pictures). */
export const PREFETCH_LIMIT = 60;
/** New addresses started per analysis, at most. */
export const PREFETCH_PER_ANALYSIS = 4;
/** Fetches running at once, at most. */
export const PREFETCH_IN_FLIGHT = 2;
/** Failures per source, counted at the tooltip's pace: one per analysis. */
export class PrefetchHealth {
  /** Per source: the analyses whose failures counted since its last success (one each). */
  private readonly sources = new Map<string, Set<number>>();

  private key(source: ImageSource): string {
    return `${source.id}\n${source.template}`;
  }

  /** Whether fetches leave this source out, until the settings are read again. */
  skipped(source: ImageSource): boolean {
    return (this.sources.get(this.key(source))?.size ?? 0) >= SOURCE_FAILURE_LIMIT;
  }

  /** A fetch from this source ended, for a card named by analysis number `analysis`. */
  record(source: ImageSource, ok: boolean, analysis: number): void {
    const key = this.key(source);
    if (ok) {
      this.sources.delete(key);
      return;
    }
    // Fetches can end out of order (two at a time): an analysis counts once however they end.
    const counted = this.sources.get(key) ?? new Set<number>();
    counted.add(analysis);
    this.sources.set(key, counted);
  }

  /** Fresh settings: every source is tried again. */
  reset(): void {
    this.sources.clear();
  }
}

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

/** The source and address the tooltip tries first for a card (leaving out the sources `health`
 *  skips), or null when no source can serve it. */
export function firstSource(
  settings: Pick<Settings, "namesOnly" | "primary" | "fallbacks">,
  card: CardRef,
  health?: Pick<PrefetchHealth, "skipped">,
): { source: ImageSource; url: string } | null {
  if (settings.namesOnly) return null;
  for (const source of [...(settings.primary ? [settings.primary] : []), ...settings.fallbacks]) {
    if (health?.skipped(source)) continue;
    const url = expandTemplate(source.template, card);
    if (url !== null) return { source, url };
  }
  return null;
}

/** The address the tooltip tries first for a card, or null when no source can serve it. */
export function firstAddress(settings: Pick<Settings, "namesOnly" | "primary" | "fallbacks">, card: CardRef): string | null {
  return firstSource(settings, card)?.url ?? null;
}

export function createPrefetcher(deps: PrefetchDeps): Prefetcher {
  const started: string[] = [];
  /** Addresses started, and card ids taken (queued, fetched or found to have no address). */
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  /** Card ids waiting for a slot, oldest first, each with the number of the analysis that named it. */
  const queue: Array<{ id: string; analysis: number }> = [];
  let analyses = 0;
  let inFlight = 0;
  let settings: Promise<Pick<Settings, "namesOnly" | "primary" | "fallbacks"> | null> | null = null;
  /** Consecutive failures per source, since the settings were last read. */
  const health = new PrefetchHealth();
  /** Bumped when the settings are read again: a fetch from before then does not count. */
  let generation = 0;

  const pump = (): void => {
    while (inFlight < PREFETCH_IN_FLIGHT && queue.length > 0 && started.length + inFlight < PREFETCH_LIMIT) {
      const { id, analysis } = queue.shift()!;
      inFlight += 1;
      void fetchOne(id, analysis).finally(() => {
        inFlight -= 1;
        pump();
      });
    }
  };

  const fetchOne = async (id: string, analysis: number): Promise<void> => {
    let target: { source: ImageSource; url: string } | null = null;
    // The settings it reads may be from before a change that comes while it waits for them: then
    // its result does not count either.
    const fetchedIn = generation;
    let ok = false;
    try {
      settings ??= deps.settings().catch(() => null);
      const [effective, card] = await Promise.all([settings, deps.card(id)]);
      if (!effective || !card) return;
      target = firstSource(effective, card, health);
      if (target === null || seenUrls.has(target.url) || started.length >= PREFETCH_LIMIT) {
        target = null;
        return;
      }
      seenUrls.add(target.url);
      started.push(target.url);
      const response = await deps.fetch(target.url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "default", signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
      if (response.ok) {
        await response.arrayBuffer();
        ok = true;
      }
    } catch {
      // Dropped: the tooltip fetches it itself.
    } finally {
      if (target !== null && fetchedIn === generation) health.record(target.source, ok, analysis);
    }
  };

  return {
    started,
    settingsChanged() {
      settings = null;
      seenIds.clear();
      health.reset();
      generation += 1;
    },
    onAnalysis(analysis) {
      analyses += 1;
      let added = 0;
      for (const id of namedCards(analysis)) {
        // Room left: what is started, running and waiting stays within the limit.
        if (added >= PREFETCH_PER_ANALYSIS || started.length + inFlight + queue.length >= PREFETCH_LIMIT) break;
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        queue.push({ id, analysis: analyses });
        added += 1;
      }
      pump();
    },
  };
}

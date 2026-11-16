// SPDX-License-Identifier: Apache-2.0
// The compute frame's card facts channel, apart from the browser globals so that it can be tested.
// The session itself is the toolkit's, started by the shared hover host with the standard options
// (startHostCompute, compute.ts): the origin and source rule, the worker and its one restart, the
// remote release's rules 10 to 12, the messages and the pictures it closes, and the hold that
// "Keep the card I'm pointing at" picks. What is DuelSight's own is the card facts channel. A card
// of a remote release goes to the tooltip frame with its facts over an extension-only channel
// (`postFacts`), never through the page, and they leave before the card does (the host calls
// `onShown` before it posts the card). A tooltip frame that lacks a card's facts asks on that
// channel, and is answered only for a card this frame showed, of the release in effect (`factsFor`).

import type { HostComputeEnv } from "../../vendor/cardvision-browser/host-compute.js";
import type { CardFactsMessage } from "../shared/messages.js";

/** Cards this frame has shown, kept to answer a tooltip's facts request (oldest dropped first). */
export const SHOWN_IDS_LIMIT = 256;

type OnShown = NonNullable<NonNullable<HostComputeEnv["observe"]>["onShown"]>;
type ReleaseInEffect = Parameters<OnShown>[1];

export interface FactsChannel {
  /** startComputeFrame's `onShown`: a card of the confirmed remote release sends its facts. */
  onShown: OnShown;
  /** A tooltip's request: the facts of a card this frame showed, of the release in effect. */
  factsFor(releaseId: string, cardId: string): CardFactsMessage | null;
}

export function createFactsChannel(postFacts: (message: CardFactsMessage) => void): FactsChannel {
  /** The ids this frame has shown with the remote release's facts: a request is answered for
   *  these only (facts of shown cards, nothing a page could ask for). */
  const shownIds = new Set<string>();
  let release: ReleaseInEffect | null = null;

  /** The facts of a card from the table in effect, whether shown or not. */
  const rowFacts = (releaseId: string, cardId: string): CardFactsMessage | null => {
    const table = release?.source === "remote" && release.id === releaseId ? release.table : null;
    if (!table || !Object.hasOwn(table, cardId)) return null;
    const row = table[cardId]!;
    return { releaseId, cardId, facts: { name: row[0], set: row[1], art: row[2], ...(row.length > 3 ? { printed: row[3] ?? null } : {}) } };
  };

  return {
    onShown(card, inEffect) {
      release = inEffect;
      // Only a card the toolkit marked with the confirmed remote release's id has facts to send.
      if (!card?.releaseId) return;
      const f = rowFacts(card.releaseId, card.cardId);
      if (!f) return;
      shownIds.delete(f.cardId);
      shownIds.add(f.cardId);
      while (shownIds.size > SHOWN_IDS_LIMIT) shownIds.delete(shownIds.values().next().value as string);
      postFacts(f);
    },
    factsFor: (releaseId, cardId) => (shownIds.has(cardId) ? rowFacts(releaseId, cardId) : null),
  };
}

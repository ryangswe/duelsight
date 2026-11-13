// SPDX-License-Identifier: Apache-2.0
// The compute frame's wiring, apart from the browser globals so that it can be tested. The session
// itself is the toolkit's (startComputeFrame, docs/extension-session.md): the origin and source
// rule, the worker and its one restart, the remote release's rules 10 to 12, the messages and the
// pictures it closes. What is DuelSight's own:
//   - the options it starts with: its message tag, the pages it serves (`allowedParentOrigin`),
//     the shown card kept while the pointer stays where it was seen (`READING_HOLD`; `SHOWN_HOLD`
//     with the popup's "Keep the card I'm pointing at" switched off, shared/keep-card.ts), turned
//     cards' outlines (`rotatedOutlines`), analysis paced from its measured cost
//     (`measuredPacing`), the worker ended when idle (`idleUnloadMs`), the release it loads;
//   - the card facts channel. A card of a remote release goes to the tooltip frame with its facts
//     over an extension-only channel (`postFacts`), never through the page, and they leave before
//     the card does. A tooltip frame that lacks a card's facts asks on that channel, and is
//     answered only for a card this frame showed, of the release in effect (`factsFor`).

import {
  type ComputeFrame,
  type ComputeFrameEnv,
  computeProtocol,
  READING_HOLD,
  SHOWN_HOLD,
  startComputeFrame,
} from "../../vendor/cardvision-browser/compute-session.js";
import { IDLE_UNLOAD_MS } from "../constants.js";
import { allowedParentOrigin, type CardFactsMessage, TAG } from "../shared/messages.js";

/** The two-frame contract under DuelSight's tag; the content script uses the same. */
export const PROTOCOL = computeProtocol(TAG);

/** Cards this frame has shown, kept to answer a tooltip's facts request (oldest dropped first). */
export const SHOWN_IDS_LIMIT = 256;

type OnShown = NonNullable<ComputeFrameEnv["onShown"]>;
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

/** What DuelSight's compute frame starts from: the toolkit's options, less the ones it sets. */
export type DuelSightFrameEnv = Omit<ComputeFrameEnv, "protocol" | "allowedParentOrigin" | "hold" | "onShown" | "parentOrigin" | "rotatedOutlines" | "measuredPacing" | "idleUnloadMs"> & {
  /** How long the model stays loaded with nobody hovering; default IDLE_UNLOAD_MS. A dev build
   *  can shorten it to check the unload. */
  idleUnloadMs?: number;
  /** The popup's "Keep the card I'm pointing at", read when the frame starts; default true. The
   *  hold is fixed for the frame's life: the content script makes a new frame when it changes. */
  keepCard?: boolean;
  /** `location.ancestorOrigins[0]`: missing, or the string "null" when a referrer policy hides it. */
  parentOrigin: string | null | undefined;
  dev: boolean;
  /** Send a shown card's facts to the tooltip frame (an extension-only channel). */
  postFacts(message: CardFactsMessage): void;
};

/** The toolkit's options for DuelSight's compute frame. */
export function computeFrameEnv(env: DuelSightFrameEnv, facts: FactsChannel): ComputeFrameEnv {
  const { dev, postFacts: _postFacts, parentOrigin, idleUnloadMs, keepCard, ...rest } = env;
  return {
    ...rest,
    // "null" (a hidden origin) is no origin: the frame does not start.
    parentOrigin: parentOrigin === undefined || parentOrigin === "null" ? null : parentOrigin,
    allowedParentOrigin: (origin) => allowedParentOrigin(origin, dev),
    protocol: PROTOCOL,
    // A card stays shown while the pointer stays where the card was seen, with no time limit, so a
    // viewer can finish reading it after a player moved the card (owner, 2026-11-11). It ends when
    // the pointer leaves that spot or the picture, on a seek or a new video; a cut does not end
    // it. A card no analysis sees there now is marked `held` (the content script hides its outline).
    // The popup's "Keep the card I'm pointing at" switched off (owner, 2026-11-12) gives the hold
    // before 0.8.0: the card at the pointer, kept only through short gaps.
    hold: keepCard === false ? SHOWN_HOLD : READING_HOLD,
    // A card lying at an angle is hovered and outlined along its own edges, not its upright box
    // (the shown card then carries `rotation`, `localWidth`, `localHeight`; outline.ts draws them).
    rotatedOutlines: true,
    // Analyses are spaced from what they cost on this computer (a quarter of the time at most by
    // default), never faster than the fixed rates: a slow computer is not kept busy analyzing.
    measuredPacing: true,
    // The worker ends after this long with no pointer over the picture and no card shown, which
    // frees the model's memory; the content script then removes the frames (agent.ts whenIdle).
    idleUnloadMs: idleUnloadMs ?? IDLE_UNLOAD_MS,
    onShown: facts.onShown,
  };
}

/** Start DuelSight's compute frame, or return null when it is not inside a page it may serve. */
export function startDuelSightFrame(env: DuelSightFrameEnv): { frame: ComputeFrame; facts: FactsChannel } | null {
  const facts = createFactsChannel((message) => env.postFacts(message));
  const frame = startComputeFrame(computeFrameEnv(env, facts));
  return frame ? { frame, facts } : null;
}

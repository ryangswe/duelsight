// SPDX-License-Identifier: Apache-2.0
// The popup's choices reaching the content script: the stored main switch and card size when the
// page opens, and then a change to the main switch, card size or "Keep the card I'm pointing at"
// goes to the agent (index.ts calls these; they are apart from the browser globals so that they can
// be tested).

import type { KeyValueStorage } from "../settings/store.js";
import { ENABLED_KEY, readEnabled } from "../shared/enabled.js";
import { CARD_SIZE_KEY, clampCardSize, DEFAULT_CARD_SIZE, readCardSize } from "../shared/card-size.js";
import { KEEP_CARD_KEY, keepCardFlipped } from "../shared/keep-card.js";
import type { Agent } from "./agent.js";

type StorageChange = { oldValue?: unknown; newValue?: unknown };

/** The stored main switch and card size, when the page opens, each applied as soon as it is read
 *  (neither waits for the other). Hovers stay off until the switch is read; a switch that cannot be
 *  read is on (hover spec S-H1), as in the popup and the compute frame, and a card size that cannot
 *  be read is the default. A choice the popup changed while its read was pending keeps the change:
 *  the read's answer (or its default) is older, and is not applied (`changedSince`). */
export function applyStoredChoices(
  agent: Pick<Agent, "setEnabled" | "setCardSize">,
  storage: Pick<KeyValueStorage, "get">,
  changedSince: (key: string) => boolean = () => false,
): Promise<void> {
  return Promise.all([
    readEnabled(storage)
      .catch(() => true)
      .then((on) => {
        if (!changedSince(ENABLED_KEY)) agent.setEnabled(on);
      }),
    readCardSize(storage)
      .catch(() => DEFAULT_CARD_SIZE)
      .then((percent) => {
        if (!changedSince(CARD_SIZE_KEY)) agent.setCardSize(percent);
      }),
  ]).then(() => undefined);
}

/** Starts the content script's half of the popup's choices: the start-up read, and the listener for
 *  later changes (to add to chrome.storage.onChanged), which also tells the read which choices
 *  changed while it was pending. */
export function startStorageSync(
  agent: Pick<Agent, "setEnabled" | "setCardSize" | "keepCardChanged">,
  storage: Pick<KeyValueStorage, "get">,
): (changes: Record<string, StorageChange | undefined>, area: string) => void {
  const changed = new Set<string>();
  void applyStoredChoices(agent, storage, (key) => changed.has(key));
  return (changes, area) => {
    if (area === "local") for (const key of Object.keys(changes)) changed.add(key);
    applyStorageChange(agent, changes, area);
  };
}

export function applyStorageChange(agent: Pick<Agent, "setEnabled" | "setCardSize" | "keepCardChanged">, changes: Record<string, StorageChange | undefined>, area: string): void {
  if (area !== "local") return;
  if (ENABLED_KEY in changes) agent.setEnabled(changes[ENABLED_KEY]?.newValue !== false);
  if (CARD_SIZE_KEY in changes) agent.setCardSize(clampCardSize(changes[CARD_SIZE_KEY]?.newValue));
  // Only a change between on and off makes the compute frame again.
  if (keepCardFlipped(changes[KEEP_CARD_KEY])) agent.keepCardChanged();
}

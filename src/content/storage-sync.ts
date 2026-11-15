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

/** The stored main switch and card size, when the page opens. Hovers stay off until the switch is
 *  read; a switch that cannot be read is on (hover spec S-H1), as in the popup and the compute
 *  frame, and a card size that cannot be read is the default. */
export async function applyStoredChoices(agent: Pick<Agent, "setEnabled" | "setCardSize">, storage: Pick<KeyValueStorage, "get">): Promise<void> {
  agent.setEnabled(await readEnabled(storage).catch(() => true));
  agent.setCardSize(await readCardSize(storage).catch(() => DEFAULT_CARD_SIZE));
}

export function applyStorageChange(agent: Pick<Agent, "setEnabled" | "setCardSize" | "keepCardChanged">, changes: Record<string, StorageChange | undefined>, area: string): void {
  if (area !== "local") return;
  if (ENABLED_KEY in changes) agent.setEnabled(changes[ENABLED_KEY]?.newValue !== false);
  if (CARD_SIZE_KEY in changes) agent.setCardSize(clampCardSize(changes[CARD_SIZE_KEY]?.newValue));
  // Only a change between on and off makes the compute frame again.
  if (keepCardFlipped(changes[KEEP_CARD_KEY])) agent.keepCardChanged();
}

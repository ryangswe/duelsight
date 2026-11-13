// SPDX-License-Identifier: Apache-2.0
// The popup's choices reaching the content script: a change to the stored main switch, card size
// or "Keep the card I'm pointing at" goes to the agent (index.ts listens; this is apart from the
// browser globals so that it can be tested).

import { ENABLED_KEY } from "../shared/enabled.js";
import { CARD_SIZE_KEY, clampCardSize } from "../shared/card-size.js";
import { KEEP_CARD_KEY, keepCardFlipped } from "../shared/keep-card.js";
import type { Agent } from "./agent.js";

type StorageChange = { oldValue?: unknown; newValue?: unknown };

export function applyStorageChange(agent: Pick<Agent, "setEnabled" | "setCardSize" | "keepCardChanged">, changes: Record<string, StorageChange | undefined>, area: string): void {
  if (area !== "local") return;
  if (ENABLED_KEY in changes) agent.setEnabled(changes[ENABLED_KEY]?.newValue !== false);
  if (CARD_SIZE_KEY in changes) agent.setCardSize(clampCardSize(changes[CARD_SIZE_KEY]?.newValue));
  // Only a change between on and off makes the compute frame again.
  if (keepCardFlipped(changes[KEEP_CARD_KEY])) agent.keepCardChanged();
}

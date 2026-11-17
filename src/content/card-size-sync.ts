// SPDX-License-Identifier: Apache-2.0
// The popup's card size reaching the content script: the stored size when the page opens, then
// each change. The host reads and follows the main switch and "Keep the card I'm pointing at"
// itself; the card size is DuelSight's own (the tooltip's size), so it is read here.

import type { StorageChanges } from "../../vendor/cardvision-browser/host-content.js";
import { CARD_SIZE_KEY, clampCardSize, DEFAULT_CARD_SIZE, readCardSize } from "../shared/card-size.js";
import type { KeyValueStorage } from "../settings/store.js";

/** Starts following the card size. The listener is added before the read, so a size the popup
 *  changed while the read was pending keeps the change: the read's answer (or its default, when it
 *  cannot be read) is older, and is not applied. Returns the stop. */
export function startCardSizeSync(
  view: { setCardSize(percent: number): boolean },
  host: { relayout(): void },
  storage: Pick<KeyValueStorage, "get">,
  changes: StorageChanges,
): () => void {
  let changed = false;
  const apply = (percent: number): void => {
    if (view.setCardSize(percent)) host.relayout();
  };
  const listener: Parameters<StorageChanges["addListener"]>[0] = (c, area) => {
    if (area !== "local" || !(CARD_SIZE_KEY in c)) return;
    changed = true;
    apply(clampCardSize(c[CARD_SIZE_KEY]?.newValue));
  };
  changes.addListener(listener);
  void readCardSize(storage)
    .catch(() => DEFAULT_CARD_SIZE)
    .then((percent) => {
      if (!changed) apply(percent);
    });
  return () => changes.removeListener(listener);
}

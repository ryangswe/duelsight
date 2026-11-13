// SPDX-License-Identifier: Apache-2.0
// The popup's "Card details" switch (shared/details-pref.ts): whether the tooltip shows the card's
// details panel beside its picture. On unless switched off; it behaves as every stored switch does
// (switch-control.ts). `onStored` hears the stored choice (read or pressed), for the card language
// menu, which only matters while the details are on.

import { DETAILS_KEY, readDetailsOn } from "../shared/details-pref.js";
import { initStoredSwitch } from "./switch-control.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** Fill the switch and keep it current. Returns its render function, for storage changes. */
export function initDetailsSwitch(doc: Document, local: Area, onStored?: (on: boolean) => void): { render(): Promise<void>; setActive(active: boolean): void } {
  return initStoredSwitch(doc, local, { id: "details", key: DETAILS_KEY, read: readDetailsOn }, onStored);
}

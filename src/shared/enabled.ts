// SPDX-License-Identifier: Apache-2.0
// The popup's on/off switch. On unless switched off.

import type { KeyValueStorage } from "../settings/store.js";

export const ENABLED_KEY = "enabled";

export async function readEnabled(storage: Pick<KeyValueStorage, "get">): Promise<boolean> {
  return (await storage.get(ENABLED_KEY))[ENABLED_KEY] !== false;
}

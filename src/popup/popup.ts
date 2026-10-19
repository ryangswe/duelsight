// SPDX-License-Identifier: Apache-2.0
// The popup: the master switch, and a "New version available" line when there is one (view.ts).

import { initPopup } from "./view.js";

initPopup({
  doc: document,
  local: chrome.storage.local as never,
  onChanged: chrome.storage.onChanged as never,
  version: chrome.runtime.getManifest().version,
});
chrome.runtime.sendMessage({ kind: "settings:refresh" }).catch(() => undefined);

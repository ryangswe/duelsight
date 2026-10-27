// SPDX-License-Identifier: Apache-2.0
// The popup: the master switch, the card details switch, the card-size dial, and a "New version
// available" line when there is one (view.ts).

import { initPopup } from "./view.js";

declare const __TARGET__: "chrome" | "firefox";

initPopup({
  doc: document,
  local: chrome.storage.local as never,
  onChanged: chrome.storage.onChanged as never,
  version: chrome.runtime.getManifest().version,
  // Firefox installs only signed add-ons and updates them itself: no zip install to tell about.
  updateNotices: __TARGET__ !== "firefox",
});
chrome.runtime.sendMessage({ kind: "settings:refresh" }).catch(() => undefined);

// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).

import { Agent } from "./agent.js";
import { ENABLED_KEY, readEnabled } from "../shared/enabled.js";

declare const __DEV__: boolean;

const agent = new Agent({ dev: __DEV__ });
agent.start();
void readEnabled(chrome.storage.local).then((enabled) => agent.setEnabled(enabled));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && ENABLED_KEY in changes) agent.setEnabled(changes[ENABLED_KEY]?.newValue !== false);
  if (area === "local") agent.onStorageChanged(changes);
});

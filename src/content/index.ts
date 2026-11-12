// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).

import { Agent } from "./agent.js";
import { ENABLED_KEY, readEnabled } from "../shared/enabled.js";
import { CARD_SIZE_KEY, clampCardSize, readCardSize } from "../shared/card-size.js";

declare const __DEV__: boolean;

const agent = new Agent({ dev: __DEV__ });
agent.start();
void readEnabled(chrome.storage.local).then((enabled) => agent.setEnabled(enabled));
void readCardSize(chrome.storage.local).then((percent) => agent.setCardSize(percent));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && ENABLED_KEY in changes) agent.setEnabled(changes[ENABLED_KEY]?.newValue !== false);
  if (area === "local" && CARD_SIZE_KEY in changes) agent.setCardSize(clampCardSize(changes[CARD_SIZE_KEY]?.newValue));
});

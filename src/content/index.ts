// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).

import { Agent } from "./agent.js";
import { readEnabled } from "../shared/enabled.js";
import { readCardSize } from "../shared/card-size.js";
import { applyStorageChange } from "./storage-sync.js";

declare const __DEV__: boolean;

const agent = new Agent({ dev: __DEV__ });
agent.start();
void readEnabled(chrome.storage.local).then((enabled) => agent.setEnabled(enabled));
void readCardSize(chrome.storage.local).then((percent) => agent.setCardSize(percent));
chrome.storage.onChanged.addListener((changes, area) => applyStorageChange(agent, changes, area));

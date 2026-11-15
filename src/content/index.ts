// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).

import { Agent } from "./agent.js";
import { applyStorageChange, applyStoredChoices } from "./storage-sync.js";

declare const __DEV__: boolean;

const agent = new Agent({ dev: __DEV__ });
agent.start();
void applyStoredChoices(agent, chrome.storage.local);
chrome.storage.onChanged.addListener((changes, area) => applyStorageChange(agent, changes, area));

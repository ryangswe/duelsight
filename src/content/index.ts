// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).

import { Agent } from "./agent.js";
import { startStorageSync } from "./storage-sync.js";

declare const __DEV__: boolean;

const agent = new Agent({ dev: __DEV__ });
agent.start();
chrome.storage.onChanged.addListener(startStorageSync(agent, chrome.storage.local));

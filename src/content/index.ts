// SPDX-License-Identifier: Apache-2.0
// Content script entry: runs in YouTube and Twitch pages (and the local test page in a dev build).
// The toolkit's shared hover host does the page's work (host-content.js): it follows the main
// video, makes and removes the two frames, gives pictures to the compute frame only on the
// viewer's own pointer, outlines the card and decides when it shows. DuelSight's tooltip frame is
// sized and placed by its view adapter (view.ts), at the popup's card size (card-size-sync.ts).

import { startHostContent } from "../../vendor/cardvision-browser/host-content.js";
import { productConfig } from "../shared/product.js";
import { startCardSizeSync } from "./card-size-sync.js";
import { createTooltipView } from "./view.js";

declare const __DEV__: boolean;

const view = createTooltipView();
const host = startHostContent({
  config: productConfig(__DEV__),
  win: window,
  doc: document,
  extensionUrl: (path) => chrome.runtime.getURL(path),
  storage: chrome.storage.local,
  storageChanges: chrome.storage.onChanged,
  view,
});
startCardSizeSync(view, host, chrome.storage.local, chrome.storage.onChanged);

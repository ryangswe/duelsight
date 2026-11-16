// SPDX-License-Identifier: Apache-2.0
// What DuelSight tells the toolkit's shared hover host about itself (its ProductConfig). The
// content script and the compute frame pass the same values; each realm imports its own host file
// (host-content.js, host-compute.js), so this file names no host type.

import { CONFIG } from "../config.js";
import { OUTLINE_COLOR, OUTLINE_GLOW_COLOR, VIDEO_SITES } from "../constants.js";
import { TAG } from "./messages.js";

export function productConfig(dev: boolean) {
  return {
    // The two-frame messages' tag, and the outline's marker (data-duelsight="outline").
    tag: TAG,
    name: CONFIG.name,
    sites: { youtube: VIDEO_SITES.youtube, twitch: VIDEO_SITES.twitch },
    // A development build also serves the local test page (http://127.0.0.1, http://localhost).
    dev,
    frames: { compute: "compute.html", view: "tooltip.html" },
    outline: { edgeColor: OUTLINE_COLOR, glowColor: OUTLINE_GLOW_COLOR },
    // DuelSight's releases have no geometric stage (a game reason: HOVER-DEVIATIONS.md).
    capabilities: { geometricStage: false },
  };
}

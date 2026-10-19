// SPDX-License-Identifier: Apache-2.0
// Which pages the extension attaches to. The content script is loaded on every page of the video
// sites the config turns on (YouTube and Twitch navigate without reloading), and attaches only
// where this says so.

import { type VideoSites } from "../config.js";
import { VIDEO_SITES } from "../constants.js";

/** A channel's live page, which holds the watch player while the channel is live. */
const CHANNEL_LIVE = /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/live\/?$/;

/** YouTube: a watch page, a channel's live page, a live page or an embedded player. Twitch: every page (live channels,
 *  videos and clips all play in one player). The local test page in a dev build. */
export function isActivePage(url: URL, dev: boolean, sites: VideoSites = VIDEO_SITES): boolean {
  if (sites.youtube && url.protocol === "https:" && url.hostname === "www.youtube.com") {
    return url.pathname === "/watch" || url.pathname.startsWith("/embed/") || url.pathname.startsWith("/live/") || CHANNEL_LIVE.test(url.pathname);
  }
  if (sites.twitch && url.protocol === "https:" && url.hostname === "www.twitch.tv") return true;
  return dev && url.protocol === "http:" && url.hostname === "127.0.0.1";
}

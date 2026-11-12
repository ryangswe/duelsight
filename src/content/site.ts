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
  return dev && url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
}

/** Twitch's own pages under its first path segment: none of them is a channel. */
const TWITCH_NOT_CHANNEL = new Set([
  "directory", "search", "settings", "subscriptions", "inventory", "wallet", "drops", "downloads", "jobs", "p", "turbo",
  "prime", "friends", "messages", "following", "videos", "u", "store", "bits", "creatorcamp", "broadcast", "moderator", "popout",
]);
/** A Twitch channel name: 1-25 letters, digits or underscores. */
const TWITCH_CHANNEL = /^[A-Za-z0-9_]{1,25}$/;

/** Pages where a playing video is the one the viewer came to watch, so the model loads when it
 *  plays (owner, 2026-11-10: "Products load at video play"). YouTube: a watch page and a live page,
 *  not an embedded player, which another website may start on its own, muted (owner, 2026-11-12:
 *  "Wait for a hover"). Twitch: a channel (`/name`), a video (`/videos/123`) and a clip
 *  (`/name/clip/slug`); not the front page, the directory, search or settings, whose players are
 *  previews that play on their own (hover-speed plan, 2026-11-12). On the others, a hover over the
 *  video still loads it, as before the load at play. */
export function loadsAtPlay(url: URL, dev: boolean, sites: VideoSites = VIDEO_SITES): boolean {
  if (!isActivePage(url, dev, sites)) return false;
  if (url.hostname === "www.youtube.com") return !url.pathname.startsWith("/embed/");
  if (url.hostname !== "www.twitch.tv") return true;
  const parts = url.pathname.split("/").filter((p) => p !== "");
  if (parts[0]?.toLowerCase() === "videos") return parts.length === 2 && /^\d+$/.test(parts[1]!);
  if (parts.length === 0 || !TWITCH_CHANNEL.test(parts[0]!) || TWITCH_NOT_CHANNEL.has(parts[0]!.toLowerCase())) return false;
  return parts.length === 1 || (parts.length === 3 && parts[1] === "clip");
}

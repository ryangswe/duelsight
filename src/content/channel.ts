// SPDX-License-Identifier: Apache-2.0
// Which channel a video page belongs to, for the in-player on/off button: card hovers are turned
// on per channel, and per video where no channel is known (an embedded YouTube player).
//
//   yt:@handle, yt:UC…           a YouTube channel (from the page's owner link or the address)
//   yt-video:<id>                a YouTube video with no known channel
//   tw:<login>                   a Twitch channel (from the address or the page)
//   tw-video:<id>                a Twitch past broadcast with no known channel
//   local:<path>                 the local test page (dev builds)

/** Twitch's first path segments that are not channels. */
const TWITCH_RESERVED = new Set([
  "", "directory", "videos", "settings", "search", "p", "subscriptions", "inventory", "wallet", "drops", "friends",
  "messages", "downloads", "turbo", "prime", "jobs", "store", "login", "signup", "popout", "moderator", "embed",
  "team", "clips", "collections", "schedule", "about", "following", "u", "event", "broadcast", "dashboard",
]);

/** The Twitch channel a path is, when it is exactly a channel's address: `/login` or `/login/`. */
function twitchChannelPath(path: string): string | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length !== 1) return null;
  const login = segments[0]!;
  return !TWITCH_RESERVED.has(login.toLowerCase()) && TWITCH_LOGIN.test(login) ? login.toLowerCase() : null;
}

const HANDLE = /^@[A-Za-z0-9._-]{1,100}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{10,40}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
const TWITCH_LOGIN = /^[A-Za-z0-9_]{2,40}$/;

/** A YouTube channel from a path: `/@handle…`, `/channel/UC…`. */
function youtubeChannelFromPath(path: string): string | null {
  const [first, second] = path.split("/").filter(Boolean);
  if (first && HANDLE.test(first)) return `yt:${first.toLowerCase()}`;
  if (first === "channel" && second && CHANNEL_ID.test(second)) return `yt:${second}`;
  return null;
}

/**
 * The key a page's video is turned on under. `ownerHref` is the channel link the page shows
 * (YouTube's owner link, Twitch's channel link on a past broadcast), or null.
 */
export function channelKey(url: URL, ownerHref: string | null): string | null {
  if (url.hostname === "www.youtube.com") {
    const fromUrl = youtubeChannelFromPath(url.pathname);
    if (fromUrl) return fromUrl;
    if (ownerHref) {
      try {
        const owner = youtubeChannelFromPath(new URL(ownerHref, url).pathname);
        if (owner) return owner;
      } catch {
        // not an address: ignored
      }
    }
    const v = url.searchParams.get("v");
    if (url.pathname === "/watch" && v && VIDEO_ID.test(v)) return `yt-video:${v}`;
    const [first, second] = url.pathname.split("/").filter(Boolean);
    if ((first === "embed" || first === "live") && second && VIDEO_ID.test(second)) return `yt-video:${second}`;
    return null;
  }
  if (url.hostname === "www.twitch.tv") {
    const [first, second] = url.pathname.split("/").filter(Boolean);
    if (first && !TWITCH_RESERVED.has(first.toLowerCase()) && TWITCH_LOGIN.test(first)) return `tw:${first.toLowerCase()}`;
    if (ownerHref) {
      try {
        const owner = new URL(ownerHref, url);
        const login = owner.hostname === "www.twitch.tv" ? twitchChannelPath(owner.pathname) : null;
        if (login) return `tw:${login}`;
      } catch {
        // not an address: ignored
      }
    }
    if (first === "videos" && second && /^\d{1,15}$/.test(second)) return `tw-video:${second}`;
    return null;
  }
  if (url.protocol === "http:" && url.hostname === "127.0.0.1") return `local:${url.pathname}`;
  return null;
}

/**
 * The channel link a page shows, when it is sure to be the shown video's. On a YouTube watch page
 * the owner link is updated some time after the address, so it counts only once the watch page
 * itself shows the new video (`ytd-watch-flexy[video-id]` equals `v`); until then the video is
 * keyed on its own. On Twitch, the first link of the channel area that is exactly a channel's
 * address (not /directory, /team, /videos…).
 */
export function ownerHrefOf(doc: Document, url: URL): string | null {
  if (url.hostname === "www.youtube.com") {
    const v = url.searchParams.get("v");
    if (url.pathname === "/watch" && v) {
      const flexy = doc.querySelector("ytd-watch-flexy");
      if (!flexy || flexy.getAttribute("video-id") !== v) return null;
    }
    const pick = (selector: string): string | null => doc.querySelector<HTMLAnchorElement>(selector)?.getAttribute("href") ?? null;
    return pick("ytd-watch-metadata #owner ytd-channel-name a") ?? pick("#owner ytd-channel-name a") ?? pick("ytd-video-owner-renderer a[href^='/@']");
  }
  if (url.hostname === "www.twitch.tv") {
    const links = doc.querySelectorAll<HTMLAnchorElement>(
      "[data-a-target='stream-info-card-component'] a[href], .channel-info-content a[href], a[data-a-target='player-info-title']",
    );
    for (const a of links) {
      const href = a.getAttribute("href");
      if (!href) continue;
      try {
        const u = new URL(href, url);
        if (u.hostname === "www.twitch.tv" && twitchChannelPath(u.pathname)) return href;
      } catch {
        // not an address
      }
    }
  }
  return null;
}

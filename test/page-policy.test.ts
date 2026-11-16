// SPDX-License-Identifier: Apache-2.0
// DuelSight's pages under the shared hover host's site policy (pagePolicy, hover spec S-G1 to
// S-G3): where hovers run, and where the model loads when the video plays rather than at the first
// hover. The full table is the toolkit's; these are DuelSight's own rows, kept from before the host.
import { describe, expect, it } from "vitest";

import { pagePolicy } from "../vendor/cardvision-browser/host-content.js";

const BOTH_SITES = { youtube: true, twitch: true };

function loadsAtPlay(url: string, dev: boolean): boolean {
  const policy = pagePolicy(new URL(url), { sites: BOTH_SITES, dev });
  return policy.active && policy.load === "play";
}

describe("the pages hovers run on", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc", false, true],
    ["https://www.youtube.com/embed/abc", false, true],
    ["https://www.youtube.com/live/abc", false, true],
    ["https://www.youtube.com/", false, false],
    ["https://www.youtube.com/results?search_query=one+piece", false, false],
    ["https://www.youtube.com/shorts/abc", false, false],
    ["https://www.youtube.com/@somechannel/live", false, true],
    ["https://www.youtube.com/@somechannel/live/", false, true],
    ["https://www.youtube.com/channel/UC123abc/live", false, true],
    ["https://www.youtube.com/c/SomeName/live", false, true],
    ["https://www.youtube.com/user/somename/live", false, true],
    ["https://www.youtube.com/@somechannel", false, false],
    ["https://www.youtube.com/@somechannel/videos", false, false],
    ["https://www.youtube.com/@a/b/live", false, false],
    ["https://www.youtube.com/feed/live", false, false],
    ["https://www.twitch.tv/somechannel", false, true],
    ["https://www.twitch.tv/videos/123", false, true],
    ["http://127.0.0.1:8770/", false, false],
    ["http://127.0.0.1:8770/", true, true],
    ["https://example.org/watch", true, false],
  ])("%s (dev %s) → %s", (url, dev, active) => expect(pagePolicy(new URL(url), { sites: BOTH_SITES, dev }).active).toBe(active));
});

describe("the pages that load when the video plays", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc", false, true],
    ["https://www.youtube.com/embed/abc", false, false],
    ["https://www.youtube.com/embed/abc?autoplay=1&mute=1", false, false],
    ["https://www.youtube.com/live/abc", false, true],
    ["https://www.youtube.com/@somechannel/live", false, true],
    ["https://www.youtube.com/", false, false],
    ["https://www.twitch.tv/somechannel", false, true],
    ["https://www.twitch.tv/somechannel/", false, true],
    ["https://www.twitch.tv/Some_Channel_42", false, true],
    ["https://www.twitch.tv/videos/123456", false, true],
    // The shared table (S-G3) takes Twitch's own `/videos/` in lowercase only; before the host,
    // DuelSight took any case.
    ["https://www.twitch.tv/Videos/123456", false, false],
    // Twitch side pages that are not channels wait for a hover (S-G3's seven); before the host,
    // DuelSight took five of them for channels.
    ["https://www.twitch.tv/collections", false, false],
    ["https://www.twitch.tv/payments", false, false],
    ["https://www.twitch.tv/privacy", false, false],
    ["https://www.twitch.tv/products", false, false],
    ["https://www.twitch.tv/team", false, false],
    ["https://www.twitch.tv/following", false, false],
    // A path is read as written: no empty segments dropped, and a clip's slug is checked.
    ["https://www.twitch.tv//somechannel", false, false],
    ["https://www.twitch.tv/somechannel/clip/bad.slug", false, false],
    // The moderator view and the popout player wait for a hover (owner, 2026-11-12, #129).
    ["https://www.twitch.tv/moderator/somechannel", false, false],
    ["https://www.twitch.tv/popout/somechannel/player", false, false],
    ["https://www.twitch.tv/somechannel/clip/SomeClip-Slug_1", false, true],
    ["https://www.twitch.tv/", false, false],
    ["https://www.twitch.tv/directory", false, false],
    ["https://www.twitch.tv/directory/category/yu-gi-oh-master-duel", false, false],
    ["https://www.twitch.tv/directory/following", false, false],
    ["https://www.twitch.tv/search?term=yugioh", false, false],
    ["https://www.twitch.tv/settings/profile", false, false],
    ["https://www.twitch.tv/Directory", false, false],
    ["https://www.twitch.tv/videos", false, false],
    ["https://www.twitch.tv/videos/abc", false, false],
    ["https://www.twitch.tv/somechannel/videos", false, false],
    ["https://www.twitch.tv/somechannel/about", false, false],
    ["https://www.twitch.tv/somechannel/clip", false, false],
    ["https://www.twitch.tv/some.channel", false, false],
    ["http://127.0.0.1:8770/", true, true],
    ["http://127.0.0.1:8770/", false, false],
  ])("%s (dev %s) → %s", (url, dev, loads) => expect(loadsAtPlay(url, dev)).toBe(loads));
});


// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { channelKey, ownerHrefOf } from "../src/content/channel.js";

function page(html: string): Document {
  document.body.innerHTML = html;
  return document;
}

describe("ownerHrefOf", () => {
  it("YouTube: trusts the owner link only once the watch page shows the video in the address", () => {
    const url = new URL("https://www.youtube.com/watch?v=NEWvideo123");
    const owner = `<ytd-watch-metadata><div id="owner"><ytd-channel-name><a href="/@OldChannel">Old</a></ytd-channel-name></div></ytd-watch-metadata>`;
    // Still the previous video's page: the link may be the old channel's.
    let doc = page(`<ytd-watch-flexy video-id="OLDvideo123"></ytd-watch-flexy>${owner}`);
    expect(ownerHrefOf(doc, url)).toBeNull();
    expect(channelKey(url, ownerHrefOf(doc, url))).toBe("yt-video:NEWvideo123");
    doc = page(`<ytd-watch-flexy video-id="NEWvideo123"></ytd-watch-flexy>${owner.replace("OldChannel", "NewChannel")}`);
    expect(channelKey(url, ownerHrefOf(doc, url))).toBe("yt:@newchannel");
  });

  it("Twitch: takes the first link that is a channel's address, not /directory, /team or /videos", () => {
    const url = new URL("https://www.twitch.tv/videos/2600000000");
    const doc = page(`<div class="channel-info-content">
      <a href="/directory/category/one-piece-card-game">Category</a>
      <a href="/team/opteam">Team</a>
      <a href="/somestreamer/videos">Videos</a>
      <a href="/somestreamer">SomeStreamer</a>
    </div>`);
    expect(ownerHrefOf(doc, url)).toBe("/somestreamer");
    expect(channelKey(url, ownerHrefOf(doc, url))).toBe("tw:somestreamer");
    expect(channelKey(url, "/directory")).toBe("tw-video:2600000000");
    expect(channelKey(url, "/somestreamer/videos")).toBe("tw-video:2600000000");
  });
});

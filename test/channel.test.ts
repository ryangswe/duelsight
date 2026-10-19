// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { channelKey } from "../src/content/channel.js";
import { applyChannelChanges, channelOn, MAX_CHANNELS, readChannels, setChannel } from "../src/shared/channels.js";
import { memoryStorage } from "./helpers/memory-storage.js";

describe("channelKey", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abcDEF12345", "/@ExampleCardChannel", "yt:@examplecardchannel"],
    ["https://www.youtube.com/watch?v=abcDEF12345", "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv", "yt:UCabcdefghijklmnopqrstuv"],
    ["https://www.youtube.com/watch?v=abcDEF12345", null, "yt-video:abcDEF12345"],
    ["https://www.youtube.com/watch?v=abcDEF12345", "/results?q=x", "yt-video:abcDEF12345"],
    ["https://www.youtube.com/@SomeOne/live", null, "yt:@someone"],
    ["https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv/live", null, "yt:UCabcdefghijklmnopqrstuv"],
    ["https://www.youtube.com/embed/abcDEF12345", null, "yt-video:abcDEF12345"],
    ["https://www.youtube.com/live/abcDEF12345", "/@Owner", "yt:@owner"],
    ["https://www.youtube.com/", null, null],
    ["https://www.twitch.tv/ExampleChannel", null, "tw:examplechannel"],
    ["https://www.twitch.tv/examplechannel/videos?filter=archives", null, "tw:examplechannel"],
    ["https://www.twitch.tv/videos/2600000000", "/somestreamer", "tw:somestreamer"],
    ["https://www.twitch.tv/videos/2600000000", null, "tw-video:2600000000"],
    ["https://www.twitch.tv/directory/category/one-piece-card-game", null, null],
    ["http://127.0.0.1:8770/", null, "local:/"],
  ])("%s (owner %s) → %s", (url, owner, key) => expect(channelKey(new URL(url), owner)).toBe(key));
});

describe("channels turned on", () => {
  it("keeps one entry per channel: on remembers when, off forgets", async () => {
    const s = memoryStorage();
    expect(channelOn(await readChannels(s), "tw:a")).toBe(false);
    await setChannel(s, "tw:a", true, 5);
    expect(s.data).toEqual({ "channel:tw:a": 5 });
    expect(channelOn(await readChannels(s), "tw:a")).toBe(true);
    expect(channelOn(await readChannels(s), "tw:b")).toBe(false);
    await setChannel(s, "tw:a", false);
    expect(s.data).toEqual({});
  });

  it("two tabs turning channels on at once keep both (no shared list to overwrite)", async () => {
    const s = memoryStorage();
    await Promise.all([setChannel(s, "tw:a", true, 1), setChannel(s, "tw:b", true, 2), setChannel(s, "yt:@c", true, 3)]);
    expect(Object.keys(await readChannels(s)).sort()).toEqual(["tw:a", "tw:b", "yt:@c"]);
  });

  it("never treats an unknown channel as on", () => {
    expect(channelOn({ "tw:a": 1 }, null)).toBe(false);
    expect(channelOn({ "tw:a": 1 }, "constructor")).toBe(false);
  });

  it("forgets the oldest channels past the limit", async () => {
    const s = memoryStorage();
    for (let i = 0; i <= MAX_CHANNELS; i += 1) await setChannel(s, `tw:c${i}`, true, i);
    const map = await readChannels(s);
    expect(Object.keys(map)).toHaveLength(MAX_CHANNELS);
    expect(channelOn(map, "tw:c0")).toBe(false);
    expect(channelOn(map, `tw:c${MAX_CHANNELS}`)).toBe(true);
  });

  it("ignores other entries and malformed values", async () => {
    expect(await readChannels(memoryStorage({ enabled: true, "channel:tw:a": "yes", "channel:tw:b": 4 }))).toEqual({ "tw:b": 4 });
  });

  it("applies another tab's changes entry by entry", () => {
    const map = { "tw:a": 1 };
    expect(applyChannelChanges(map, { enabled: { newValue: false } })).toBe(map);
    expect(applyChannelChanges(map, { "channel:tw:b": { newValue: 2 }, "channel:tw:a": { newValue: undefined } })).toEqual({ "tw:b": 2 });
  });
});

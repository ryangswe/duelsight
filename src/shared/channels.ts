// SPDX-License-Identifier: Apache-2.0
// The channels (and channel-less videos) card hovers are turned on for, in chrome.storage.local:
// one entry per channel, `channel:<key>` → the time it was turned on. One entry each, so that two
// tabs turning channels on or off at once never overwrite each other (no read-modify-write of a
// shared list). Nothing is kept for a channel that is off.

export const CHANNEL_PREFIX = "channel:";
export const BUTTON_INTRO_KEY = "button.introSeen";
/** Most channels remembered; the oldest are forgotten first. */
export const MAX_CHANNELS = 500;

/** The part of chrome.storage.local used here. */
export interface ChannelStorage {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

/** Channel key → when it was turned on. */
export type ChannelMap = Record<string, number>;

export function storageKeyOf(channel: string): string {
  return CHANNEL_PREFIX + channel;
}

/** The channels in a set of stored entries (any other entries are ignored). */
export function channelsIn(entries: Record<string, unknown>): ChannelMap {
  const out: ChannelMap = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k.startsWith(CHANNEL_PREFIX) && typeof v === "number" && k.length <= 160) out[k.slice(CHANNEL_PREFIX.length)] = v;
  }
  return out;
}

export async function readChannels(storage: Pick<ChannelStorage, "get">): Promise<ChannelMap> {
  return channelsIn(await storage.get(null));
}

export function channelOn(map: ChannelMap, key: string | null): boolean {
  return key !== null && Object.hasOwn(map, key);
}

/** Turn a channel on (remembering when) or off (forgetting it). */
export async function setChannel(storage: ChannelStorage, key: string, on: boolean, now = Date.now()): Promise<void> {
  if (!on) {
    await storage.remove(storageKeyOf(key));
    return;
  }
  await storage.set({ [storageKeyOf(key)]: now });
  // Past the limit, the oldest are forgotten (a race here only forgets one more or one fewer).
  const map = await readChannels(storage);
  const keys = Object.keys(map);
  if (keys.length > MAX_CHANNELS) {
    const oldest = keys.sort((a, b) => map[a]! - map[b]!).slice(0, keys.length - MAX_CHANNELS);
    await storage.remove(oldest.map(storageKeyOf));
  }
}

/** Apply a storage change (chrome.storage.onChanged) to a map, entry by entry. */
export function applyChannelChanges(map: ChannelMap, changes: Record<string, { newValue?: unknown } | undefined>): ChannelMap {
  let out: ChannelMap | null = null;
  for (const [k, change] of Object.entries(changes)) {
    if (!k.startsWith(CHANNEL_PREFIX)) continue;
    out ??= { ...map };
    const channel = k.slice(CHANNEL_PREFIX.length);
    if (typeof change?.newValue === "number") out[channel] = change.newValue;
    else delete out[channel];
  }
  return out ?? map;
}

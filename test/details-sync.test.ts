// SPDX-License-Identifier: Apache-2.0
// Which details file the tooltip frame loads, and when: once per file, again after a failure,
// only while the panel is on, and never a superseded file.
import { beforeEach, describe, expect, it } from "vitest";

import type { DetailsTable } from "../src/details/details.js";
import type { Settings } from "../src/settings/schema.js";
import { DetailsSync } from "../src/tooltip/details-sync.js";

const SETTINGS_URL = "https://cdn.example/duelsight/config.json";
const EN = { path: "details/en-1.json", sha256: "a".repeat(64) };
const EN_2 = { path: "details/en-2.json", sha256: "b".repeat(64) };
const FR = { path: "details/fr-1.json", sha256: "c".repeat(64) };
const url = (source: { path: string }) => new URL(source.path, SETTINGS_URL).href;

const settings = (over: Partial<Settings> = {}): Settings => ({
  schemaVersion: 1,
  updatedAt: "2026-11-05T00:00:00Z",
  namesOnly: false,
  primary: null,
  fallbacks: [],
  update: null,
  details: EN,
  localDetails: { fr: FR },
  ...over,
});

/** A load the test settles by hand. */
interface PendingLoad {
  url: string;
  sha256: string;
  resolve(table: DetailsTable | null): void;
  reject(error: Error): void;
}

const table = (name: string) => ({ name }) as unknown as DetailsTable;

let loads: PendingLoad[];
let shown: Array<DetailsTable | null>;
let switches: boolean[];
let forgets: number;
let languages: string[];

const build = (on = true, cardLanguage?: string) =>
  new DetailsSync(
    {
      setDetails: (t) => void shown.push(t),
      setDetailsOn: (o) => void switches.push(o),
      load: (u, sha256) =>
        new Promise((resolve, reject) => {
          loads.push({ url: u, sha256, resolve, reject });
        }),
      forget: () => void (forgets += 1),
      languages: () => languages,
      settingsUrl: SETTINGS_URL,
    },
    on,
    cardLanguage,
  );

const tick = async () => {
  for (let i = 0; i < 3; i += 1) await new Promise((r) => setTimeout(r, 0));
};

beforeEach(() => {
  loads = [];
  shown = [];
  switches = [];
  forgets = 0;
  languages = ["en-US"];
});

describe("details sync", () => {
  it("loads the chosen file once, and gives the tooltip its table", async () => {
    const sync = build();
    sync.sync(settings());
    expect(loads.map((l) => [l.url, l.sha256])).toEqual([[url(EN), EN.sha256]]);
    // Synced again while it loads, and after: not loaded again.
    sync.sync(settings());
    loads[0]!.resolve(table("en"));
    await tick();
    sync.sync(settings());
    expect(loads).toHaveLength(1);
    expect(shown).toEqual([table("en")]);
    expect(switches).toEqual([true, true, true]);
  });

  it("tries again at the next sync after a load that failed", async () => {
    const sync = build();
    sync.sync(settings());
    loads[0]!.resolve(null);
    await tick();
    expect(shown).toEqual([null]);
    // The hourly settings refresh syncs again: the same file is loaded again, and this time works.
    sync.sync(settings());
    expect(loads).toHaveLength(2);
    expect(loads[1]!.url).toBe(url(EN));
    loads[1]!.resolve(table("en"));
    await tick();
    expect(shown).toEqual([null, table("en")]);
    sync.sync(settings());
    expect(loads).toHaveLength(2);
  });

  it("tries again after a load that threw", async () => {
    const sync = build();
    sync.sync(settings());
    loads[0]!.reject(new Error("offline"));
    await tick();
    expect(shown).toEqual([null]);
    sync.sync(settings());
    expect(loads).toHaveLength(2);
  });

  it("ignores a superseded file's load, whether it works or fails, and keeps the newer one", async () => {
    const sync = build();
    sync.sync(settings());
    sync.sync(settings({ details: EN_2 }));
    expect(loads.map((l) => l.url)).toEqual([url(EN), url(EN_2)]);
    // The old file fails late: the newer load is still the one in hand, so no second load of it.
    loads[0]!.resolve(null);
    await tick();
    expect(shown).toEqual([]);
    sync.sync(settings({ details: EN_2 }));
    expect(loads).toHaveLength(2);
    loads[1]!.resolve(table("en-2"));
    await tick();
    expect(shown).toEqual([table("en-2")]);
    // An old load that works late is not shown either.
    sync.sync(settings({ details: EN }));
    sync.sync(settings({ details: EN_2 }));
    loads[2]!.resolve(table("en"));
    await tick();
    expect(shown).toEqual([table("en-2")]);
  });

  it("loads nothing while the panel is off, and loads once it is turned on", () => {
    const sync = build(false);
    sync.sync(settings());
    expect(loads).toHaveLength(0);
    expect(switches).toEqual([false]);
    sync.detailsOn = true;
    sync.sync(settings());
    expect(loads).toHaveLength(1);
    expect(switches).toEqual([false, true]);
  });

  it("follows the browser's language to the French file", () => {
    languages = ["fr-FR", "en"];
    build().sync(settings());
    expect(loads.map((l) => l.url)).toEqual([url(FR)]);
  });

  it("follows the card language over the browser's, and switches files when it changes", async () => {
    languages = ["en-US"];
    const sync = build(true, "fr");
    sync.sync(settings());
    expect(loads.map((l) => l.url)).toEqual([url(FR)]);
    loads[0]!.resolve(table("fr"));
    await tick();
    sync.cardLanguage = "en";
    sync.sync(settings());
    expect(loads.map((l) => l.url)).toEqual([url(FR), url(EN)]);
    loads[1]!.resolve(table("en"));
    await tick();
    // Automatic follows the browser again (English here): the file in hand stays.
    sync.cardLanguage = "auto";
    sync.sync(settings());
    expect(loads).toHaveLength(2);
    expect(shown).toEqual([table("fr"), table("en")]);
  });

  it("clears the panel and deletes the kept copy when the settings name no details file", async () => {
    const sync = build();
    sync.sync(settings());
    loads[0]!.resolve(table("en"));
    await tick();
    sync.sync(settings({ details: null }));
    expect(shown).toEqual([table("en"), null]);
    expect(forgets).toBe(1);
    // Named again: loaded again.
    sync.sync(settings());
    expect(loads).toHaveLength(2);
  });

  it("clears the panel, but keeps the copy, when the file's address is on another host", () => {
    const sync = build();
    sync.sync(settings({ details: { path: "https://elsewhere.example/details.json", sha256: EN.sha256 } }));
    expect(loads).toHaveLength(0);
    expect(shown).toEqual([null]);
    expect(forgets).toBe(0);
  });
});

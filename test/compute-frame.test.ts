// SPDX-License-Identifier: Apache-2.0
// DuelSight's compute frame on the toolkit's session (src/compute/frame.ts): the pages it serves,
// its tag, the shown card held through short gaps, and the card facts channel. The session's own
// rules (the worker's restart, rules 10 to 12, retries, the hold's details) are the toolkit's and
// tested there.
import { afterEach, describe, expect, it, vi } from "vitest";

import { SHOWN_HOLD } from "../vendor/cardvision-browser/compute-session.js";
import { computeFrameEnv, createFactsChannel, SHOWN_IDS_LIMIT } from "../src/compute/frame.js";
import type { ReleasePointer, RemoteReleaseChoice } from "../vendor/cardvision-browser/remote-release.js";
import { computeHarness } from "./helpers/compute-frame.js";
import { SITE_ORIGIN } from "./helpers/fork.js";

const ID = "0123456789abcdef";
const pointer: ReleasePointer = { id: ID, path: `vision/releases/${ID}/release.json`, sha256: "a".repeat(64), minimumExtensionVersion: "0.3.0", maximumExtensionVersion: null };
const remoteChoice = (): RemoteReleaseChoice => ({
  source: "remote",
  pointer,
  request: { kind: "load", releaseUrl: "release.json", files: {}, wasmPaths: "w/" },
  facts: { "89631139": ["Dark Magician", "LOB", "full/89631139.jpg"], "999": ["Never Shown", null, "full/999.jpg"] },
  reused: 2,
  downloaded: 4_400_000,
  ms: 12,
});
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => vi.unstubAllGlobals());

describe("compute frame: the pages it serves", () => {
  it("starts inside a video site and says ready to that origin only, under DuelSight's tag", () => {
    const h = computeHarness();
    expect(h.started).not.toBeNull();
    const ready = h.toParent.find((p) => p.message.kind === "ready")!;
    expect(ready.origin).toBe(SITE_ORIGIN);
    expect(ready.message).toMatchObject({ duelsight: 1, kind: "ready", version: 1 });
    expect(ready.message.instance).toMatch(/^[0-9a-f]{16}$/);
  });

  it.each([
    ["another site", "https://example.com"],
    ["a hidden origin (\"null\")", "null"],
    ["no origin", undefined],
    ["the local test page in a store build", "http://127.0.0.1:8770"],
  ])("does not start in %s", (_, origin) => {
    expect(computeHarness({ parentOrigin: origin }).started).toBeNull();
  });

  it("does not start outside a frame", () => {
    expect(computeHarness({ framed: false }).started).toBeNull();
  });

  it("serves the local test page in a dev build", () => {
    expect(computeHarness({ parentOrigin: "http://127.0.0.1:8770", dev: true }).started).not.toBeNull();
  });

  it("acts only on messages from its parent window and origin", () => {
    const h = computeHarness();
    h.loaded();
    h.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false }, {}, SITE_ORIGIN);
    h.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false }, undefined, "https://example.com");
    expect(h.sent("capture")).toEqual([]);
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
  });
});

describe("compute frame: the shown card", () => {
  it("holds the shown card through short gaps (SHOWN_HOLD is on)", () => {
    expect(computeFrameEnv({ ...computeHarness().env }, createFactsChannel(() => undefined)).hold).toBe(SHOWN_HOLD);
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
    // One analysis with nothing there: still shown (without the hold it would go at once).
    h.scene.card = null;
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
    // A second in a row: gone.
    h.analyzeAt();
    expect(h.lastShown()).toBeNull();
  });
});

describe("compute frame: card facts", () => {
  it("with the remote release confirmed, a shown card carries its id and its facts go out first", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    h.analyzeAt();
    expect(h.lastShown()).toMatchObject({ cardId: "89631139", releaseId: ID });
    expect(h.facts).toEqual([{ releaseId: ID, cardId: "89631139", facts: { name: "Dark Magician", set: "LOB", art: "full/89631139.jpg" } }]);
    expect(h.order.slice(h.order.indexOf("facts"), h.order.indexOf("facts") + 2)).toEqual(["facts", "shown"]);
  });

  it("answers a tooltip's request only for a card it showed, of the release in effect", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    const facts = h.started!.facts;
    expect(facts.factsFor(ID, "89631139")).toBeNull();
    h.analyzeAt();
    expect(facts.factsFor(ID, "89631139")?.facts.name).toBe("Dark Magician");
    expect(facts.factsFor(ID, "999")).toBeNull();
    expect(facts.factsFor("fedcba9876543210", "89631139")).toBeNull();
  });

  it("sends no facts and no release id for the bundled release", () => {
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    expect(h.lastShown()).toEqual(expect.not.objectContaining({ releaseId: expect.anything() }));
    expect(h.facts).toEqual([]);
    expect(h.started!.facts.factsFor(ID, "89631139")).toBeNull();
  });

  it("stops sending facts once a restart left the remote release (rule 12)", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    h.analyzeAt();
    h.worker().fail();
    h.loaded();
    h.analyzeAt(0.21, 0.5);
    expect(h.started!.frame.release.source).toBe("bundled");
    expect(h.lastShown()?.releaseId).toBeUndefined();
    expect(h.facts).toHaveLength(1);
    expect(h.started!.facts.factsFor(ID, "89631139")).toBeNull();
  });

  it("keeps at most SHOWN_IDS_LIMIT shown ids, oldest dropped first", () => {
    const posted: string[] = [];
    const channel = createFactsChannel((m) => posted.push(m.cardId));
    const table: Record<string, [string, null, null]> = {};
    for (let i = 0; i <= SHOWN_IDS_LIMIT; i += 1) table[`c${i}`] = [`Card ${i}`, null, null];
    const release = { source: "remote" as const, id: ID, reason: "ok", table };
    for (let i = 0; i <= SHOWN_IDS_LIMIT; i += 1) channel.onShown({ cardId: `c${i}`, name: `Card ${i}`, releaseId: ID, box: { x: 0, y: 0, width: 1, height: 1 }, others: [] }, release);
    expect(posted).toHaveLength(SHOWN_IDS_LIMIT + 1);
    expect(channel.factsFor(ID, "c0")).toBeNull();
    expect(channel.factsFor(ID, `c${SHOWN_IDS_LIMIT}`)?.facts.name).toBe(`Card ${SHOWN_IDS_LIMIT}`);
  });
});

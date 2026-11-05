// SPDX-License-Identifier: Apache-2.0
// Settings compared by contents: the hourly refresh stores a new copy of an unchanged file.
import { describe, expect, it } from "vitest";

import type { Settings } from "../src/settings/schema.js";
import { sameSettings } from "../src/settings/same.js";
import { validateSettings } from "../src/settings/schema.js";
import CONFIG from "../cdn/config.json";

const base = (): Settings => ({
  schemaVersion: 1,
  updatedAt: "2026-11-05T00:00:00Z",
  namesOnly: false,
  primary: { id: "art", template: "https://art.example/{art}" },
  fallbacks: [
    { id: "a", template: "https://a.example/{art}" },
    { id: "b", template: "https://b.example/{art}" },
  ],
  update: null,
  details: { path: "details/en.json", sha256: "a".repeat(64) },
  localDetails: { fr: { path: "details/fr.json", sha256: "b".repeat(64) } },
  release: { id: "0123456789abcdef", minVersion: "0.3.0", files: ["x", "y"] },
});

describe("sameSettings", () => {
  it("is true for the same file read twice (two separate objects)", () => {
    const a = validateSettings(JSON.parse(JSON.stringify(CONFIG))).settings!;
    const b = validateSettings(JSON.parse(JSON.stringify(CONFIG))).settings!;
    expect(a).not.toBe(b);
    expect(sameSettings(a, b)).toBe(true);
  });

  it("ignores the order of keys, nested ones included", () => {
    const a = base();
    const b = Object.fromEntries(Object.entries(base()).reverse()) as unknown as Settings;
    b.release = { files: ["x", "y"], minVersion: "0.3.0", id: "0123456789abcdef" };
    expect(sameSettings(a, b)).toBe(true);
  });

  it("treats a key set to undefined as absent", () => {
    const a = base();
    delete a.release;
    expect(sameSettings(a, { ...a, release: undefined })).toBe(true);
  });

  it("tells null from absent, and false from absent", () => {
    const a = base();
    delete a.release;
    expect(sameSettings(a, { ...a, release: null })).toBe(false);
    expect(sameSettings(a, { ...a, release: false })).toBe(false);
  });

  it("sees a change anywhere: a flag, a nested value, the order of the fallbacks, the release", () => {
    expect(sameSettings(base(), { ...base(), namesOnly: true })).toBe(false);
    expect(sameSettings(base(), { ...base(), updatedAt: "2026-11-06T00:00:00Z" })).toBe(false);
    expect(sameSettings(base(), { ...base(), details: { path: "details/en.json", sha256: "c".repeat(64) } })).toBe(false);
    expect(sameSettings(base(), { ...base(), fallbacks: [...base().fallbacks].reverse() })).toBe(false);
    expect(sameSettings(base(), { ...base(), localDetails: {} })).toBe(false);
    expect(sameSettings(base(), { ...base(), release: { id: "fedcba9876543210", minVersion: "0.3.0", files: ["x", "y"] } })).toBe(false);
    expect(sameSettings(base(), { ...base(), release: { id: "0123456789abcdef", minVersion: "0.3.0", files: ["y", "x"] } })).toBe(false);
    expect(sameSettings(base(), { ...base(), release: "0123456789abcdef" })).toBe(false);
  });

  it("does not mistake a string for the same characters as a number or an array", () => {
    expect(sameSettings({ ...base(), release: "1" }, { ...base(), release: 1 })).toBe(false);
    expect(sameSettings({ ...base(), release: ["a,b"] }, { ...base(), release: ["a", "b"] })).toBe(false);
    expect(sameSettings({ ...base(), release: {} }, { ...base(), release: [] })).toBe(false);
  });
});

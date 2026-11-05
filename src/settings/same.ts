// SPDX-License-Identifier: Apache-2.0
// Whether two settings say the same thing. The settings file is fetched again about once an hour,
// and each fetch stores a new copy even when the file has not changed (store.ts). A page that
// reads the copy back gets a new object every time, so it compares the contents, not the object.

import type { Settings } from "./schema.js";

/** The value as JSON with every object's keys in sorted order, so key order never matters. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((k) => record[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(record[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** True when two validated settings have the same contents, whatever the order of their keys. */
export function sameSettings(a: Settings, b: Settings): boolean {
  return a === b || canonical(a) === canonical(b);
}

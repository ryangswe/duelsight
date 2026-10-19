// SPDX-License-Identifier: Apache-2.0
// The "New version available" line, for installs that never update by themselves (an unpacked
// folder). The settings file may name the newest version (`update`, an optional field). When the
// running version is lower, the popup shows one line with a link, until it is dismissed for
// that version. No field, no line.

import type { UpdateNotice } from "./schema.js";

export const DISMISSED_UPDATE_KEY = "update.dismissed";

/** Compare two `x.y.z` versions (a manifest may also say `x.y` or `x.y.z.w`); missing parts are 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** The notice to show, or null: none named, not newer than this version, or dismissed. */
export function updateNotice(update: UpdateNotice | null, running: string, dismissed: string | null): UpdateNotice | null {
  if (!update) return null;
  if (compareVersions(running, update.latest) >= 0) return null;
  if (dismissed !== null && compareVersions(dismissed, update.latest) >= 0) return null;
  return update;
}

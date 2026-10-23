// SPDX-License-Identifier: Apache-2.0
// Fetching the card details file once and keeping it (details.ts has its format).
//
//   - It is fetched from the address the settings file names (`details`: a path on the settings
//     file's own host, with the file's SHA-256), with no cookies and no referrer, only while the
//     details panel is on.
//   - It is kept in the extension's own Cache Storage (its origin, not the video site's), under
//     its address; a file whose bytes do not match the SHA-256 is never kept or used. Copies of
//     other addresses (an older file) are deleted once a new one is kept.
//   - The copy is checked against the SHA-256 again on every read.
//   - Anything that fails gives null: the tooltip shows pictures alone.

import { type DetailsTable, parseDetailsFile } from "./details.js";

/** The Cache Storage cache the details file is kept in. */
export const DETAILS_CACHE = "duelsight-details-v1";

export interface DetailsDeps {
  caches: Pick<CacheStorage, "open">;
  fetch: typeof fetch;
  /** The SHA-256 of some bytes, as 64 lowercase hex digits. */
  sha256(bytes: ArrayBuffer): Promise<string>;
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The details file at `url` with SHA-256 `sha256`: from the cache, else fetched and kept. */
export async function loadDetails(url: string, sha256: string, deps: DetailsDeps): Promise<DetailsTable | null> {
  try {
    const cache = await deps.caches.open(DETAILS_CACHE);
    let bytes: ArrayBuffer | null = null;
    const kept = await cache.match(url);
    if (kept) {
      const b = await kept.arrayBuffer();
      if ((await deps.sha256(b)) === sha256) bytes = b;
      else await cache.delete(url);
    }
    if (!bytes) {
      const response = await deps.fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-cache" });
      if (!response.ok) return null;
      const b = await response.arrayBuffer();
      if ((await deps.sha256(b)) !== sha256) return null;
      bytes = b;
      await cache.put(url, new Response(b, { headers: { "Content-Type": "application/json" } }));
      for (const request of await cache.keys()) if (request.url !== url) await cache.delete(request);
    }
    return parseDetailsFile(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** Delete the kept copy: the settings file names no details file any more (the maintainer took
 *  it down), so none is kept on the viewer's computer either. */
export async function forgetDetails(caches: Pick<CacheStorage, "delete">): Promise<void> {
  try {
    await caches.delete(DETAILS_CACHE);
  } catch {
    // Nothing kept, or no Cache Storage: nothing to delete.
  }
}

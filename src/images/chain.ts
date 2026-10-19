// SPDX-License-Identifier: Apache-2.0
// Which picture a tooltip shows (SETTINGS.md, "Resolution per hover").
//
//   1. `namesOnly` → no picture: name, number and link only.
//   2. The primary (when set), then each fallback in order: build the address; skip the source
//      when a placeholder it needs is unavailable for this card; load the picture. A failure
//      (network error, non-2xx, a body that does not decode as an image, or no picture within
//      5 s) moves to the next source.
//   3. Nothing loaded → name, number and link.
//
// A picture's type is never taken from its file name (many `.jpg` files hold PNG bytes): the
// body is decoded by the browser from its bytes, and a body that does not decode is a failure.
//
// A source that failed `SOURCE_FAILURE_LIMIT` times in a row is skipped for the rest of the
// session; `SourceHealth.reset` (fresh settings) tries it again.

import { IMAGE_TIMEOUT_MS, SOURCE_FAILURE_LIMIT } from "../constants.js";
import type { ImageSource, Settings } from "../settings/schema.js";
import { type CardRef, expandTemplate, type SourceFileMaps } from "../settings/templates.js";

/** Decodes a body as an image; rejects when it is not one. In a page: `createImageBitmap`. */
export type Decode = (blob: Blob) => Promise<void>;

export interface LoaderDeps {
  fetch: typeof fetch;
  decode: Decode;
  timeoutMs?: number;
}

export class ImageLoadError extends Error {}

/**
 * Load one picture: request, body and decode, all within the time limit. Resolves with the body
 * (to be shown from a blob: address), rejects with an `ImageLoadError` that says why.
 */
export async function loadImage(url: string, deps: LoaderDeps): Promise<Blob> {
  const timeoutMs = deps.timeoutMs ?? IMAGE_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ImageLoadError(`no picture within ${timeoutMs} ms`));
    }, timeoutMs);
  });
  const attempt = (async () => {
    let response: Response;
    try {
      response = await deps.fetch(url, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "default" });
    } catch (error) {
      throw new ImageLoadError(`network error (${String(error)})`);
    }
    if (!response.ok) throw new ImageLoadError(`HTTP ${response.status}`);
    const blob = await response.blob();
    try {
      await deps.decode(blob);
    } catch {
      throw new ImageLoadError("the body is not a picture");
    }
    return blob;
  })();
  try {
    return await Promise.race([attempt, timeout]);
  } finally {
    clearTimeout(timer);
    attempt.catch(() => undefined);
  }
}

/** Consecutive failures per source, for the session. */
export class SourceHealth {
  private readonly failures = new Map<string, number>();

  private key(source: ImageSource): string {
    return `${source.id}\n${source.template}`;
  }

  skipped(source: ImageSource): boolean {
    return (this.failures.get(this.key(source)) ?? 0) >= SOURCE_FAILURE_LIMIT;
  }

  record(source: ImageSource, ok: boolean): void {
    if (ok) this.failures.delete(this.key(source));
    else this.failures.set(this.key(source), (this.failures.get(this.key(source)) ?? 0) + 1);
  }

  /** Fresh settings were read: every source is tried again. */
  reset(): void {
    this.failures.clear();
  }
}

export interface Attempt {
  sourceId: string;
  url: string | null;
  /** Why this source gave no picture; null for the one that did. */
  failure: string | null;
}

export type Resolution =
  | { kind: "image"; blob: Blob; sourceId: string; url: string; attempts: Attempt[] }
  | { kind: "names"; reason: string; attempts: Attempt[] };

/** Resolve the picture for a card under the settings in effect. */
export async function resolveCardImage(
  card: CardRef,
  settings: Settings,
  maps: SourceFileMaps,
  health: SourceHealth,
  load: (url: string) => Promise<Blob>,
): Promise<Resolution> {
  const attempts: Attempt[] = [];
  if (settings.namesOnly) return { kind: "names", reason: "names only", attempts };
  const sources = [...(settings.primary ? [settings.primary] : []), ...settings.fallbacks];
  for (const source of sources) {
    if (health.skipped(source)) {
      attempts.push({ sourceId: source.id, url: null, failure: "skipped after repeated failures" });
      continue;
    }
    const url = expandTemplate(source.template, card, source.id, maps);
    if (url === null) {
      attempts.push({ sourceId: source.id, url: null, failure: "a placeholder is unavailable for this card" });
      continue;
    }
    try {
      const blob = await load(url);
      health.record(source, true);
      attempts.push({ sourceId: source.id, url, failure: null });
      return { kind: "image", blob, sourceId: source.id, url, attempts };
    } catch (error) {
      health.record(source, false);
      attempts.push({ sourceId: source.id, url, failure: error instanceof Error ? error.message : String(error) });
    }
  }
  return { kind: "names", reason: sources.length === 0 ? "no image source" : "no source gave a picture", attempts };
}

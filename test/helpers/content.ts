// SPDX-License-Identifier: Apache-2.0
// The content script as index.ts starts it (the toolkit's shared hover host with DuelSight's view
// adapter and card-size sync), driven the way the popup drives it: its switches written to a
// stand-in storage, whose changes reach the page as chrome.storage.onChanged would deliver them.

import { HIDE_DELAY_MS, type HostContent, startHostContent } from "../../vendor/cardvision-browser/host-content.js";
import { startCardSizeSync } from "../../src/content/card-size-sync.js";
import { createTooltipView } from "../../src/content/view.js";
import { productConfig } from "../../src/shared/product.js";
import { memoryStorage } from "./memory-storage.js";

export { HIDE_DELAY_MS };

type Listener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown } | undefined>, area: string) => void;

export class Agent {
  /** The popup's choices as stored. Hovers start off here, as before the popup's switch is read. */
  readonly storage = memoryStorage({ enabled: false });
  private readonly listeners = new Set<Listener>();
  private readonly changes = { addListener: (fn: Listener) => void this.listeners.add(fn), removeListener: (fn: Listener) => void this.listeners.delete(fn) };
  private host: HostContent | null = null;
  private stopSize: (() => void) | null = null;

  constructor(private readonly options: { dev: boolean }) {}

  start(): void {
    const view = createTooltipView();
    this.host = startHostContent({
      config: productConfig(this.options.dev),
      win: window,
      doc: document,
      extensionUrl: (path) => chrome.runtime.getURL(path),
      storage: this.storage,
      storageChanges: this.changes,
      view,
    });
    this.stopSize = startCardSizeSync(view, this.host, this.storage, this.changes);
  }

  get state(): HostContent["state"] | null {
    return this.host?.state ?? null;
  }

  /** The popup writes a value: stored, then every listener hears it, as the browser delivers it. */
  write(key: string, value: unknown): void {
    const oldValue = this.storage.data[key];
    this.storage.data[key] = value;
    for (const fn of [...this.listeners]) fn({ [key]: { oldValue, newValue: value } }, "local");
  }

  setEnabled(on: boolean): void {
    this.write("enabled", on);
  }

  setCardSize(percent: number): void {
    this.write("cardSize", percent);
  }

  /** "Keep the card I'm pointing at" turned over. */
  keepCardChanged(): void {
    this.write("keepCard", this.storage.data.keepCard === false);
  }

  stop(): void {
    this.stopSize?.();
    this.stopSize = null;
    this.host?.stop();
    this.host = null;
  }
}

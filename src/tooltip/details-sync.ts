// SPDX-License-Identifier: Apache-2.0
// Which details file the tooltip frame loads, and when (the frame's wiring is in tooltip.ts).
//
//   - The file is chosen from the settings, the popup's card language and the browser's languages
//     (language.ts), and loaded only while the details panel is on.
//   - A file already loaded, or loading, is not loaded again.
//   - A load that fails is forgotten, so the next sync tries again. A sync comes with the next
//     settings file the background stores (at most about once an hour, and only a usable one),
//     with the details switch, with the card language, and with a change of the browser's
//     language. Until then, pictures show alone.
//   - Settings that name no details file any more clear the panel and delete the kept copy.
//
// Nothing here touches the page, so the rules can be tested without one.

import { chooseDetails } from "../details/language.js";
import type { DetailsTable } from "../details/details.js";
import { detailsUrl, type Settings } from "../settings/schema.js";
import { AUTOMATIC } from "../shared/card-language.js";

export interface DetailsSyncDeps {
  /** The details for the tooltip (null: none). */
  setDetails(details: DetailsTable | null): void;
  /** The details switch, passed on to the tooltip. */
  setDetailsOn(on: boolean): void;
  /** Load a details file (null when it could not be loaded or checked). */
  load(url: string, sha256: string): Promise<DetailsTable | null>;
  /** Delete the kept copy of the details file. */
  forget(): void;
  /** The browser's languages, most preferred first. */
  languages(): readonly string[];
  /** The settings file's address: details paths are resolved against it. */
  settingsUrl: string | null;
}

export class DetailsSync {
  /** The file loaded or loading, as `${url}#${sha256}`; null when none is, or the last load failed. */
  private key: string | null = null;

  constructor(
    private readonly deps: DetailsSyncDeps,
    /** The popup's details switch. */
    public detailsOn: boolean,
    /** The popup's card language: "auto" or a language code (shared/card-language.ts). */
    public cardLanguage: string = AUTOMATIC,
  ) {}

  sync(settings: Settings): void {
    this.deps.setDetailsOn(this.detailsOn);
    const chosen = chooseDetails(settings, this.deps.languages(), this.cardLanguage);
    const url = chosen ? detailsUrl(chosen.source, this.deps.settingsUrl) : null;
    if (!url || !chosen) {
      this.key = null;
      this.deps.setDetails(null);
      // No details file named any more: none is kept either.
      if (settings.details === null) this.deps.forget();
      return;
    }
    const key = `${url}#${chosen.source.sha256}`;
    if (!this.detailsOn || key === this.key) return;
    this.key = key;
    const settle = (table: DetailsTable | null): void => {
      if (this.key !== key) return;
      // A failed load is forgotten, so the next sync tries again.
      if (table === null) this.key = null;
      this.deps.setDetails(table);
    };
    void this.deps.load(url, chosen.source.sha256).then(settle, () => settle(null));
  }
}

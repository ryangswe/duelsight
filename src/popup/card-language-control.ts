// SPDX-License-Identifier: Apache-2.0
// The popup's "Card language" menu (shared/card-language.ts): Automatic, then English, then each
// language the settings file has card details in (its `details<Lang>` entries), so a language
// added on the CDN shows here with no new version. Each is named in its own language
// ("Français", "Deutsch"); Automatic names the language it picks now. Like the other options, it
// cannot be changed until the stored choice is read. It is grayed out and cannot be changed while
// card hovers or card details are off (setActive(false)); the stored choice is kept.
//
// A stored language the settings no longer offer shows as Automatic, which is what the tooltip
// does with it; the stored choice is kept, and shows again if the language comes back.

import { readEffectiveSettings } from "../settings/store.js";
import { AUTOMATIC, CARD_LANGUAGE_KEY, readCardLanguage } from "../shared/card-language.js";
import { detailsLanguage } from "../details/language.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** A language's name in that language, capitalized for a list ("fr" → "Français"); the code in
 *  capitals when the browser has no name for it. */
export function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code);
    if (name && name !== code) return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    // Not a code the browser knows.
  }
  return code.toUpperCase();
}

/** The menu's entries: Automatic (with the language it picks), English, then the offered
 *  languages by name. */
export function languageOptions(offered: readonly string[], automatic: string): Array<{ value: string; label: string }> {
  const others = offered
    .filter((code) => code !== "en")
    .map((code) => ({ value: code, label: languageName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return [{ value: AUTOMATIC, label: `Automatic (${languageName(automatic)})` }, { value: "en", label: languageName("en") }, ...others];
}

/** Fill the menu and keep it current. Returns its render function, for storage changes (the
 *  choice, or a new settings file with other languages). */
export function initCardLanguage(doc: Document, local: Area, languages: () => readonly string[]): { render(): Promise<void>; setActive(active: boolean): void } {
  const select = doc.getElementById("card-language") as HTMLSelectElement;
  const row = select.closest(".picker");
  let ready = false;
  let active: boolean | null = null;
  const draw = (): void => {
    if (!ready || active === null) return;
    select.disabled = !active;
    row?.toggleAttribute("data-inactive", !active);
    select.removeAttribute("aria-busy");
  };
  const render = async (): Promise<void> => {
    // An unreadable storage shows Automatic, with English alone. Settings that name no English
    // details file (the maintainer took the details down) offer no other language either.
    const choice = await readCardLanguage(local).catch(() => AUTOMATIC);
    const settings = await readEffectiveSettings(local).then((e) => e.settings).catch(() => null);
    const localDetails = settings?.details ? settings.localDetails : {};
    const offered = Object.keys(localDetails);
    const automatic = detailsLanguage({ localDetails }, languages());
    const options = languageOptions(offered, automatic);
    select.replaceChildren(...options.map(({ value, label }) => {
      const option = doc.createElement("option");
      option.value = value;
      option.textContent = label;
      option.lang = value === AUTOMATIC ? "en" : value;
      return option;
    }));
    select.value = options.some((o) => o.value === choice) ? choice : AUTOMATIC;
    ready = true;
    draw();
  };
  select.addEventListener("change", () => {
    if (!ready || !active) return;
    void local.set({ [CARD_LANGUAGE_KEY]: select.value }).catch(() => undefined);
  });
  void render();
  return {
    render,
    setActive(next: boolean): void {
      active = next;
      draw();
    },
  };
}

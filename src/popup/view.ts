// SPDX-License-Identifier: Apache-2.0
// The popup: one switch (the master on/off), the card details switch (details-control.ts), the
// "Keep the card I'm pointing at" switch (shared/keep-card.ts, switch-control.ts), the
// card language menu (card-language-control.ts; also grayed out while the details are off), the
// card-size dial (card-size-control.ts; all four grayed out and still while the master switch is
// off), a "New version available" line only when the settings file names a newer version
// (installs that never update by themselves; never in Firefox, which installs only signed add-ons
// and updates them itself), and two links (the project page, and the open-source toolkit it is
// built on). The logic is apart from the browser globals so that it can be tested.

import { CONFIG } from "../config.js";
import { PROJECT_URL, RUNTIME_URL } from "../constants.js";
import { LAST_GOOD_KEY, readEffectiveSettings } from "../settings/store.js";
import { DISMISSED_UPDATE_KEY, updateNotice } from "../settings/update.js";
import { ENABLED_KEY, readEnabled } from "../shared/enabled.js";
import { CARD_SIZE_KEY } from "../shared/card-size.js";
import { initCardSize } from "./card-size-control.js";
import { DETAILS_KEY } from "../shared/details-pref.js";
import { initDetailsSwitch } from "./details-control.js";
import { KEEP_CARD_KEY, readKeepCardOn } from "../shared/keep-card.js";
import { initStoredSwitch } from "./switch-control.js";
import { CARD_LANGUAGE_KEY } from "../shared/card-language.js";
import { initCardLanguage } from "./card-language-control.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface PopupEnv {
  doc: Document;
  local: Area;
  onChanged: { addListener(listener: (changes: Record<string, unknown>, area: string) => void): void };
  version: string;
  /** Whether this build shows the "New version available" line (false in the Firefox build). */
  updateNotices?: boolean;
  /** The browser's languages, most preferred first (for the card language menu's Automatic). */
  languages?: () => readonly string[];
}

/** Fill the popup and keep it current. Adds one storage listener. */
export function initPopup(env: PopupEnv): { renderUpdate(): Promise<void>; renderSwitch(): Promise<void> } {
  const $ = <T extends HTMLElement>(id: string): T => env.doc.getElementById(id) as T;

  // The extension's own name, from duelsight.config.json.
  $("name").textContent = CONFIG.name;
  env.doc.title = CONFIG.name;
  $<HTMLAnchorElement>("project").href = PROJECT_URL;
  $<HTMLAnchorElement>("runtime").href = RUNTIME_URL;

  const toggle = $<HTMLButtonElement>("enabled");
  const cardSize = initCardSize(env.doc, env.local);
  const language = initCardLanguage(env.doc, env.local, env.languages ?? (() => []));
  // The card language only matters while card hovers and card details are both on. Each is
  // unknown (null) until read, so the menu is drawn once, in its final state.
  let hoversOn: boolean | null = null;
  let detailsOn: boolean | null = null;
  const showLanguage = (): void => {
    if (hoversOn !== null && detailsOn !== null) language.setActive(hoversOn && detailsOn);
  };
  const details = initDetailsSwitch(env.doc, env.local, (on) => {
    detailsOn = on;
    showLanguage();
  });
  const keepCard = initStoredSwitch(env.doc, env.local, { id: "keep-card", key: KEEP_CARD_KEY, read: readKeepCardOn });
  // The card details and keep-card switches, the language menu and the size dial only matter while card hovers
  // are on: off, they are grayed out and still, and their stored choices wait for the master switch.
  const panel = env.doc.querySelector(".panel");
  const showActive = (on: boolean): void => {
    details.setActive(on);
    keepCard.setActive(on);
    cardSize.setActive(on);
    hoversOn = on;
    showLanguage();
    panel?.toggleAttribute("data-hovers-off", !on);
  };
  // Disabled, without transitions, until the stored state is first read: the knob does not slide
  // on open, and a press cannot invert a state that was never shown.
  let ready = false;
  const renderSwitch = async (): Promise<void> => {
    // A storage that cannot be read shows the default (on) rather than a switch stuck disabled.
    const on = await readEnabled(env.local).catch(() => true);
    toggle.setAttribute("aria-checked", on ? "true" : "false");
    showActive(on);
    if (ready) return;
    ready = true;
    toggle.disabled = false;
    toggle.removeAttribute("aria-busy");
    // The first state is applied to the style now, and transitions come on two frames later, so
    // that no style recalculation sees the state change and the transitions together.
    const knob = toggle.querySelector(".knob");
    if (knob) void env.doc.defaultView?.getComputedStyle(knob).transform;
    const win = env.doc.defaultView;
    const frame = win?.requestAnimationFrame ? (f: () => void) => win.requestAnimationFrame(() => f()) : (f: () => void) => setTimeout(f, 16);
    frame(() => frame(() => {
      toggle.setAttribute("data-ready", "");
      panel?.setAttribute("data-ready", "");
    }));
  };
  // A button with role="switch": Enter and Space press it like a click.
  toggle.addEventListener("click", () => {
    if (!ready) return;
    const on = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", on ? "true" : "false");
    showActive(on);
    void env.local.set({ [ENABLED_KEY]: on });
  });

  // An unreadable storage leaves the update line hidden.
  const renderUpdate = (): Promise<void> => showUpdate().catch(() => undefined);
  const showUpdate = async (): Promise<void> => {
    if (env.updateNotices === false) return;
    const { settings } = await readEffectiveSettings(env.local);
    const dismissed = (await env.local.get(DISMISSED_UPDATE_KEY))[DISMISSED_UPDATE_KEY];
    const notice = updateNotice(settings.update, env.version, typeof dismissed === "string" ? dismissed : null);
    const line = $("update");
    line.hidden = notice === null;
    if (!notice) return;
    const link = $<HTMLAnchorElement>("update-link");
    link.href = notice.url;
    link.textContent = `New version available (${notice.latest})`;
    $("update-dismiss").onclick = () => void env.local.set({ [DISMISSED_UPDATE_KEY]: notice.latest }).then(renderUpdate);
  };

  void renderSwitch();
  void renderUpdate();
  env.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (LAST_GOOD_KEY in changes || DISMISSED_UPDATE_KEY in changes) void renderUpdate();
    // A new settings file can offer other languages.
    if (LAST_GOOD_KEY in changes || CARD_LANGUAGE_KEY in changes) void language.render();
    if (ENABLED_KEY in changes) void renderSwitch();
    if (CARD_SIZE_KEY in changes) void cardSize.render();
    if (DETAILS_KEY in changes) void details.render();
    if (KEEP_CARD_KEY in changes) void keepCard.render();
  });
  return { renderUpdate, renderSwitch };
}

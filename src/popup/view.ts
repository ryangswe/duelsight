// SPDX-License-Identifier: Apache-2.0
// The popup: one switch (the master on/off), the card details switch (details-control.ts), the
// card-size dial (card-size-control.ts; both grayed out and still while the master switch is off), a "New version available" line only when the settings
// file names a newer version (installs that never update by themselves; never in Firefox, which
// installs only signed add-ons and updates them itself), and two links (the
// project page, and the open-source toolkit it is built on). The logic is apart from the browser
// globals so that it can be tested.

import { CONFIG } from "../config.js";
import { PROJECT_URL, RUNTIME_URL } from "../constants.js";
import { LAST_GOOD_KEY, readEffectiveSettings } from "../settings/store.js";
import { DISMISSED_UPDATE_KEY, updateNotice } from "../settings/update.js";
import { ENABLED_KEY, readEnabled } from "../shared/enabled.js";
import { CARD_SIZE_KEY } from "../shared/card-size.js";
import { initCardSize } from "./card-size-control.js";
import { DETAILS_KEY } from "../shared/details-pref.js";
import { initDetailsSwitch } from "./details-control.js";

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
  const details = initDetailsSwitch(env.doc, env.local);
  // The card details switch and the size dial only matter while card hovers are on: off, they
  // are grayed out and still, and their stored choices wait for the master switch.
  const panel = env.doc.querySelector(".panel");
  const showActive = (on: boolean): void => {
    details.setActive(on);
    cardSize.setActive(on);
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
    if (ENABLED_KEY in changes) void renderSwitch();
    if (CARD_SIZE_KEY in changes) void cardSize.render();
    if (DETAILS_KEY in changes) void details.render();
  });
  return { renderUpdate, renderSwitch };
}

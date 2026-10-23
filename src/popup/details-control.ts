// SPDX-License-Identifier: Apache-2.0
// The popup's "Card details" switch (shared/details-pref.ts): whether the tooltip shows the card's
// details panel beside its picture. On unless switched off. Like the main switch, it cannot be
// pressed until the stored state is read, and it takes that state without sliding.

import { DETAILS_KEY, readDetailsOn } from "../shared/details-pref.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** Fill the switch and keep it current. Returns its render function, for storage changes. */
export function initDetailsSwitch(doc: Document, local: Area): { render(): Promise<void> } {
  const toggle = doc.getElementById("details") as HTMLButtonElement;
  let ready = false;
  const render = async (): Promise<void> => {
    // A storage that cannot be read shows the default (on) rather than a switch stuck disabled.
    const on = await readDetailsOn(local).catch(() => true);
    toggle.setAttribute("aria-checked", on ? "true" : "false");
    if (ready) return;
    ready = true;
    toggle.disabled = false;
    toggle.removeAttribute("aria-busy");
    const knob = toggle.querySelector(".knob");
    if (knob) void doc.defaultView?.getComputedStyle(knob).transform;
    const win = doc.defaultView;
    const frame = win?.requestAnimationFrame ? (f: () => void) => win.requestAnimationFrame(() => f()) : (f: () => void) => setTimeout(f, 16);
    frame(() => frame(() => toggle.setAttribute("data-ready", "")));
  };
  toggle.addEventListener("click", () => {
    if (!ready) return;
    const on = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", on ? "true" : "false");
    void local.set({ [DETAILS_KEY]: on }).catch(() => undefined);
  });
  void render();
  return { render };
}

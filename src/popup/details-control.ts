// SPDX-License-Identifier: Apache-2.0
// The popup's "Card details" switch (shared/details-pref.ts): whether the tooltip shows the card's
// details panel beside its picture. On unless switched off. Like the main switch, it cannot be
// pressed until the stored state is read, and it takes that state without sliding. While card
// hovers are off (setActive(false)) it shows off and cannot be pressed; the stored choice is kept
// and shows again when they are back on.

import { DETAILS_KEY, readDetailsOn } from "../shared/details-pref.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** Fill the switch and keep it current. Returns its render function, for storage changes. */
export function initDetailsSwitch(doc: Document, local: Area): { render(): Promise<void>; setActive(active: boolean): void } {
  const toggle = doc.getElementById("details") as HTMLButtonElement;
  let ready = false;
  // Whether card hovers are on: unknown (null) until the popup has read the master switch, so
  // that the switch is drawn once, in its final state, and never slides on open.
  let active: boolean | null = null;
  let stored = true;
  let started = false;
  const draw = (): void => {
    if (!ready || active === null) return;
    toggle.setAttribute("aria-checked", active && stored ? "true" : "false");
    toggle.disabled = !active;
    if (started) return;
    started = true;
    toggle.removeAttribute("aria-busy");
    const knob = toggle.querySelector(".knob");
    if (knob) void doc.defaultView?.getComputedStyle(knob).transform;
    const win = doc.defaultView;
    const frame = win?.requestAnimationFrame ? (f: () => void) => win.requestAnimationFrame(() => f()) : (f: () => void) => setTimeout(f, 16);
    frame(() => frame(() => toggle.setAttribute("data-ready", "")));
  };
  const render = async (): Promise<void> => {
    // A storage that cannot be read shows the default (on) rather than a switch stuck disabled.
    stored = await readDetailsOn(local).catch(() => true);
    ready = true;
    draw();
  };
  toggle.addEventListener("click", () => {
    if (!started || !active) return;
    stored = !stored;
    draw();
    void local.set({ [DETAILS_KEY]: stored }).catch(() => undefined);
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

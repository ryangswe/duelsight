// SPDX-License-Identifier: Apache-2.0
// A popup switch for a stored choice that is on unless switched off: "Card details"
// (details-control.ts) and "Keep the card I'm pointing at" (shared/keep-card.ts). Like the main
// switch, it cannot be pressed until the stored state is read, and it takes that state without
// sliding. While card hovers are off (setActive(false)) it shows off and cannot be pressed; the
// stored choice is kept and shows again when they are back on. `onStored` hears the stored choice
// (read or pressed).

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** One stored choice: its switch's element id, its storage key, and how it is read. */
export interface StoredSwitch {
  id: string;
  key: string;
  read(local: Pick<Area, "get">): Promise<boolean>;
}

/** Fill the switch and keep it current. Returns its render function, for storage changes. */
export function initStoredSwitch(doc: Document, local: Area, which: StoredSwitch, onStored?: (on: boolean) => void): { render(): Promise<void>; setActive(active: boolean): void } {
  const toggle = doc.getElementById(which.id) as HTMLButtonElement;
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
    stored = await which.read(local).catch(() => true);
    ready = true;
    draw();
    onStored?.(stored);
  };
  toggle.addEventListener("click", () => {
    if (!started || !active) return;
    stored = !stored;
    draw();
    onStored?.(stored);
    void local.set({ [which.key]: stored }).catch(() => undefined);
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

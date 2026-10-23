// SPDX-License-Identifier: Apache-2.0
// The popup's card-size dial (shared/card-size.ts): a slider from 70 % to 130 % in steps of 10 %,
// with its value beside it. It is still until the stored size is read, so that a drag never
// starts from a value that was never shown; each step is stored at once, and the tooltip on show
// follows it.

import { CARD_SIZE_KEY, clampCardSize, describeCardSize, MAX_CARD_SIZE, MIN_CARD_SIZE, readCardSize, CARD_SIZE_STEP } from "../shared/card-size.js";

interface Area {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** Fill the dial and keep it current. Returns its render function, for storage changes. */
export function initCardSize(doc: Document, local: Area): { render(): Promise<void> } {
  const slider = doc.getElementById("card-size") as HTMLInputElement;
  const value = doc.getElementById("card-size-value") as HTMLElement;
  slider.min = String(MIN_CARD_SIZE);
  slider.max = String(MAX_CARD_SIZE);
  slider.step = String(CARD_SIZE_STEP);
  const show = (percent: number): void => {
    slider.value = String(percent);
    const label = describeCardSize(percent);
    value.textContent = label;
    slider.setAttribute("aria-valuetext", label);
  };
  let ready = false;
  const render = async (): Promise<void> => {
    // A storage that cannot be read shows the default rather than a dial stuck disabled.
    const percent = await readCardSize(local).catch(() => clampCardSize(undefined));
    show(percent);
    if (ready) return;
    ready = true;
    slider.disabled = false;
  };
  slider.addEventListener("input", () => {
    if (!ready) return;
    const percent = clampCardSize(Number(slider.value));
    show(percent);
    void local.set({ [CARD_SIZE_KEY]: percent }).catch(() => undefined);
  });
  void render();
  return { render };
}

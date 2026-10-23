// SPDX-License-Identifier: Apache-2.0
// The details panel in the tooltip frame's document: measuring its content at the panel widths,
// and clamping its text to the box the layout gives it. The text keeps its font size; what does
// not fit ends in an ellipsis, on a whole line.

import { MAX_PANEL_HEIGHT } from "../shared/messages.js";
import { PANEL_WIDTHS } from "../shared/panel-layout.js";

/** The heights the panel's content (as filled now) needs at each panel width, measured on a
 *  hidden copy of it. */
export function measurePanel(panel: HTMLElement): Array<[number, number]> {
  const doc = panel.ownerDocument;
  const copy = panel.cloneNode(true) as HTMLElement;
  for (const el of [copy, ...copy.querySelectorAll<HTMLElement>("[id]")]) el.removeAttribute("id");
  for (const el of copy.querySelectorAll<HTMLElement>(".clamped")) {
    el.classList.remove("clamped");
    el.style.removeProperty("-webkit-line-clamp");
  }
  for (const el of copy.querySelectorAll<HTMLElement>("[hidden]")) el.hidden = false;
  copy.hidden = false;
  copy.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;height:auto;";
  copy.setAttribute("aria-hidden", "true");
  doc.body.appendChild(copy);
  try {
    return PANEL_WIDTHS.map((width): [number, number] => {
      copy.style.width = `${width}px`;
      return [width, Math.min(MAX_PANEL_HEIGHT, Math.max(1, Math.ceil(copy.getBoundingClientRect().height)))];
    });
  } finally {
    copy.remove();
  }
}

/** Clamp the panel's text to the room left in the panel as laid out now: whole lines, the last
 *  one ending in an ellipsis; the text is hidden when not one line fits. Returns whether the
 *  text was cut. */
export function fitPanelText(panel: HTMLElement, text: HTMLElement): boolean {
  const view = panel.ownerDocument.defaultView!;
  text.classList.remove("clamped");
  text.style.removeProperty("-webkit-line-clamp");
  text.hidden = false;
  if (panel.scrollHeight <= panel.clientHeight + 1) return false;
  const box = panel.getBoundingClientRect();
  const own = view.getComputedStyle(text);
  const line = Number.parseFloat(own.lineHeight) || 16;
  const contentTop = text.getBoundingClientRect().top + Number.parseFloat(own.borderTopWidth) + Number.parseFloat(own.paddingTop);
  const room = box.bottom - Number.parseFloat(view.getComputedStyle(panel).paddingBottom) - contentTop;
  const lines = Math.floor(room / line);
  if (lines < 1) {
    text.hidden = true;
    return true;
  }
  text.classList.add("clamped");
  text.style.setProperty("-webkit-line-clamp", String(lines));
  return true;
}

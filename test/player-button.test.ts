// @vitest-environment happy-dom
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it } from "vitest";

import { BUTTON_LABEL, PlayerButton } from "../src/content/player-button.js";

let toggles: number;
let button: PlayerButton;

function make(trusted: (e: Event) => boolean = () => true): PlayerButton {
  toggles = 0;
  const b = new PlayerButton({ onToggle: () => void (toggles += 1), introSeen: () => true, markIntroSeen: () => undefined, isTrusted: trusted });
  document.body.appendChild(b.host);
  return b;
}

beforeEach(() => {
  document.body.innerHTML = "";
  button = make();
});

describe("PlayerButton", () => {
  it("keeps one name and carries the state in aria-pressed", () => {
    expect(button.element.getAttribute("aria-label")).toBe(BUTTON_LABEL);
    expect(button.element.getAttribute("aria-pressed")).toBe("false");
    button.setOn(true);
    expect(button.element.getAttribute("aria-label")).toBe("Card hovers for this channel");
    expect(button.element.getAttribute("aria-pressed")).toBe("true");
  });

  it("toggles on a real click, and ignores a click a page script made", () => {
    button.element.click();
    expect(toggles).toBe(1);
    const untrusted = make((e) => !(e as Event & { fake?: boolean }).fake);
    untrusted.element.dispatchEvent(Object.assign(new MouseEvent("click", { bubbles: true }), { fake: true }));
    expect(toggles).toBe(0);
  });

  it("keeps Enter and Space from reaching the page (no play/pause), and nothing else", () => {
    const seen: string[] = [];
    document.addEventListener("keydown", (e) => seen.push(e.key));
    document.addEventListener("keyup", (e) => seen.push(e.key));
    for (const key of ["Enter", " "]) {
      button.element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
      button.element.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, composed: true }));
    }
    button.element.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true, composed: true }));
    expect(seen).toEqual(["k"]);
  });

  it("puts its whole style back on every show", () => {
    button.show({ left: 0, top: 0, width: 800, height: 450 });
    button.host.style.opacity = "0";
    button.host.style.pointerEvents = "none";
    button.host.style.width = "0px";
    button.show({ left: 0, top: 0, width: 800, height: 450 });
    expect(button.host.style.opacity).toBe("1");
    expect(button.host.style.pointerEvents).toBe("auto");
    expect(button.host.style.width).toBe("auto");
    expect(button.host.style.zIndex).toBe("2147483647");
    expect(button.host.style.display).toBe("block");
  });
});

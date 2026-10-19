// SPDX-License-Identifier: Apache-2.0
// The in-player button: one click turns card hovers on or off for the video's channel. It is
// shown only while the pointer is over the player, in the player's top-right corner below the
// site's own top overlays. It lives in a closed shadow root, so the page's styles do not reach
// it, and is styled through the CSSOM (no inline markup).

const SIZE = 34;
/** Below YouTube's and Twitch's own top overlays (title bar, channel info). */
const TOP_OFFSET = 58;
const RIGHT_OFFSET = 12;
/** How long the first-view label stays. */
const INTRO_MS = 4_000;
const SVG = "http://www.w3.org/2000/svg";

/** The button's name for screen readers, which never changes; `aria-pressed` carries the state. */
export const BUTTON_LABEL = "Card hovers for this channel";
export const BUTTON_INTRO = BUTTON_LABEL;
/** The host's whole style, set again on every show: the page cannot leave it hidden or shrunk. */
const HOST_STYLE = "all:initial;position:fixed;z-index:2147483647;display:block;margin:0;padding:0;border:0;opacity:1;visibility:visible;pointer-events:auto;width:auto;height:auto;transform:none;filter:none;";

export interface PlayerButtonOptions {
  onToggle(): void;
  /** The first time the button is shown at all (shows the intro label once). */
  introSeen(): boolean;
  markIntroSeen(): void;
  isTrusted(event: Event): boolean;
}

export class PlayerButton {
  readonly host: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly iris: SVGCircleElement;
  private readonly label: HTMLSpanElement;
  private on = false;
  private visible = false;
  private introTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: PlayerButtonOptions) {
    this.host = document.createElement("div");
    this.host.style.cssText = `${HOST_STYLE}left:0;top:0;display:none;`;
    this.host.dataset.duelsight = "button";
    const root = this.host.attachShadow({ mode: "closed" });

    this.label = document.createElement("span");
    this.label.textContent = BUTTON_INTRO;
    Object.assign(this.label.style, {
      position: "absolute",
      right: `${SIZE + 8}px`,
      top: "6px",
      whiteSpace: "nowrap",
      padding: "3px 8px",
      font: "12px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      color: "#f2f2f4",
      background: "rgba(23,23,28,.92)",
      borderRadius: "6px",
      display: "none",
      pointerEvents: "none",
    });

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.title = BUTTON_INTRO;
    Object.assign(this.button.style, {
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      padding: "0",
      margin: "0",
      border: "2px solid rgba(255,255,255,.35)",
      borderRadius: "50%",
      background: "rgba(23,22,36,.78)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      outlineOffset: "2px",
    });
    // The eye of the extension's icon.
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    const eye = document.createElementNS(SVG, "path");
    eye.setAttribute("d", "M2 12 C6 5, 18 5, 22 12 C18 19, 6 19, 2 12 Z");
    eye.setAttribute("fill", "#ece8f8");
    this.iris = document.createElementNS(SVG, "circle");
    this.iris.setAttribute("cx", "12");
    this.iris.setAttribute("cy", "12");
    this.iris.setAttribute("r", "3.6");
    const pupil = document.createElementNS(SVG, "circle");
    pupil.setAttribute("cx", "12");
    pupil.setAttribute("cy", "12");
    pupil.setAttribute("r", "1.5");
    pupil.setAttribute("fill", "#181624");
    svg.append(eye, this.iris, pupil);
    this.button.appendChild(svg);

    // The page under the player never sees these presses (no pause, no seek), nor the keys that
    // press the button (Enter, Space: a site's play/pause shortcut).
    for (const type of ["pointerdown", "mousedown", "mouseup", "dblclick"]) this.button.addEventListener(type, (e) => e.stopPropagation());
    for (const type of ["keydown", "keyup", "keypress"]) {
      this.button.addEventListener(type, (e) => {
        const key = (e as KeyboardEvent).key;
        if (key === "Enter" || key === " " || key === "Spacebar") e.stopPropagation();
      });
    }
    this.button.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!this.options.isTrusted(e)) return;
      this.press();
    });
    root.append(this.label, this.button);
    this.render();
  }

  /** What a click does (also used by tests: the button is in a closed shadow root). */
  press(): void {
    this.options.onToggle();
  }

  /** The button itself (tests: it is in a closed shadow root). */
  get element(): HTMLButtonElement {
    return this.button;
  }

  get isOn(): boolean {
    return this.on;
  }

  get shown(): boolean {
    return this.visible;
  }

  setOn(on: boolean): void {
    this.on = on;
    this.render();
  }

  private render(): void {
    this.button.setAttribute("aria-label", BUTTON_LABEL);
    this.button.setAttribute("aria-pressed", this.on ? "true" : "false");
    this.iris.setAttribute("fill", this.on ? "#7c5cff" : "#8a8796");
    this.button.style.borderColor = this.on ? "#7c5cff" : "rgba(255,255,255,.35)";
    this.button.style.opacity = this.on ? "1" : "0.85";
  }

  /** Show the button in the top-right corner of the player box, below the site's top overlays
   *  and inside the picture when the picture is letterboxed (`pictureTop`). */
  show(player: { left: number; top: number; width: number; height: number }, pictureTop = player.top): void {
    if (!this.host.isConnected) return;
    const left = Math.round(player.left + player.width - RIGHT_OFFSET - SIZE);
    const below = player.top + Math.min(TOP_OFFSET, Math.max(4, player.height / 4));
    const top = Math.round(Math.max(below, pictureTop + 10));
    this.host.style.cssText = `${HOST_STYLE}left:${left}px;top:${top}px;`;
    if (!this.visible && !this.options.introSeen()) {
      this.options.markIntroSeen();
      this.label.style.display = "block";
      this.introTimer = setTimeout(() => {
        this.label.style.display = "none";
      }, INTRO_MS);
    }
    this.visible = true;
  }

  hide(): void {
    // Keyboard users keep it while it has the focus.
    if (this.host.matches(":focus-within")) return;
    this.host.style.display = "none";
    this.visible = false;
  }

  remove(): void {
    if (this.introTimer) clearTimeout(this.introTimer);
    this.host.remove();
    this.visible = false;
  }
}

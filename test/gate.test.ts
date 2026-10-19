// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";

import { POINTER_GRACE_MS, READING_LINGER_MS } from "../src/constants.js";
import { captureAllowed } from "../src/content/gate.js";

const base = { inside: true, lastTrustedPointerAt: 1000, tooltipShowing: false, lastTooltipAt: -Infinity };

describe("captureAllowed", () => {
  it("answers within the active window of a trusted pointer event over the picture", () => {
    expect(captureAllowed(base, 1000 + POINTER_GRACE_MS - 1)).toBe(true);
    expect(captureAllowed(base, 1000 + POINTER_GRACE_MS)).toBe(false);
  });
  it("never answers with the pointer outside the picture, or with no trusted event ever", () => {
    expect(captureAllowed({ ...base, inside: false }, 1001)).toBe(false);
    expect(captureAllowed({ ...base, lastTrustedPointerAt: -Infinity }, 1001)).toBe(false);
    expect(captureAllowed({ ...base, lastTrustedPointerAt: -Infinity, tooltipShowing: true }, 1001)).toBe(false);
  });
  it("keeps answering while a card shows under a resting pointer, and for the linger after", () => {
    const later = 1000 + POINTER_GRACE_MS + 60_000;
    expect(captureAllowed({ ...base, tooltipShowing: true, lastTooltipAt: later }, later)).toBe(true);
    expect(captureAllowed({ ...base, lastTooltipAt: later }, later + READING_LINGER_MS - 1)).toBe(true);
    expect(captureAllowed({ ...base, lastTooltipAt: later }, later + READING_LINGER_MS)).toBe(false);
  });
});

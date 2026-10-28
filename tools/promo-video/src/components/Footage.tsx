// SPDX-License-Identifier: Apache-2.0
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate } from "remotion";
import { SHOT_META } from "../footage";
import { C } from "../theme";

/** A cursor drawn from the capture's pointer log (the screencast has no cursor). */
const Cursor: React.FC<{ x: number; y: number; size: number; opacity: number }> = ({ x, y, size, opacity }) => (
  <svg
    width={size * 20}
    height={size * 28}
    viewBox="-1 -1 20 28"
    style={{ position: "absolute", left: x - size, top: y - size, opacity, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" }}
  >
    <path d="M0 0 L0 21.5 L5.6 16.4 L9.4 24.8 L13 23.2 L9.3 15 L16.6 15 Z" fill="#ffffff" stroke="#111318" strokeWidth={1.3} strokeLinejoin="round" />
  </svg>
);

/**
 * One captured shot at `scale`, its top-left at the parent's origin, with the cursor (and a ring
 * on each click) drawn over it. `pointerFrom` hides the cursor before that frame.
 */
export const Footage: React.FC<{ id: string; scale: number; pointerFrom?: number; cursorSize?: number }> = ({ id, scale, pointerFrom = 0, cursorSize = 1.5 }) => {
  const f = useCurrentFrame();
  const m = SHOT_META[id];
  const p = m.pointer[Math.max(0, Math.min(m.pointer.length - 1, f))];
  const clicks = m.pointer.map((q, i) => (q[2] ? i : -1)).filter((i) => i >= 0 && i <= f && f - i < 16);
  const cursorOpacity = interpolate(f, [pointerFrom, pointerFrom + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", width: m.w * scale, height: m.h * scale, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(`footage/${id}.mp4`)} muted style={{ width: m.w * scale, height: m.h * scale, display: "block" }} />
      <AbsoluteFill>
        {clicks.map((i) => {
          const q = m.pointer[i];
          const k = (f - i) / 16;
          const r = 10 + 46 * k;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: q[0] * scale - r,
                top: q[1] * scale - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `${4 * (1 - k) + 1}px solid ${C.glow}`,
                opacity: 1 - k,
                boxShadow: `0 0 24px ${C.glowSoft}`,
              }}
            />
          );
        })}
        <Cursor x={p[0] * scale} y={p[1] * scale} size={cursorSize} opacity={cursorOpacity} />
      </AbsoluteFill>
    </div>
  );
};

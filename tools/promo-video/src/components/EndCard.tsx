// SPDX-License-Identifier: Apache-2.0
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { tween, ease } from "../anim";
import { C, F } from "../theme";

/** Lands on the track's final hit: the name, what it is, where to get it, the small print. */
export const EndCard: React.FC<{ tall: boolean }> = ({ tall }) => {
  const f = useCurrentFrame();
  const pop = tween(f, [0, 14], [0, 1]);
  const ring = tween(f, [0, 26], [0, 1]);
  const line = (d: number) => ({ opacity: tween(f, [d, d + 10], [0, 1]), transform: `translateY(${tween(f, [d, d + 12], [16, 0])}px)` });
  const s = tall ? 0.82 : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: F.display, color: C.ink }}>
      <div
        style={{
          position: "absolute",
          width: 900 * s,
          height: 900 * s,
          borderRadius: "50%",
          border: `2px solid ${C.glow}`,
          opacity: (1 - ring) * 0.8,
          transform: `scale(${0.25 + ring * 1.1})`,
          boxShadow: `0 0 80px ${C.glowSoft}`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 * s }}>
        <div
          style={{
            fontSize: 156 * s,
            fontWeight: 800,
            letterSpacing: tween(f, [0, 20], [10, -2]),
            opacity: pop,
            transform: `scale(${0.9 + pop * 0.1})`,
            textShadow: `0 0 40px ${C.glowSoft}`,
          }}
        >
          DuelSight
        </div>
        <div style={{ width: tween(f, [4, 22], [0, 520 * s], ease.inOut), height: 3, background: C.glow, boxShadow: `0 0 18px ${C.glow}`, borderRadius: 2 }} />
        <div style={{ fontSize: 50 * s, fontWeight: 600, color: C.ink, textAlign: "center", lineHeight: 1.35, ...line(8) }}>
          {tall ? (
            <>
              Free and open source
              <br />
              Chrome extension
            </>
          ) : (
            "Free and open source · Chrome extension"
          )}
        </div>
        <div
          style={{
            marginTop: 18 * s,
            fontFamily: F.mono,
            fontSize: 40 * s,
            padding: `${16 * s}px ${34 * s}px`,
            borderRadius: 999,
            border: `2px solid ${C.edge}`,
            background: C.pill,
            boxShadow: `0 0 0 1px ${C.glowFaint}, 0 0 46px ${C.glowSoft}`,
            ...line(14),
          }}
        >
          github.com/ryangswe/duelsight
        </div>
        <div style={{ marginTop: 14 * s, fontSize: tall ? 30 : 30, fontWeight: 500, color: "#c3cadb", textAlign: "center", ...line(20) }}>
          Unofficial fan project, not affiliated with or endorsed by Konami.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SPDX-License-Identifier: Apache-2.0
import { useCurrentFrame } from "remotion";
import { tween, ease } from "../anim";
import { C, F } from "../theme";

/** A short burned-in line: rises in, fades out over its last frames. Frames are relative to its Sequence. */
export const Caption: React.FC<{ text: string; duration: number; size?: number; align?: "left" | "center" }> = ({ text, duration, size = 64, align = "center" }) => {
  const f = useCurrentFrame();
  const inK = tween(f, [0, 9], [0, 1]);
  const outK = tween(f, [duration - 6, duration], [1, 0], ease.inOut);
  return (
    <div
      style={{
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: -0.5,
        color: C.ink,
        textAlign: align,
        opacity: Math.min(inK, outK),
        transform: `translateY(${(1 - inK) * 18}px)`,
        textShadow: "0 2px 18px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.8)",
        whiteSpace: "pre",
        lineHeight: 1.18,
      }}
    >
      {text}
    </div>
  );
};

// SPDX-License-Identifier: Apache-2.0
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Footage } from "./components/Footage";
import { Caption } from "./components/Caption";
import { EndCard } from "./components/EndCard";
import { SHOT_META } from "./footage";
import { BEAT, CAPTIONS, FPS, SEGMENTS, T, TOTAL, s2f, type Segment } from "./timeline";
import HT from "../scripts/hover-times.json";
import { tween } from "./anim";
import { C, F } from "./theme";

const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, ${C.bgDeep} 0%, ${C.bg} 62%)` }} />
);

/** Where the 9:16 frame looks (x in the segment's crop pixels) at frame f of the reel: the button
 * until the click, then each hover's tooltip, moving over 0.6 s as the pointer travels there. */
function focusX(seg: Segment, f: number): number {
  const cx = seg.crop[0];
  const keys: [number, number][] = [];
  if (seg.id === "hero") keys.push([0, HT.hero.click_at![0] - 260 - cx], [T.click + 8, HT.hero.click_at![0] - 260 - cx]);
  for (const h of seg.hovers) {
    const center = (h.box[0] + h.box[2]) / 2 - cx;
    const t = s2f(h.shown_reel_s);
    keys.push([t - s2f(0.6), keys.length ? keys[keys.length - 1][1] : center], [t, center]);
  }
  if (!keys.length) return SHOT_META[seg.id].w / 2;
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [a, xa] = keys[i - 1];
      const [b, xb] = keys[i];
      if (b <= a) return xb;
      return interpolate(f, [a, b], [xa, xb], { easing: Easing.bezier(0.65, 0, 0.35, 1) });
    }
  }
  return keys[keys.length - 1][1];
}

const SegmentShot: React.FC<{ seg: Segment; tall: boolean; W: number; H: number }> = ({ seg, tall, W, H }) => {
  const local = useCurrentFrame();
  const f = local + seg.from; // reel frame
  const m = SHOT_META[seg.id];
  const hero = seg.id === "hero";
  const fadeIn = hero ? tween(local, [0, 18], [0, 1]) : tween(local, [0, 8], [0, 1]);
  const kick = hero ? 1 + 0.016 * Math.max(0, 1 - Math.abs(f - T.reveal - 2) / 6) : 1;

  if (tall) {
    // Full height of a tall band, panning to keep the active tooltip in view.
    const bandH = 1300;
    const scale = bandH / m.h;
    const w = m.w * scale;
    const top = (H - bandH) / 2 - 60;
    const left = Math.max(W - w, Math.min(0, W / 2 - focusX(seg, f) * scale));
    return (
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <div style={{ position: "absolute", left, top, transform: `scale(${kick})`, transformOrigin: `${W / 2 - left}px ${bandH / 2}px` }}>
          <Footage id={seg.id} scale={scale} pointerFrom={hero ? 20 : 0} cursorSize={1.7} />
        </div>
        <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${C.bg} 0, ${C.bg} ${top - 2}px, rgba(7,6,13,0) ${top + 60}px, rgba(7,6,13,0) ${top + bandH - 60}px, ${C.bg} ${top + bandH + 2}px)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: top - 70, textAlign: "center", fontFamily: F.display, fontSize: 30, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase", color: C.tag, opacity: fadeIn }}>
          {seg.tag}
        </div>
      </AbsoluteFill>
    );
  }

  if (hero) {
    const scale = W / m.w;
    const bx = (HT.hero.click_at![0] - seg.crop[0]) * scale;
    const by = (HT.hero.click_at![1] - seg.crop[1]) * scale;
    const ringOn = f >= T.click - 2 * BEAT && f < T.click + 2;
    return (
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <AbsoluteFill style={{ transform: `scale(${kick})` }}>
          <Footage id="hero" scale={scale} pointerFrom={20} cursorSize={1.5} />
          {ringOn && (
            <div
              style={{
                position: "absolute", left: bx - 42, top: by - 42, width: 84, height: 84, borderRadius: "50%",
                border: `3px solid ${C.glow}`, boxShadow: `0 0 26px ${C.glow}`,
                opacity: tween(f, [T.click - 2 * BEAT, T.click - 2 * BEAT + 8], [0, 1]) * tween(f, [T.click - 2, T.click + 2], [1, 0]),
                transform: `scale(${1 + 0.12 * Math.sin(((f - T.click) / BEAT) * Math.PI)})`,
              }}
            />
          )}
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(7,6,13,0.72) 0, rgba(7,6,13,0) 300px)" }} />
      </AbsoluteFill>
    );
  }

  // Dueling Book and paper: the take in a framed window, its source above it.
  const scale = Math.min(1720 / m.w, 830 / m.h);
  const w = m.w * scale;
  const h = m.h * scale;
  const cx = W / 2;
  const cy = 478;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <div
        style={{
          position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: 20, overflow: "hidden",
          border: `2px solid ${C.edge}`, boxShadow: `0 0 0 1px ${C.glowFaint}, 0 0 70px ${C.glowSoft}, 0 30px 80px -30px rgba(0,0,0,0.9)`,
          transform: `scale(${0.97 + 0.03 * fadeIn})`,
        }}
      >
        <Footage id={seg.id} scale={scale} cursorSize={1.45} />
      </div>
      <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2 - 44, fontFamily: F.display, fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: C.tag }}>
        {seg.tag}
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{ tall: boolean; music: boolean }> = ({ tall, music }) => {
  const W = tall ? 1080 : 1920;
  const H = tall ? 1920 : 1080;
  const f = useCurrentFrame();
  const outro = interpolate(f, [TOTAL - 30, TOTAL - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Backdrop />
      {SEGMENTS.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from}>
          <SegmentShot seg={s} tall={tall} W={W} H={H} />
        </Sequence>
      ))}
      {CAPTIONS.map((c) => (
        <Sequence key={c.from} from={c.from} durationInFrames={c.to - c.from}>
          <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: tall ? 230 : 40 }}>
            <Caption text={tall && c.tallText ? c.tallText : c.text} duration={c.to - c.from} size={tall ? 56 : 58} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <Sequence from={T.end}>
        <AbsoluteFill style={{ opacity: outro }}>
          <EndCard tall={tall} />
        </AbsoluteFill>
      </Sequence>
      {music && <Audio src={staticFile("audio/reel.wav")} />}
    </AbsoluteFill>
  );
};

export const _unused = FPS;

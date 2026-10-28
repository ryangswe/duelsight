// SPDX-License-Identifier: Apache-2.0
// The reel's music: the owner's track ("Epic" by paulyudin, Pixabay file name
// paulyudin-epic-epic-music-573969.mp3, 31.4 s), used whole with no cuts: trimmed to the reel's 31.0 s,
// faded over the last second (the track's own decay is already near silence), loudness-normalized to
// -14 LUFS (two-pass loudnorm, linear). The edit sits on its beats (src/timeline.ts).
//   node scripts/make-audio.mjs   ->  public/audio/reel.wav
import { execFileSync } from "node:child_process";

const SRC = "public/audio/paulyudin-epic-epic-music-573969.mp3";
const OUT = "public/audio/reel.wav";
const TOTAL = 31.0;
const base = `atrim=end=${TOTAL},afade=t=out:st=${TOTAL - 1}:d=1,aresample=48000`;
const r = execFileSync("bash", ["-c", `ffmpeg -hide_banner -y -i "${SRC}" -af "${base},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1`], { encoding: "utf8" });
const s = JSON.parse(r.match(/\{[\s\S]*?\}/g).pop());
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", SRC, "-af",
  `${base},loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true,aresample=48000`,
  "-c:a", "pcm_s16le", OUT]);
console.log(`wrote ${OUT}: ${TOTAL} s; measured ${s.input_i} LUFS -> -14`);

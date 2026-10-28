// SPDX-License-Identifier: Apache-2.0
// Adds the music to the silent renders (video stream copied), writes the poster and checks the
// result. The AAC encoder's priming delay is carried as an edit list, so the audio starts at 0.
//
//   node scripts/mux.mjs   ->  out/reel-16x9.mp4, out/reel-9x16.mp4, out/poster.png, out/poster-9x16.png
import { execFileSync } from "node:child_process";

const run = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
for (const [src, dst, poster, at] of [
  ["out/reel-16x9-video.mp4", "out/reel-16x9.mp4", "out/poster.png", 175],
  ["out/reel-9x16-video.mp4", "out/reel-9x16.mp4", "out/poster-9x16.png", 175],
]) {
  run(["-i", src, "-i", "public/audio/reel.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", dst]);
  // Poster: the first card's art on the board, in the ring-out (frame `at`).
  run(["-i", src, "-vf", `select=eq(n\\,${at})`, "-frames:v", "1", poster]);
  console.log(`wrote ${dst} and ${poster}`);
}

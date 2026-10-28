# SPDX-License-Identifier: Apache-2.0
# Builds every shot the reel uses from the private captures: a constant-30-fps clip cropped to
# the shot's privacy-safe region (nothing outside the crop ever leaves captures/), and a pointer
# track (per output frame, in crop pixels) the reel draws its cursor from.
#
#   python3 scripts/build-footage.py      -> public/footage/<id>.mp4 + <id>.json
#
# Shot times are capture seconds from the capture's first screencast frame. `start` may be negative
# (the first frame is held). Crops are [x, y, w, h] in the 1920x1080 capture; each was checked by
# eye to exclude channel names, usernames, chat, webcams, game logs, sponsor graphics and the
# Twitch title bar and controls (STORYBOARD.md, "Privacy").
import json, os, subprocess, bisect, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, "captures")
OUT = os.path.join(ROOT, "public", "footage")
FPS = 30

SHOTS = json.load(open(os.path.join(ROOT, "scripts", "shots.json")))


def jpeg_size(path):
    """(width, height) from a JPEG's SOF marker."""
    with open(path, "rb") as f:
        data = f.read()
    i = 2
    while i < len(data):
        marker, length = data[i + 1], int.from_bytes(data[i + 2:i + 4], "big")
        if marker in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
        i += 2 + length
    return None


def load(cap):
    d = os.path.join(CAP, cap)
    fr = [json.loads(l) for l in open(os.path.join(d, "frames.jsonl"))]
    # A screenshot taken during a recording can emit a frame of another size: skip those.
    sizes = [jpeg_size(os.path.join(d, "frames", f"{f['n']:06d}.jpg")) for f in fr]
    main = max(set(sizes), key=sizes.count)  # the capture's own size (live captures: 1920x1061)
    fr = [f for f, s in zip(fr, sizes) if s == main]
    ms = [json.loads(l) for l in open(os.path.join(d, "mouse.jsonl"))]
    return d, fr, ms


def build(shot):
    d, fr, ms = load(shot["capture"])
    t0 = fr[0]["t"]
    ts = [f["t"] - t0 for f in fr]
    mts = [m["t"] - t0 for m in ms]
    x0, y0, w, h = shot["crop"]
    n = shot["frames"]
    lst = os.path.join(OUT, f"{shot['id']}.txt")
    track = []
    with open(lst, "w") as f:
        for k in range(n):
            t = shot["start"] + k / FPS
            i = max(0, bisect.bisect(ts, t) - 1)
            f.write(f"file '{os.path.join(d, 'frames', f'{fr[i][chr(110)]:06d}.jpg')}'\nduration {1/FPS:.6f}\n")
            j = bisect.bisect(mts, t) - 1
            if j < 0:
                mx, my, moved = ms[0]["x"], ms[0]["y"], False
            elif j >= len(ms) - 1:
                mx, my, moved = ms[-1]["x"], ms[-1]["y"], True
            else:
                a, b = ms[j], ms[j + 1]
                u = (t - mts[j]) / max(1e-6, mts[j + 1] - mts[j])
                mx, my = a["x"] + (b["x"] - a["x"]) * u, a["y"] + (b["y"] - a["y"]) * u
                moved = True
            down = any(m["kind"] in ("down", "click") and abs((m["t"] - t0) - t) < 0.5 / FPS for m in ms)
            track.append([round(mx - x0, 1), round(my - y0, 1), 1 if down else 0])
        # concat demuxer: repeat the last file so its duration is honoured
        f.write(f"file '{os.path.join(d, 'frames', f'{fr[i][chr(110)]:06d}.jpg')}'\n")
    mp4 = os.path.join(OUT, f"{shot['id']}.mp4")
    # Privacy masks: a heavy blur over each region (clipped to the crop); `until` (seconds into the
    # shot) ends a mask that the tooltip covers once it lands.
    graph = f"[0:v]crop={w}:{h}:{x0}:{y0},fps={FPS}[v0]"
    k = 0
    for m in shot.get("masks", []):
        mx, my, mw, mh = m["rect"]
        ax, ay = max(mx, x0), max(my, y0)
        bx, by = min(mx + mw, x0 + w), min(my + mh, y0 + h)
        if bx - ax < 4 or by - ay < 4:
            continue
        rx, ry, rw, rh = ax - x0, ay - y0, (bx - ax) // 2 * 2, (by - ay) // 2 * 2
        if "until" in m:
            en = f":enable='lt(t,{m['until']})'"
        elif "on" in m:  # only while a tooltip covers the rest of its mask
            en = ":enable='" + "+".join(f"between(t,{a},{b})" for a, b in m["on"]) + "'"
        elif "off" in m:  # switched off while a tooltip covers it
            en = ":enable='" + "*".join(f"not(between(t,{a},{b}))" for a, b in m["off"]) + "'"
        else:
            en = ""
        graph += f";[v{k}]split[a{k}][b{k}];[b{k}]crop={rw}:{rh}:{rx}:{ry},boxblur=luma_radius=min(h\\,w)/4:luma_power=4:chroma_radius=min(cw\\,ch)/4:chroma_power=4[bl{k}];[a{k}][bl{k}]overlay={rx}:{ry}{en}[v{k + 1}]"
        k += 1
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
        "-filter_complex", graph, "-map", f"[v{k}]", "-frames:v", str(n),
        "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", "-color_range", "tv", mp4,
    ], check=True)
    os.remove(lst)
    json.dump({"id": shot["id"], "w": w, "h": h, "frames": n, "land": shot.get("land", 0), "tag": shot.get("tag"), "card": shot.get("card"), "pointer": track}, open(os.path.join(OUT, f"{shot['id']}.json"), "w"))
    print(f"{shot['id']}: {n} frames, crop {w}x{h}")


os.makedirs(OUT, exist_ok=True)
only = set(sys.argv[1:])
for s in SHOTS:
    if not only or s["id"] in only:
        build(s)

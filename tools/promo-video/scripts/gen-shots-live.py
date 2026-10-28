# SPDX-License-Identifier: Apache-2.0
# Writes scripts/shots.json from the LIVE captures (real YouTube footage, captures/live-<id>/, frames
# 1920x1061: the headed window's viewport): each reel segment is one continuous take with 2-3
# real-time hovers. The first hover's finished art (not the loading card) lands on its music hit; the
# rest follow in real time (~4 beats apart). Writes scripts/hover-times.json for the record.
#
# Tooltip boxes come from scripts/tooltip-boxes.json (found by the details panel's fixed size and
# color against the take's clean frame; checked by eye), one overridden by hand (MANUAL_BOX).
# A privacy mask that a tooltip covers is switched off ("off" intervals) only while that tooltip is
# shown; every mask was checked never to sit over a shown tooltip.
#   .venv python scripts/gen-shots-live.py && python3 scripts/build-footage.py
import json, os, bisect
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, "captures")
FPS = 30
BOXES = json.load(open(os.path.join(ROOT, "scripts", "tooltip-boxes.json")))
MANUAL_BOX = {}  # none needed: every box is found by the panel search (Futsu's from the frame before the pointer leaves)


def frames(cap):
    fr = [json.loads(l) for l in open(os.path.join(CAP, cap, "frames.jsonl"))]
    return fr, [f["t"] for f in fr]


def img(cap, f):
    return np.asarray(Image.open(os.path.join(CAP, cap, "frames", f"{f['n']:06d}.jpg")).convert("L"), dtype=np.int16)


def at_time(fr, ts, t):
    return fr[max(0, bisect.bisect(ts, t) - 1)]


def rgb(cap, f):
    return np.asarray(Image.open(os.path.join(CAP, cap, "frames", f"{f['n']:06d}.jpg")).convert("RGB"), dtype=np.int16)


def panel_shown(cap, f, box):
    """Whether the tooltip's details panel (the box's right 258 px: flat dark gray) is on screen."""
    x0, y0, x1, y1 = box
    p = rgb(cap, f)[y0:y1, max(x0, x1 - 258):x1]
    g = p.mean(2); sat = p.max(2) - p.min(2)
    return ((g > 16) & (g < 46) & (sat < 16)).mean() > 0.45


def art_and_hide(cap, h, box, nxt):
    """(art time, hide time): the first frame after the tooltip opens whose art area is detailed
    (gray std > 35; the loading card is a flat dark box), and the first frame after the pointer
    leaves without the tooltip's details panel."""
    fr, ts = frames(cap)
    x0, y0, x1, y1 = box
    ta = h["shown"]
    for f in fr:
        if f["t"] >= h["shown"] - 0.05:
            a = rgb(cap, f)[y0 + 60:y1 - 60, x0 + 30:x0 + 290]
            if a.mean(2).std() > 35:
                ta = f["t"]
                break
    th = None
    if nxt:
        leave = nxt["arrived"] - 0.75
        for f in fr:
            if f["t"] >= leave - 0.2 and not panel_shown(cap, f, box):
                th = f["t"]
                break
    return ta, th


HERO_MASKS = [
    {"rect": [0, 172, 272, 318], "why": "left player webcam"},
    {"rect": [1820, 172, 100, 320], "why": "right player webcam (right part: never under a tooltip)"},
    {"rect": [1650, 172, 170, 320], "why": "right player webcam (left part)", "covered_by": [0, 2]},
    {"rect": [548, 88, 156, 44], "why": "player name banner"},
    {"rect": [1248, 88, 104, 44], "why": "player name banner", "covered_by": [2]},
    {"rect": [1356, 144, 116, 30], "why": "in-game player name", "covered_by": [2]},
    {"rect": [392, 802, 124, 32], "why": "in-game player name"},
]
DB_MASKS = [
    {"rect": [140, 786, 200, 126], "why": "watcher username box", "covered_by": [0, 2]},
    {"rect": [1565, 0, 215, 575], "why": "chat and player name (top)", "covered_by": [1]},
    {"rect": [1565, 575, 215, 486], "why": "chat, player name and webcam (bottom: never under a tooltip)"},
]
PAPER_MASKS = [{"rect": [1428, 60, 372, 350], "why": "player webcam and name"}]

# Reel seconds (music: 86.13 BPM, beats at 0.21 + k * 0.6966 s; hits 5.09, 10.58, 25.02, 27.24).
SEGMENTS = [
    # id, capture, crop, masks, reel start, reel end, land of the first hover (reel s), hovers used, tag
    ("hero", "live-hero", [36, 0, 1884, 1060], HERO_MASKS, 0.0, 13.45, 5.09, 3, "Master Duel"),
    ("seg-db", "live-db-dbgrinder", [140, 0, 1640, 1060], DB_MASKS, 13.45, 20.41, 14.14, 3, "Dueling Book"),
    ("seg-paper", "live-paper-nawcq", [500, 0, 1300, 1060], PAPER_MASKS, 20.41, 25.02, 21.11, 2, "Paper"),
]


def outside(rect, box):
    """The parts of rect [x, y, w, h] outside box [x0, y0, x1, y1], as rects."""
    x, y, w, h = rect; X0, Y0, X1, Y1 = x, y, x + w, y + h
    bx0, by0, bx1, by1 = box
    if bx1 <= X0 or X1 <= bx0 or by1 <= Y0 or Y1 <= by0:
        return [rect]
    out = []
    if by0 > Y0: out.append([X0, Y0, w, by0 - Y0])                                # above
    if by1 < Y1: out.append([X0, by1, w, Y1 - by1])                                # below
    my0, my1 = max(Y0, by0), min(Y1, by1)
    if bx0 > X0: out.append([X0, my0, bx0 - X0, my1 - my0])                        # left
    if bx1 < X1: out.append([bx1, my0, X1 - bx1, my1 - my0])                       # right
    return [r for r in out if r[2] >= 4 and r[3] >= 4]


def overlaps(a, b):
    return not (a[0] + a[2] <= b[0] or b[2] <= a[0] or a[1] + a[3] <= b[1] or b[3] <= a[1])


shots, record = [], {}
for sid, cap, crop, masks, r0, r1, land, k, tag in SEGMENTS:
    log = json.load(open(os.path.join(CAP, cap, "log.json")))
    hov = log["hovers"]
    used = hov[:k]
    # Every used hover named the card under the pointer. One (The Fallen & The Virtuous) was aimed at a
    # zone that held Super Polymerization in the training frame; checked by eye, the card there is it.
    assert all(h["name"] and h["picture"] for h in used), (cap, used)
    t0 = json.loads(open(os.path.join(CAP, cap, "frames.jsonl")).readline())["t"]
    boxes = [MANUAL_BOX.get((cap, i), BOXES[cap][i]) for i in range(k)]
    times = [art_and_hide(cap, h, boxes[i], hov[i + 1] if i + 1 < len(hov) else None) for i, h in enumerate(used)]
    start = times[0][0] - t0 - (land - r0)  # capture seconds at the segment's first frame
    dur = r1 - r0
    rel = lambda t: round(t - t0 - start, 3)
    out_masks = []
    for m in masks:
        mm = {"rect": m["rect"], "why": m["why"]}
        off = []
        for i in m.get("covered_by", []):
            a = rel(used[i]["shown"]) + 0.03
            b = rel(times[i][1]) - 0.03 if times[i][1] else dur + 1
            off.append([a, b])
            # While tooltip i is shown, the parts of the mask outside its box stay blurred.
            for piece in outside(m["rect"], boxes[i]):
                out_masks.append({"rect": piece, "why": m["why"] + f" (beside {used[i]['name']}'s tooltip)", "on": [[a - 0.04, b + 0.04]]})
        if off:
            mm["off"] = off
        # never over a shown tooltip outside its off interval
        for i, bx in enumerate(boxes):
            if overlaps(m["rect"], bx) and i not in m.get("covered_by", []):
                raise SystemExit(f"{sid}: mask '{m['why']}' overlaps {used[i]['name']}'s tooltip {bx}")
        out_masks.append(mm)
    shots.append({"id": sid, "capture": cap, "start": round(start, 3), "frames": round(dur * FPS), "crop": crop,
                  "masks": out_masks, "land": round((land - r0) * FPS), "tag": tag, "card": used[0]["name"]})
    record[sid] = {"hovers": [{"card": h["name"], "shown_reel_s": round(r0 + rel(h["shown"]), 3), "art_reel_s": round(r0 + rel(ta), 3),
                               "hide_reel_s": round(r0 + rel(th), 3) if th else None, "box": bx, "at": h["at"]}
                              for (ta, th), h, bx in zip(times, used, boxes)],
                   "crop": crop, "r0": r0, "r1": r1}
    if "click" in log:
        record[sid]["click_reel_s"] = round(r0 + rel(log["click"]["t"]), 3)
        record[sid]["click_at"] = log["click"]["at"]

json.dump(shots, open(os.path.join(ROOT, "scripts", "shots.json"), "w"), indent=1)
json.dump(record, open(os.path.join(ROOT, "scripts", "hover-times.json"), "w"), indent=1)
for sid, hs in record.items():
    print(sid, hs.get("click_reel_s"), [(h["card"], h["art_reel_s"], h["hide_reel_s"]) for h in hs["hovers"]])

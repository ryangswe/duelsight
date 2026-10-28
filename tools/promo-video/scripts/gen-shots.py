# SPDX-License-Identifier: Apache-2.0
# Writes scripts/shots.json (what build-footage.py cuts) from the capture logs: for each reel shot,
# the capture, the hover it shows, its crop and its privacy masks, and the segment's start so the
# tooltip lands exactly LEAD seconds into the shot (`land`, in frames, goes into the footage json).
#
# Crops and masks are in the 1920x1080 capture. Each was checked by eye: no webcam, no channel name,
# no chat or username survives outside a mask; no mask touches a shown tooltip (a mask that would
# sits under the tooltip only until it lands: `until`, seconds into the shot).
#   python3 scripts/gen-shots.py && python3 scripts/build-footage.py
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, "captures")
FPS = 30
LEAD = 0.5  # the tooltip lands one beat (120 BPM) into a montage shot


def t0(cap):
    return json.loads(open(os.path.join(CAP, cap, "frames.jsonl")).readline())["t"]


def log(cap):
    return json.load(open(os.path.join(CAP, cap, "log.json")))


def art_time(cap, h):
    """When the tooltip reaches its finished look (art and details, not the loading card): the first
    screencast frame after it opens whose tooltip region matches the settled tooltip (2.4 s later)."""
    import numpy as np
    from PIL import Image
    fr = [json.loads(l) for l in open(os.path.join(CAP, cap, "frames.jsonl"))]
    ts = [f["t"] for f in fr]
    img = lambda f: np.asarray(Image.open(os.path.join(CAP, cap, "frames", f"{f['n']:06d}.jpg")).convert("L"), dtype=np.int16)
    base = img(fr[0])
    import bisect
    settled_i = max(0, bisect.bisect(ts, h["shown"] + 2.4) - 1)
    settled = img(fr[settled_i])
    ys, xs = np.where(np.abs(settled - base) > 40)
    box = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    for f in fr:
        if f["t"] < h["shown"] - 0.05:
            continue
        if np.abs(img(f)[box] - settled[box]).mean() < 4:
            return f["t"]
    return h["shown"]


HERO_MASKS = [
    {"rect": [0, 172, 272, 318], "why": "left player webcam"},
    {"rect": [1650, 172, 270, 250], "why": "right player webcam (above the tooltip)"},
    {"rect": [1716, 422, 204, 70], "why": "right player webcam (beside the tooltip)"},
    {"rect": [548, 88, 156, 44], "why": "player name banner"},
    {"rect": [1248, 88, 104, 44], "why": "player name banner"},
    {"rect": [1356, 144, 116, 30], "why": "in-game player name"},
    {"rect": [392, 802, 124, 32], "why": "in-game player name"},
]

shots = []

# Hero, part 1: the pointer goes to the DuelSight button and clicks it (Off -> On).
b = log("hero-md-button")
click = b["click"]["t"] - t0("hero-md-button")
for sid, crop, masks in (("hero-btn", [0, 0, 1920, 1080], HERO_MASKS), ("hero-btn9", [1000, 0, 920, 1080], HERO_MASKS)):
    shots.append({"id": sid, "capture": "hero-md-button", "start": round(click - 3.0, 3), "frames": int(4.6 * FPS),
                  "crop": crop, "masks": masks, "land": int(3.0 * FPS), "note": "the click lands at `land`"})

# Hero, part 2: from beside the button to Dracotail Gulamel; its tooltip lands on the hit.
h = log("hero-md")["hovers"][0]
assert h["ok"], h
st = art_time("hero-md", h) - t0("hero-md")
for sid, crop in (("hero", [0, 0, 1920, 1080]), ("hero9", [1000, 0, 920, 1080])):
    shots.append({"id": sid, "capture": "hero-md", "start": round(st - 1.8, 3), "frames": int(6.0 * FPS), "crop": crop,
                  "masks": HERO_MASKS, "land": int(1.8 * FPS), "card": h["name"]})

MONTAGE = [
    # id, capture, hover index, tag, crop, masks
    ("m-md-mrduels", "md-mrduels", 0, "Master Duel", [430, 40, 1440, 820], []),
    ("m-db-dbgrinder", "db-dbgrinder", 0, "Dueling Book", [140, 0, 1420, 1080],
     [{"rect": [140, 786, 200, 126], "until": LEAD, "why": "watcher username box (the tooltip covers it once shown)"}]),
    ("m-paper-nawcq", "paper-nawcq", 1, "Paper", [500, 0, 1300, 1080],
     [{"rect": [1428, 60, 372, 350], "why": "player webcam and name"}]),
    ("m-md-dkayed", "md-dkayed", 0, "Master Duel", [440, 110, 1440, 810], []),
    ("m-db-retro", "db-retro", 1, "Dueling Book", [440, 60, 1070, 1020], []),
    ("m-paper-houston", "paper-houston", 1, "Paper", [500, 0, 1200, 1080],
     [{"rect": [1428, 60, 272, 350], "why": "player webcam and name"}]),
]
for sid, cap, k, tag, crop, masks in MONTAGE:
    h = log(cap)["hovers"][k]
    assert h["ok"] and h["picture"], (cap, h)
    st = art_time(cap, h) - t0(cap)
    shots.append({"id": sid, "capture": cap, "start": round(st - LEAD, 3), "frames": int(2.6 * FPS), "crop": crop,
                  "masks": masks, "land": int(LEAD * FPS), "tag": tag, "card": h["name"]})

json.dump(shots, open(os.path.join(ROOT, "scripts", "shots.json"), "w"), indent=1)
print("\n".join(f"{s['id']}: {s.get('card', '')} start {s['start']} land {s['land']}" for s in shots))

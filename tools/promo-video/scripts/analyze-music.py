# SPDX-License-Identifier: Apache-2.0
# Envelope analysis of the owner-supplied track: RMS per 50 ms, onset strength (spectral flux),
# tempo by autocorrelation of the onset envelope, and candidate "mic drop" moments: a strong
# onset followed by a sharp drop in level (a drop-out) in the next 0.3-1.5 s.
import numpy as np, sys
sr = 22050
x = np.fromfile(sys.argv[1], dtype=np.float32)
hop = 512; win = 2048
n = 1 + (len(x) - win) // hop
frames = np.lib.stride_tricks.as_strided(x, shape=(n, win), strides=(x.strides[0]*hop, x.strides[0]))
rms = np.sqrt((frames**2).mean(1)); t = (np.arange(n)*hop + win/2)/sr
spec = np.abs(np.fft.rfft(frames*np.hanning(win), axis=1))
logspec = np.log1p(100*spec)
flux = np.maximum(0, np.diff(logspec, axis=0)).sum(1); flux = np.concatenate([[0], flux])
# low-band flux (kick/impact)
freqs = np.fft.rfftfreq(win, 1/sr); lb = freqs < 200
lflux = np.maximum(0, np.diff(logspec[:, lb], axis=0)).sum(1); lflux = np.concatenate([[0], lflux])
db = 20*np.log10(rms+1e-9)
# tempo
o = flux - flux.mean(); ac = np.correlate(o, o, 'full')[len(o)-1:]
fps = sr/hop
lags = np.arange(len(ac)); bpm = 60*fps/np.maximum(lags,1)
m = (bpm > 70) & (bpm < 180); best = lags[m][np.argmax(ac[m])]
print(f"tempo ~ {60*fps/best:.1f} BPM (lag {best} frames)")
# 0.5 s level profile
print("\nlevel per 1 s (dB RMS):")
for s in range(int(t[-1])+1):
    sel = (t >= s) & (t < s+1)
    print(f"{s:3d}s {db[sel].mean():6.1f} {'#'*int(max(0,(db[sel].mean()+40)))}  flux {flux[sel].max():6.0f}")
# candidates: onset peak with following drop
cands = []
for i in range(5, n-70):
    if flux[i] == flux[i-5:i+6].max() and flux[i] > np.percentile(flux, 97):
        pre = db[max(0,i-40):i].mean()
        peak = db[i:i+6].max()
        post = db[i+15:i+65].mean()   # ~0.35-1.5 s after
        cands.append((t[i], flux[i], lflux[i], pre, peak, post, peak-post))
cands.sort(key=lambda c: -c[6])
print("\ntop impact+dropout candidates: time, flux, lowflux, pre dB, peak dB, post dB, peak-post")
for c in cands[:15]: print(" ".join(f"{v:7.2f}" for v in c))
np.save(sys.argv[2], np.stack([t, db, flux, lflux]))

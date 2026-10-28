// SPDX-License-Identifier: Apache-2.0
import { Easing, interpolate } from "remotion";

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

export const tween = (f: number, [a, b]: [number, number], [from, to]: [number, number], easing = ease.out) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

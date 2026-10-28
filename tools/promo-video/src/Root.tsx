// SPDX-License-Identifier: Apache-2.0
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { FPS, TOTAL } from "./timeline";

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{ tall: false, music: false }} />
    <Composition id="Cutdown" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ tall: true, music: false }} />
  </>
);

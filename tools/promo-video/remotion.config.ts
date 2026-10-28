// SPDX-License-Identifier: Apache-2.0
import { Config } from "@remotion/cli/config";

// PNG frames keep the encode in standard (limited) range yuv420p; JPEG frames produce full-range
// yuvj420p, which some players and social re-encoders mishandle.
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setConcurrency(8);

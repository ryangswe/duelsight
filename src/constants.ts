// SPDX-License-Identifier: Apache-2.0
// Every address and switch the extension is built with, in one place.

import { CONFIG } from "./config.js";

/** The project's own page (the popup's first link). From duelsight.config.json. */
export const PROJECT_URL = CONFIG.projectUrl;

/** The models this extension ships (README). */
export const MODEL_URL = CONFIG.modelUrl;

/** The open-source recognition runtime and training code (the popup's second link). */
export const RUNTIME_URL = CONFIG.runtimeUrl;

/** The only place the settings file's `update.url` may point; null: the line is never shown. */
export const UPDATE_URL_PREFIX = CONFIG.updateUrlPrefix;

/** Who to contact about maintaining the project (README). */
export const MAINTAINER_CONTACT_URL = CONFIG.maintainerContactUrl;

/** The settings file (SETTINGS.md, schema version 1), or null: the bundled copy only, no fetch. */
export const SETTINGS_URL = CONFIG.settingsUrl;

/** How often the settings file is fetched again while the extension runs. */
export const SETTINGS_REFRESH_MS = 60 * 60 * 1000;

/**
 * The only hosts the extension may request card images from. They are the image hosts in the
 * manifest's host permissions; a settings source on any other host is dropped (an extension
 * release adds a host).
 */
export const IMAGE_HOSTS: readonly string[] = CONFIG.imageHosts;

/** The video sites the extension runs on. */
export const VIDEO_SITES = CONFIG.videoSites;

/** The outline around the hovered card (duelsight.config.json `outlineColor` and
 *  `outlineGlowColor`): a solid edge, fading out in a glow. */
export const DEFAULT_OUTLINE_COLOR = "#1b2f6b";
export const DEFAULT_OUTLINE_GLOW_COLOR = "rgba(61, 111, 224, 0.6)";
export const OUTLINE_COLOR = CONFIG.outlineColor ?? DEFAULT_OUTLINE_COLOR;
export const OUTLINE_GLOW_COLOR = CONFIG.outlineGlowColor ?? DEFAULT_OUTLINE_GLOW_COLOR;

/** One image attempt (request, body and decode) is given up on after this long. */
export const IMAGE_TIMEOUT_MS = 5_000;

/** A source that failed this many times in a row is skipped until fresh settings are read. */
export const SOURCE_FAILURE_LIMIT = 3;

/** Smallest video, in CSS pixels of width on the page, that the extension attaches to. */
export const MIN_VIDEO_WIDTH = 320;

/** Where the release (models, bank, catalog) sits inside the built extension. */
export const RELEASE_PATH = "release/release.json";
/** The vendored runtime's worker inside the built extension; ONNX Runtime's files sit beside it. */
export const WORKER_PATH = "runtime/worker.js";

/** The runtime's pointer grace period (frame-scheduler.ts `POINTER_GRACE_MS`): analysis runs
 *  this long after the last pointer activity. Mirrored here for the content script's capture
 *  gate, which does not load the runtime. */
export const POINTER_GRACE_MS = 10_000;
/** The runtime's "reading" linger (frame-scheduler.ts `READING_LINGER_MS`), mirrored likewise. */
export const READING_LINGER_MS = 5_000;

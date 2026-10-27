// SPDX-License-Identifier: Apache-2.0
// The extension's manifest, made from duelsight.config.json. Permissions are the least the
// extension needs:
//   - `storage`: the on/off switch, the card size, the channels turned on, the last good
//     settings file, a dismissed update notice;
//   - the video sites the config turns on (where the content script runs);
//   - the image hosts the config names (the CDN), so the extension's pages can load pictures and
//     the settings file from it; the pages' connect-src names the same hosts.
// No tabs, no history, no other host. A dev build also runs on the local test page.
// A Firefox build (`firefoxManifest`) is the same manifest in Firefox's form.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { imageHostPatterns, loadForkConfig, videoSitePatterns } from "./fork-config.mjs";

/**
 * The public key that fixes the extension's ID for unpacked installs (from a release zip):
 * every such install gets the same ID, so replacing the folder with a new version keeps its
 * settings. The private key is not in this repository. A Web Store build leaves the key out;
 * the store assigns its own ID.
 */
export const UNPACKED_PUBLIC_KEY = readFileSync(new URL("../keys/unpacked-public.pem", import.meta.url), "utf-8")
  .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
  .replace(/\s+/g, "");

/** The extension ID a public key gives (Chrome's rule: the SHA-256 of the key, a–p for 0–f). */
export function extensionIdOf(publicKeyBase64) {
  return createHash("sha256")
    .update(Buffer.from(publicKeyBase64, "base64"))
    .digest("hex")
    .slice(0, 32)
    .replace(/./g, (c) => String.fromCharCode(97 + Number.parseInt(c, 16)));
}
export const UNPACKED_EXTENSION_ID = extensionIdOf(UNPACKED_PUBLIC_KEY);

// localhost too: a second top-level site, so the smoke check can see whether the browser keeps one
// HTTP cache per site (test/smoke/remote-smoke.mjs).
export const DEV_PAGES = ["http://127.0.0.1/*", "http://localhost/*"];

/**
 * The policy of the extension's own pages, frames and worker. WebAssembly may be compiled (the
 * recognition runtime); requests go only to the extension itself and the image hosts, so a
 * redirect to any other host fails; pictures come from the extension, blob: and data: only.
 */
export function extensionPagesCsp(config, dev = false) {
  const hosts = config.imageHosts.map((h) => ` https://${h}`).join("");
  return [
    "script-src 'self' 'wasm-unsafe-eval'",
    "object-src 'self'",
    // A dev build may also fetch from a local server (a stand-in for the CDN, for the smoke check).
    `connect-src 'self'${hosts}${dev ? " http://127.0.0.1:*" : ""}`,
    "img-src 'self' blob: data:",
  ].join("; ");
}

export function buildManifest({ version, dev, store = false, config = loadForkConfig() }) {
  const sites = videoSitePatterns(config);
  const pages = dev ? [...sites, ...DEV_PAGES] : sites;
  const icons = { 16: "icons/icon-16.png", 32: "icons/icon-32.png", 48: "icons/icon-48.png", 128: "icons/icon-128.png" };
  return {
    manifest_version: 3,
    name: dev ? `${config.name} (dev)` : config.name,
    short_name: config.shortName,
    version,
    description: config.description,
    ...(store ? {} : { key: UNPACKED_PUBLIC_KEY }),
    minimum_chrome_version: "121",
    permissions: ["storage"],
    host_permissions: [...sites, ...imageHostPatterns(config)],
    background: { service_worker: "background.js", type: "module" },
    content_scripts: [{ matches: pages, js: ["content.js"], run_at: "document_idle", all_frames: true }],
    web_accessible_resources: [{ resources: ["compute.html", "tooltip.html"], matches: pages }],
    icons,
    action: { default_popup: "popup.html", default_title: config.name, default_icon: { 16: icons[16], 32: icons[32] } },
    content_security_policy: { extension_pages: extensionPagesCsp(config, dev) },
  };
}

/**
 * The add-on ID of a Firefox build: the config's `firefoxAddonId` (permanent once the listing is
 * published). A dev build carries its own, `<name>-dev@<domain>`, so it loads beside the installed
 * add-on instead of replacing it.
 */
export function firefoxAddonId(config, dev) {
  const id = config.firefoxAddonId;
  if (typeof id !== "string") return null;
  return dev ? id.replace("@", "-dev@") : id;
}
/**
 * 148 is the first Firefox with `location.ancestorOrigins`, which the compute and tooltip frames
 * need to know the page they are in (src/compute/compute.ts, src/tooltip/tooltip.ts): on an older
 * Firefox they would never start, and no card would show.
 */
export const FIREFOX_MIN_VERSION = "148.0";
/** Nothing about the user leaves the browser: the extension only downloads (settings, pictures,
 *  card details, releases) from its own CDN. */
export const FIREFOX_DATA_COLLECTION = { required: ["none"] };

/**
 * The Firefox form of a finished manifest. Firefox has no background service worker: the same
 * module runs as a background script (an event page). It has no `key` (an add-on's ID is the
 * gecko `id`) and no `minimum_chrome_version`. Permissions are the Chrome manifest's.
 */
export function firefoxManifest(manifest, { dev, config = loadForkConfig() }) {
  const id = firefoxAddonId(config, dev);
  if (id === null) throw new Error("duelsight.config.json has no firefoxAddonId: there is no Firefox build");
  const { key: _key, minimum_chrome_version: _min, background, ...rest } = manifest;
  return {
    ...rest,
    background: { scripts: [background.service_worker], type: background.type },
    browser_specific_settings: {
      gecko: {
        id,
        strict_min_version: FIREFOX_MIN_VERSION,
        data_collection_permissions: FIREFOX_DATA_COLLECTION,
      },
    },
  };
}

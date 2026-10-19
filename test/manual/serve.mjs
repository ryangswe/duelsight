// SPDX-License-Identifier: Apache-2.0
// A local page with one plain <video>, for checking the extension by hand (or headlessly) on a
// video file of your own. No footage is kept in this repository: you name the file.
//
//   npm run manual -- --video /path/to/clip.mp4 [--port 8770]
//
// It listens on 127.0.0.1 only and serves two things: the page (/) and the file (/video, with
// range requests so the video can seek). Only a dev build of the extension runs on this page.

import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const TYPES = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".mkv": "video/x-matroska", ".ogv": "video/ogg" };

export function startServer({ video, port = 8770 }) {
  const page = readFileSync(fileURLToPath(new URL("./index.html", import.meta.url)));
  const size = statSync(video).size;
  const type = TYPES[extname(video).toLowerCase()] ?? "application/octet-stream";
  const server = createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (path === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(page);
      return;
    }
    if (path !== "/video") {
      res.writeHead(404).end();
      return;
    }
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range) {
      const start = range[1] ? Number(range[1]) : size - Number(range[2]);
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (!(start >= 0 && start <= end)) {
        res.writeHead(416, { "content-range": `bytes */${size}` }).end();
        return;
      }
      res.writeHead(206, { "content-type": type, "content-length": end - start + 1, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes" });
      if (req.method === "HEAD") res.end();
      else createReadStream(video, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { "content-type": type, "content-length": size, "accept-ranges": "bytes" });
    if (req.method === "HEAD") res.end();
    else createReadStream(video).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { values } = parseArgs({ options: { video: { type: "string" }, port: { type: "string", default: "8770" } } });
  if (!values.video) {
    console.error("usage: npm run manual -- --video /path/to/clip.mp4 [--port 8770]");
    process.exit(2);
  }
  const server = await startServer({ video: values.video, port: Number(values.port) });
  const { port } = server.address();
  console.log(`test page: http://127.0.0.1:${port}/ (video: ${values.video})`);
}

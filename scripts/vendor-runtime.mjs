// SPDX-License-Identifier: Apache-2.0
// Vendor the open-source browser runtime (`cardvision-browser`) at a recorded commit.
//
//   node scripts/vendor-runtime.mjs --repo <path to a cardvision toolkit checkout> [--commit <sha>]
//                                   --opencv <folder with opencv.mjs, opencv_js.wasm, opencv.mjs.LEGAL.txt>
//
// What it does, in a temporary folder outside this repository:
//   1. `git archive` the runtime's `browser/` folder (and the repository's LICENSE and NOTICE)
//      at the commit, so the copy is exactly that commit whatever the checkout's state;
//   2. put OpenCV.js (built by the runtime's scripts/build-opencv.mjs, which git does not keep)
//      into its vendor/opencv/, after checking both built files against the commit's
//      opencv.lock.json; then `npm ci && npm run build` there (the runtime's own build, which
//      copies OpenCV.js beside the worker);
//   3. emits TypeScript declarations for the runtime's sources (types only, for our type check).
//
// Then it copies into vendor/cardvision-browser/:
//   cardvision.js, worker.js         the runtime's built modules (ONNX Runtime Web's JS included)
//   opencv.mjs, opencv_js.wasm       OpenCV.js for the geometric stage, and its licenses
//   opencv.mjs.LEGAL.txt             (OpenCV, zlib, Emscripten's runtime, musl, libc++, compiler-rt)
//   *.LEGAL.txt                      the license comments of the code bundled into them
//   LICENSE, NOTICE                  the runtime's license and notice (ONNX Runtime Web's MIT
//                                    license is in THIRD_PARTY_LICENSES.txt at the top)
//   types/                           declarations of the runtime's API, and cardvision.d.ts
//   VENDOR.json                      the commit, the runtime's version, the ONNX Runtime pin and
//                                    the OpenCV.js lock
//
// ONNX Runtime Web's WebAssembly files (about 28 MB) are not vendored: `npm run build` copies
// them from this repository's own `onnxruntime-web` dependency, pinned to the version VENDOR.json
// records, and checks that it is the pair worker.js loads.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const DEFAULT_COMMIT = "9e59fee";
const OPENCV_FILES = ["opencv.mjs", "opencv_js.wasm", "opencv.mjs.LEGAL.txt"];

const { values } = parseArgs({
  options: {
    repo: { type: "string" },
    commit: { type: "string", default: DEFAULT_COMMIT },
    opencv: { type: "string" },
    keep: { type: "boolean", default: false },
  },
});
if (!values.repo || !values.opencv) {
  console.error("usage: node scripts/vendor-runtime.mjs --repo <cardvision toolkit checkout> --opencv <OpenCV.js folder> [--commit <sha>]");
  process.exit(2);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "vendor", "cardvision-browser");
const git = (...args) => execFileSync("git", ["-C", values.repo, ...args], { encoding: "utf-8" }).trim();
const commit = git("rev-parse", `${values.commit}^{commit}`);

const work = mkdtempSync(join(tmpdir(), "duelsight-vendor-"));
try {
  execFileSync("sh", ["-c", `git -C "$0" archive "$1" browser LICENSE NOTICE | tar -x -C "$2"`, values.repo, commit, work], { stdio: "inherit" });
  const browser = join(work, "browser");
  // OpenCV.js, checked against the lock of this very commit.
  const lock = JSON.parse(readFileSync(join(browser, "opencv.lock.json"), "utf-8"));
  mkdirSync(join(browser, "vendor", "opencv"), { recursive: true });
  for (const name of OPENCV_FILES) {
    const from = join(resolve(values.opencv), name);
    if (!existsSync(from)) throw new Error(`--opencv lacks ${name}`);
    const pinned = lock.built.files[name];
    if (pinned) {
      const bytes = readFileSync(from);
      const sha = createHash("sha256").update(bytes).digest("hex");
      if (sha !== pinned.sha256 || bytes.length !== pinned.bytes) throw new Error(`${name} does not match opencv.lock.json (sha256 ${sha}, ${bytes.length} bytes)`);
    }
    copyFileSync(from, join(browser, "vendor", "opencv", name));
  }
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: browser, stdio: "inherit" });
  execFileSync("npm", ["run", "build"], { cwd: browser, stdio: "inherit" });
  // Declarations of src/ only, for this repository's type check. Nothing of them runs.
  writeFileSync(
    join(browser, "tsconfig.types.json"),
    JSON.stringify({
      extends: "./tsconfig.json",
      compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, outDir: "types", types: ["@webgpu/types"] },
      include: ["src"],
    }),
  );
  execFileSync(join(browser, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.types.json"], { cwd: browser, stdio: "inherit" });

  const pkg = JSON.parse(readFileSync(join(browser, "package.json"), "utf-8"));
  const ortVersion = pkg.dependencies["onnxruntime-web"];
  const worker = readFileSync(join(browser, "dist", "worker.js"), "utf-8");
  const ortFiles = [...new Set(worker.match(/ort-wasm-[a-z-]+(?:\.[a-z]+)*\.(?:wasm|mjs)/g) ?? [])].sort();

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const name of ["cardvision.js", "cardvision.js.LEGAL.txt", "worker.js", "worker.js.LEGAL.txt", ...OPENCV_FILES]) {
    if (!existsSync(join(browser, "dist", name))) throw new Error(`the runtime's build did not write dist/${name}`);
    copyFileSync(join(browser, "dist", name), join(out, name));
    chmodSync(join(out, name), 0o644);
  }
  copyFileSync(join(work, "LICENSE"), join(out, "LICENSE"));
  copyFileSync(join(work, "NOTICE"), join(out, "NOTICE"));
  cpSync(join(browser, "types"), join(out, "types"), { recursive: true });
  writeFileSync(join(out, "cardvision.d.ts"), '// Declarations of the vendored runtime, generated by scripts/vendor-runtime.mjs.\nexport * from "./types/index.js";\n');
  writeFileSync(
    join(out, "VENDOR.json"),
    `${JSON.stringify(
      {
        package: pkg.name,
        version: pkg.version,
        license: pkg.license,
        source: "cardvision-browser, the browser runtime of the cardvision toolkit (source published with the toolkit release)",
        commit,
        onnxruntimeWeb: ortVersion,
        ortFiles,
        opencv: { lock, legalSha256: createHash("sha256").update(readFileSync(join(out, "opencv.mjs.LEGAL.txt"))).digest("hex") },
        files: readdirSync(out).filter((n) => n !== "VENDOR.json" && n !== "types").sort(),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`vendored ${pkg.name} ${pkg.version} at ${commit} into vendor/cardvision-browser (onnxruntime-web ${ortVersion}; worker loads ${ortFiles.join(", ")})`);
} finally {
  if (values.keep) console.log(`kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}
if (!existsSync(join(out, "worker.js"))) process.exit(1);

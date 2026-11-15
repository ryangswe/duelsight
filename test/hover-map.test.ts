// SPDX-License-Identifier: Apache-2.0
// docs/hover-map.md names the code it maps, and the names are real.
//
// The map ties each element to code by anchors, written `src/<file>.ts#<symbol>`. This test checks
// names: the file exists, the file defines the symbol (a function, class, interface, type,
// constant, or a method or arrow-function property of a class, not just a mention), every hover
// spec clause the map cites is in the vendored spec (vendor/cardvision-browser/hover-spec.json),
// and every file in the map's coverage list carries at least one anchor. It does not check
// behavior; the diagrams are read by a reviewer. A port of the toolkit's tests/test_hover_map.py.
// Nothing here reads the network.

import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MAP = join(ROOT, "docs", "hover-map.md");
const SPEC = join(ROOT, "vendor", "cardvision-browser", "hover-spec.json");

const FIX = "update docs/hover-map.md in the same change (the names it anchors, the clause ids it cites, its coverage list)";

/** `src/x.ts` or `src/x.ts#Class.member`, in backticks. */
const ANCHOR = /`(src\/[A-Za-z0-9_./-]+\.ts)(?:#([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?))?`/g;
const CLAUSE = /\bS-[A-Z]\d+\b/g;

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function anchorsIn(text: string): Array<[string, string]> {
  return [...text.matchAll(ANCHOR)].map((m) => [m[1]!, m[2] ?? ""]);
}

/** The map's body, and its `## Coverage` section. */
export function splitCoverage(text: string): [string, string] {
  const at = text.indexOf("\n## Coverage\n");
  return at < 0 ? [text, ""] : [text.slice(0, at), text.slice(at + "\n## Coverage\n".length)];
}

/** The source without comments and the text of quoted strings, so braces in them are not counted. */
export function stripCode(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\'"`])\/\/[^\n]*/gm, "$1")
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, '""');
}

/** The lines of `cls` that start at the depth of its members (not inside a method's body). */
function classMembers(source: string, cls: string): string[] {
  const lines = stripCode(source).split("\n");
  const start = lines.findIndex((line) => new RegExp(`\\bclass\\s+${escape(cls)}\\b`).test(line));
  if (start < 0) return [];
  const members: string[] = [];
  let depth = 0;
  let opened = false;
  for (const line of lines.slice(start)) {
    if (opened && depth === 1) members.push(line);
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    opened = opened || depth > 0;
    if (opened && depth <= 0) break;
  }
  return members;
}

const MODIFIERS = "(?:(?:private|public|protected|static|async|readonly|override)\\s+)*";

/** A method's opening line: `name(...) {`, with its modifiers and return type. */
function methodLine(name: string, flags = ""): RegExp {
  return new RegExp(`^[ \\t]+${MODIFIERS}(?:(?:get|set)\\s+)?${escape(name)}\\s*(?:<[^>\\n]*>)?\\([^\\n]*\\)\\s*(?::[^\\n]*)?\\{\\s*(?:\\}\\s*)?$`, flags);
}

/** An arrow-function property's opening line: `name = (...) => {` or `name = (event: E): void => {`. */
function arrowProperty(name: string): RegExp {
  return new RegExp(`^[ \\t]+${MODIFIERS}${escape(name)}\\s*(?::[^=\\n]*)?=\\s*(?:async\\s+)?\\([^\\n]*\\)\\s*(?::[^\\n]*)?=>`);
}

/**
 * Whether `source` defines `symbol` rather than mentions it. `name`: a function, class,
 * interface, type, enum or constant, or a method. `Class.name`: a method or arrow-function
 * property written in the body of that class, and nothing else (a local of the same name does
 * not count).
 */
export function defined(source: string, symbol: string): boolean {
  const dot = symbol.lastIndexOf(".");
  if (dot >= 0) {
    const cls = symbol.slice(0, dot);
    const name = symbol.slice(dot + 1);
    const method = methodLine(name);
    const arrow = arrowProperty(name);
    return classMembers(source, cls).some((line) => method.test(line) || arrow.test(line));
  }
  const code = stripCode(source);
  const declared = new RegExp(`\\b(?:function\\*?|class|interface|type|enum|const|let|var)\\s+${escape(symbol)}\\b`);
  return declared.test(code) || methodLine(symbol, "m").test(code);
}

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

export function clauseIds(specJson: string): Set<string> {
  const spec = JSON.parse(specJson) as { clauses?: Array<{ id?: unknown }> };
  return new Set((spec.clauses ?? []).map((c) => c.id).filter((id): id is string => typeof id === "string"));
}

export function problemsOf(text: string, root: string, clauses: Set<string>): string[] {
  const [body, coverage] = splitCoverage(text);
  const found: string[] = [];
  const anchored = new Set<string>();
  const anchors = anchorsIn(body);
  if (anchors.length === 0) found.push("the map has no anchors");
  for (const [path, symbol] of anchors) {
    const file = join(root, path);
    if (!isFile(file)) {
      found.push(`anchor ${path}#${symbol}: the file does not exist`);
      continue;
    }
    anchored.add(path);
    if (symbol && !defined(readFileSync(file, "utf-8"), symbol)) found.push(`anchor ${path}#${symbol}: ${path} defines no ${symbol}`);
  }
  for (const clause of [...new Set(body.match(CLAUSE) ?? [])].sort()) {
    if (!clauses.has(clause)) found.push(`clause ${clause} is not in the vendored hover spec`);
  }
  const covered = anchorsIn(coverage);
  if (covered.length === 0) found.push("the map has no coverage list");
  for (const [path] of covered) {
    if (!isFile(join(root, path))) found.push(`coverage ${path}: the file does not exist`);
    else if (!anchored.has(path)) found.push(`coverage ${path}: no anchor in the map names this file`);
  }
  if ((body.match(/^```mermaid$/gm) ?? []).length < 3 || !body.includes("sequenceDiagram")) {
    found.push("the map needs its Mermaid diagrams (at least three, one a sequenceDiagram)");
  }
  return found;
}

describe("docs/hover-map.md", () => {
  it("matches the code", () => {
    const found = problemsOf(readFileSync(MAP, "utf-8"), ROOT, clauseIds(readFileSync(SPEC, "utf-8")));
    expect(found, `docs/hover-map.md is out of date with the code: ${FIX}\n  ${found.join("\n  ")}`).toEqual([]);
  });

  it("lists each covered source file once", () => {
    const paths = anchorsIn(splitCoverage(readFileSync(MAP, "utf-8"))[1]).map(([p]) => p);
    expect(paths.length > 0 && paths.length === new Set(paths).size, `the coverage list is empty or repeats a file: ${FIX}`).toBe(true);
  });
});

// The checker itself, on small trees: it must fail on each kind of drift.

const SOURCE = `export const LIMIT = 3;
export interface Thing { a: number }
export function top(x: number): number {
  const inner = (): void => {};
  return x;
}
export class Box {
  private hidden(): boolean {
    return true;
  }
  show(a: number, b?: string): void {
    const inner = 1;
    this.hidden();
  }
  private readonly onEvent = (event: Event): void => {
    const local = (): void => {};
  };
}
export class Other {
  other(): void {
    const inner = (): void => {};
  }
}
// mentioned() only in a comment
`;
const GOOD = `# Map

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
\`\`\`mermaid
sequenceDiagram
  A->>B: m
\`\`\`

| E | Anchors | Spec |
| --- | --- | --- |
| a | \`src/x.ts#top\`, \`src/x.ts#Box.show\`, \`src/x.ts#Box.onEvent\`, \`src/x.ts#LIMIT\` | S-A1 |

## Coverage

- \`src/x.ts\`
`;
const CLAUSES = clauseIds(JSON.stringify({ clauses: [{ id: "S-A1" }] }));

function tree(): string {
  const root = mkdtempSync(join(tmpdir(), "hover-map-"));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "x.ts"), SOURCE);
  writeFileSync(join(root, "src", "y.ts"), "export const Y = 1;\n");
  return root;
}

describe("the hover map's checker", () => {
  it("passes a sound map", () => {
    expect(problemsOf(GOOD, tree(), CLAUSES)).toEqual([]);
  });

  it.each([
    ["#top`", "#bottom`", "defines no bottom"],
    ["#Box.show`", "#Box.hide`", "defines no Box.hide"],
    ["#Box.show`", "#Crate.show`", "defines no Crate.show"],
    ["#Box.show`", "#Other.show`", "defines no Other.show"],
    ["#Box.show`", "#Box.inner`", "defines no Box.inner"],
    ["#Box.onEvent`", "#Box.local`", "defines no Box.local"],
    ["#Box.onEvent`", "#Other.onEvent`", "defines no Other.onEvent"],
    ["#LIMIT`", "#mentioned`", "defines no mentioned"],
    ["src/x.ts#top", "src/gone.ts#top", "the file does not exist"],
    ["| S-A1 |", "| S-A9 |", "clause S-A9 is not in the vendored hover spec"],
    ["- `src/x.ts`", "- `src/x.ts`\n- `src/y.ts`", "coverage src/y.ts: no anchor"],
    ["- `src/x.ts`", "- `src/gone.ts`", "coverage src/gone.ts: the file does not exist"],
    ["sequenceDiagram", "gantt", "needs its Mermaid diagrams"],
  ])("finds the drift when %s becomes %s", (from, to, expected) => {
    expect(GOOD.includes(from)).toBe(true);
    const found = problemsOf(GOOD.replace(from, to), tree(), CLAUSES);
    expect(found.some((line) => line.includes(expected)), found.join("\n")).toBe(true);
  });

  it("does not count the coverage list as an anchor", () => {
    const onlyListed = `${GOOD.split("| E |")[0]}\n## Coverage\n\n- \`src/x.ts\`\n`;
    expect(problemsOf(onlyListed, tree(), CLAUSES).some((line) => line.includes("the map has no anchors"))).toBe(true);
  });

  it("needs a member of that class for a dotted anchor, not a local or a function", () => {
    const source = "export class A {\n  run(): void {\n    const show = (): void => {};\n  }\n}\nexport function show(): void {}\nexport class B {\n  show(): void {}\n}\n";
    expect(defined(source, "A.show")).toBe(false);
    expect(defined(source, "B.show")).toBe(true);
    expect(defined(source, "A.missing")).toBe(false);
    expect(defined("export class A {}\nconst show = 1;\n", "A.show")).toBe(false);
  });

  it("takes an arrow-function property as a member, and a plain field as none", () => {
    const source = "export class A {\n  private readonly onTick = (): void => {\n    this.n += 1;\n  };\n  private count = 0;\n}\n";
    expect(defined(source, "A.onTick")).toBe(true);
    expect(defined(source, "A.count")).toBe(false);
  });

  it("does not take a comment or a string for a symbol", () => {
    const source = '// export function gone(): void {}\n/* const gone = 1; */\nconst text = "function gone() {}";\n';
    expect(defined(source, "gone")).toBe(false);
    expect(defined("export function gone(): void {}\n", "gone")).toBe(true);
  });

  it("reads the clause ids from the vendored spec's shape", () => {
    expect([...clauseIds(readFileSync(SPEC, "utf-8"))]).toContain("S-A1");
  });
});

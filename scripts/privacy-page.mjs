// SPDX-License-Identifier: Apache-2.0
// The privacy policy as one web page for the CDN (<cdnBase>/privacy.html), the address the Chrome
// Web Store listing gives as its privacy policy. The page is PRIVACY.md word for word: one source,
// so the page and the repository never disagree. Self-contained: no script, no external file.
//
//   node scripts/privacy-page.mjs --out <folder outside the repository>
//   cd cdn && .venv/bin/python dscdn.py publish --env-file .env --page <that folder>/privacy.html
//
// It handles the Markdown PRIVACY.md uses: # and ## headings, paragraphs, "- " lists (nested by two
// spaces, continued on indented lines), pipe tables, **bold**, `code`, [text](https://…) and bare
// https:// links. Anything else is printed as text.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { insideRepository } from "./card-details.mjs";
import { loadForkConfig } from "./fork-config.mjs";

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One line of Markdown text as HTML: code, bold and links; everything else escaped. */
export function inline(text) {
  const parts = [];
  // Code spans are taken out first so nothing inside them is read as bold or a link.
  let s = escapeHtml(text).replace(/`([^`]+)`/g, (_, c) => {
    parts.push(`<code>${c}</code>`);
    return `\u0000${parts.length - 1}\u0000`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => {
    parts.push(`<a href="${u}">${t}</a>`);
    return `\u0000${parts.length - 1}\u0000`;
  });
  s = s.replace(/https?:\/\/[^\s<,\u0000]*[^\s<,.\u0000]/g, (u) => `<a href="${u}">${u}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[Number(i)]);
}

/** The body HTML of a Markdown document, and its first # heading. */
export function markdownBody(markdown) {
  const lines = markdown.replace(/<!--[\s\S]*?-->\s*/g, "").split("\n");
  const out = [];
  let title = "Privacy";
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,3}) (.*)$/.exec(line);
    if (h) {
      if (h[1].length === 1) title = h[2];
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const [head, ...rest] = rows;
      const body = rest.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      out.push(['<div class="table"><table>',
        `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`, "<tbody>",
        ...body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`), "</tbody></table></div>"].join("\n"));
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].trim() && (/^\s*- /.test(lines[i]) || lines[i].startsWith("  "))) {
        const m = /^(\s*)- (.*)$/.exec(lines[i]);
        if (m) items.push({ depth: Math.floor(m[1].length / 2), text: m[2] });
        else items[items.length - 1].text += ` ${lines[i].trim()}`;
        i++;
      }
      const html = ["<ul>"];
      let depth = 0;
      for (const item of items) {
        while (depth < item.depth) { html[html.length - 1] = html[html.length - 1].replace(/<\/li>$/, ""); html.push("<ul>"); depth++; }
        while (depth > item.depth) { html.push("</ul></li>"); depth--; }
        html.push(`<li>${inline(item.text)}</li>`);
      }
      while (depth > 0) { html.push("</ul></li>"); depth--; }
      out.push([...html, "</ul>"].join("\n"));
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |\||- )/.test(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return { title, body: out.join("\n") };
}

/** The whole page: the policy, light and dark, readable on a phone. */
export function privacyPage(markdown, projectName) {
  const { title, body } = markdownBody(markdown);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(projectName)}: ${escapeHtml(title)}</title>
<style>
:root { --bg: #ffffff; --fg: #1d1b24; --muted: #5d5870; --line: #ddd9e8; --accent: #3b2a78; --code: #f2f0f7; }
@media (prefers-color-scheme: dark) { :root { --bg: #15131c; --fg: #ebe8f3; --muted: #a49fb6; --line: #34304a; --accent: #b6a6f0; --code: #221f2e; } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 1.9rem; margin: 0 0 .5rem; } h2 { font-size: 1.3rem; margin: 2rem 0 .5rem; border-top: 1px solid var(--line); padding-top: 1.25rem; }
a { color: var(--accent); } code { background: var(--code); padding: 0 .3em; border-radius: 4px; font-size: .92em; }
ul { padding-left: 1.3rem; } li { margin: .3rem 0; }
.table { overflow-x: auto; } table { border-collapse: collapse; font-size: .92rem; min-width: 640px; }
th, td { border: 1px solid var(--line); padding: .45rem .6rem; text-align: left; vertical-align: top; }
th { background: var(--code); }
footer { margin-top: 2.5rem; color: var(--muted); font-size: .85rem; }
</style>
</head>
<body>
<main>
${body}
<footer>This page is the extension's PRIVACY.md, published as a page.</footer>
</main>
</body>
</html>
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { out: { type: "string" } } });
  const root = fileURLToPath(new URL("..", import.meta.url));
  if (!values.out) {
    console.error("usage: node scripts/privacy-page.mjs --out <folder outside the repository>");
    process.exit(2);
  }
  if (insideRepository(values.out, root)) {
    console.error("--out is inside the repository: write the page outside it (it is published, not committed)");
    process.exit(2);
  }
  const config = loadForkConfig();
  const page = privacyPage(readFileSync(join(root, "PRIVACY.md"), "utf-8"), config.name);
  mkdirSync(values.out, { recursive: true });
  const file = join(resolve(values.out), "privacy.html");
  writeFileSync(file, page);
  console.log(`wrote ${file} (${Buffer.byteLength(page)} bytes); publish it with cdn/dscdn.py publish --page ${file}`);
}

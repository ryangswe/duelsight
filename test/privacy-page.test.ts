// SPDX-License-Identifier: Apache-2.0
// scripts/privacy-page.mjs: PRIVACY.md as one self-contained page for the CDN, word for word.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { inline, markdownBody, privacyPage } from "../scripts/privacy-page.mjs";

const PRIVACY = readFileSync(new URL("../PRIVACY.md", import.meta.url), "utf-8");

/** The words of a text, Markdown or HTML marks removed. */
function words(text: string): string[] {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:a|code|strong)\b[^>]*>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#+ /gm, "")
    .replace(/[*`]/g, "")
    .replace(/\|/g, " ")
    .replace(/^\s*- /gm, " ")
    .split(/\s+/)
    .filter((w) => w && !/^:?-+:?$/.test(w));
}

describe("privacyPage", () => {
  const page: string = privacyPage(PRIVACY, "DuelSight");

  it("is PRIVACY.md word for word", () => {
    const body = page.slice(page.indexOf("<main>"), page.indexOf("<footer>"));
    expect(words(body)).toEqual(words(PRIVACY));
  });

  it("is one self-contained page: no script, nothing loaded from elsewhere", () => {
    expect(page.startsWith("<!doctype html>")).toBe(true);
    expect(page).not.toMatch(/<script|<link|<img|<iframe|@import|src=/i);
    expect(page).toContain("<title>DuelSight: Privacy</title>");
  });

  it("keeps the policy's links and its table", () => {
    expect(page).toContain('<a href="https://www.cloudflare.com/privacypolicy/">privacy policy</a>');
    expect(page).toContain("<th>What the host learns</th>");
  });
});

describe("markdown subset", () => {
  it("escapes HTML and reads code, bold and links", () => {
    expect(inline("a <b> & `x <y>` **bold** [t](https://e.org/p) see https://e.org/q.")).toBe(
      'a &lt;b&gt; &amp; <code>x &lt;y&gt;</code> <strong>bold</strong> <a href="https://e.org/p">t</a> see <a href="https://e.org/q">https://e.org/q</a>.',
    );
  });

  it("does not read a link or bold inside code", () => {
    expect(inline("`**not bold** https://e.org`")).toBe("<code>**not bold** https://e.org</code>");
  });

  it("nests lists by two spaces and joins continued lines", () => {
    const { body } = markdownBody("- one\n  continued\n  - inner\n- two\n");
    expect(body).toBe("<ul>\n<li>one continued\n<ul>\n<li>inner</li>\n</ul></li>\n<li>two</li>\n</ul>");
  });

  it("takes the title from the first # heading", () => {
    expect(markdownBody("# Privacy\n\nText.\n").title).toBe("Privacy");
  });
});

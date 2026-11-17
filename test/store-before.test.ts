// SPDX-License-Identifier: Apache-2.0
// scripts/store-before.mjs: the release file's `before` addresses as warnings on a pull request.
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

// @ts-expect-error plain JavaScript build scripts
import { beforeFormProblems, beforeProblems, splitBefore, workflowMessage } from "../scripts/store-before.mjs";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

function fakeFetch(pages: Record<string, { status: number; body?: string } | Error>) {
  return async (url: string) => {
    const page = pages[url];
    if (page === undefined) throw new Error(`unexpected fetch ${url}`);
    if (page instanceof Error) throw page;
    return new Response(page.body ?? "", { status: page.status });
  };
}

describe("splitBefore", () => {
  it("takes `before` out and keeps the rest as it was", () => {
    const release = {
      version: "1.2.3",
      chrome: { submit: "auto", publish: "default" },
      before: [{ url: "https://cdn.example/privacy.html" }],
      permissionsChanged: false,
    };
    const { release: rest, before } = splitBefore(release);
    expect(rest).toEqual({ version: "1.2.3", chrome: { submit: "auto", publish: "default" }, permissionsChanged: false });
    expect(before).toEqual([{ url: "https://cdn.example/privacy.html" }]);
    expect(release.before).toHaveLength(1);
  });

  it("gives an empty list when there is no `before`", () => {
    expect(splitBefore({ version: "1.2.3" })).toEqual({ release: { version: "1.2.3" }, before: [] });
  });
});

describe("beforeFormProblems", () => {
  const good = { url: "https://cdn.example/privacy.html", sha256: "a".repeat(64), why: "PRIVACY.md changed" };

  it("accepts a well-formed list, and none at all", () => {
    expect(beforeFormProblems({ version: "1.2.3", before: [good, { url: good.url }] })).toEqual([]);
    expect(beforeFormProblems({ version: "1.2.3" })).toEqual([]);
  });

  it("names what the toolkit's release-file reader would refuse", () => {
    expect(beforeFormProblems({ before: { url: good.url } })).toEqual(["before must be a list"]);
    expect(beforeFormProblems({
      before: [
        { url: "http://cdn.example/privacy.html" },
        { url: good.url, sha: "abc" },
        { url: good.url, sha256: "A".repeat(64) },
        { url: good.url, sha256: "a".repeat(63) },
        "https://cdn.example/privacy.html",
      ],
    })).toEqual([
      "before[0] needs an https url",
      'before[1]: unknown key "sha"',
      "before[2].sha256 must be 64 hex",
      "before[3].sha256 must be 64 hex",
      "before[4] needs an https url",
    ]);
  });
});

describe("beforeProblems", () => {
  const url = "https://cdn.example/privacy.html";

  it("passes a live address whose sha256 matches", async () => {
    const problems = await beforeProblems([{ url, sha256: sha("page") }], fakeFetch({ [url]: { status: 200, body: "page" } }));
    expect(problems).toEqual([]);
  });

  it("passes a live address without a sha256", async () => {
    expect(await beforeProblems([{ url }], fakeFetch({ [url]: { status: 200, body: "anything" } }))).toEqual([]);
  });

  it("names an older page by its sha256, with the reason", async () => {
    const problems = await beforeProblems(
      [{ url, sha256: sha("new page"), why: "PRIVACY.md changed" }],
      fakeFetch({ [url]: { status: 200, body: "old page" } }),
    );
    expect(problems).toEqual([`${url}: sha256 ${sha("old page").slice(0, 16)}… is not ${sha("new page").slice(0, 16)}… (PRIVACY.md changed)`]);
  });

  it("names a status other than 200, and a network error", async () => {
    const other = "https://cdn.example/other.html";
    const problems = await beforeProblems(
      [{ url }, { url: other }],
      fakeFetch({ [url]: { status: 404 }, [other]: new Error("getaddrinfo ENOTFOUND") }),
    );
    expect(problems).toEqual([`${url}: HTTP 404`, `${other}: getaddrinfo ENOTFOUND`]);
  });
});

describe("workflowMessage", () => {
  it("escapes what would end or change a workflow command", () => {
    expect(workflowMessage("100% done\r\nnext")).toBe("100%25 done%0D%0Anext");
  });
});

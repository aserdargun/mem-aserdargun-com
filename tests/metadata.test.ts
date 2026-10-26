import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pageDescription } from "../src/i18n";

const ROOT = resolve(__dirname, "..");
const html = readFileSync(resolve(ROOT, "index.html"), "utf8");

const metaContent = (attr: "name" | "property", key: string): string => {
  const tag =
    html.match(new RegExp(`<meta[^>]*\\b${attr}="${key}"[^>]*>`))?.[0] ?? "";
  return tag.match(/content="([^"]*)"/)?.[1] ?? "";
};

/* Letters that only the Turkish description carries. An English page whose
 * description contains one of them is a Turkish sentence in the wrong slot. */
const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;

describe("the page's own metadata", () => {
  it("describes the default page in the language the default page is in", () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(metaContent("name", "description")).toBe(pageDescription.en);
    expect(metaContent("name", "description")).not.toMatch(TURKISH);
  });

  it("keeps the social descriptions in the default page's language", () => {
    // A crawler reads Open Graph and Twitter tags without running the app, so
    // these describe the canonical page: the default, English one. (Twitter
    // card tags use name=, Open Graph tags use property=.)
    const social: [ "name" | "property", string ][] = [
      ["property", "og:description"],
      ["name", "twitter:description"],
    ];
    for (const [attr, key] of social) {
      const content = metaContent(attr, key);
      expect(content.length, `${key} is missing or too short`).toBeGreaterThan(50);
      expect(content, `${key} is not in the page's language`).not.toMatch(TURKISH);
    }
  });

  it("carries a Turkish description for the Turkish entry point", () => {
    expect(pageDescription.tr).toMatch(TURKISH);
    expect(pageDescription.tr).not.toBe(pageDescription.en);
    expect(pageDescription.en).not.toBe("");
  });

  it("points every meta description at the same canonical page", () => {
    expect(html).toMatch(
      /<link rel="canonical" href="https:\/\/mem\.aserdargun\.com\/" \/>/,
    );
  });
});

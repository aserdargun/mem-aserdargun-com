import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve("dist");
const release = JSON.parse(readFileSync(resolve(root, "release.json"), "utf8"));
assert.equal(release.schemaVersion, 1);
assert.equal(release.app, "MEM");
assert.match(release.commit, /^[a-f0-9]{40}$/);
const html = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(html, /<title>MEM — Agent Memory Laboratory<\/title>/);
const paths = new Set(release.files.map((file) => file.path));
for (const file of release.files) {
  assert(!file.path.includes("..") && !file.path.startsWith("/"));
  assert(!file.path.endsWith(".map"));
  const bytes = readFileSync(resolve(root, file.path));
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
}
for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) {
  assert(paths.has(url.slice(1)), `Missing referenced asset ${url}`);
}
/* The HTML check above only sees what index.html links. Every other asset the
 * browser is told to fetch arrives through a CSS `url()` or a string baked
 * into the bundle, and those references are invisible to it: a font that is
 * dropped from the artifact still passes this gate, then 404s on the live
 * site and silently falls back to a system face. Reading the reference
 * targets back out of the built files is what closes that hole, so the
 * manifest is checked against the artifacts that actually request it. */
const referenced = new Set();
for (const file of release.files) {
  if (!/\.(css|js)$/.test(file.path)) continue;
  const source = readFileSync(resolve(root, file.path), "utf8");
  for (const [, url] of source.matchAll(/url\(\s*['"]?(\/[^)'"\s]+)/g)) {
    referenced.add(url.slice(1));
  }
  /* Vite writes asset URLs into the bundle as plain absolute strings. Only
   * paths that carry a hashed asset extension are ours to require: data URIs,
   * runtime endpoints and the SPA fallback are not files in this artifact. */
  for (const [, url] of source.matchAll(/["'](\/assets\/[^"']+?\.[a-z0-9]{8}\.[a-z0-9]+)["']/g)) {
    referenced.add(url.slice(1));
  }
}
for (const path of referenced) {
  assert(
    paths.has(path),
    `${path} is requested by a built file but missing from the release manifest`,
  );
}
for (const excluded of ["src", "tests", "node_modules", ".git", "package.json"])
  assert(
    !existsSync(resolve(root, excluded)),
    `Unexpected internal ${excluded}`,
  );
const config = JSON.parse(
  readFileSync(resolve(root, "staticwebapp.config.json"), "utf8"),
);
assert.equal(config.navigationFallback.rewrite, "/index.html");
console.log(
  `PASS: MEM static artifact, ${release.files.length} files, ${referenced.size} referenced assets present, complete release identity`,
);

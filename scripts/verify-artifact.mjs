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
  `PASS: MEM static artifact, ${release.files.length} files, complete release identity`,
);

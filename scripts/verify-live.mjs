import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const raw = process.env.MEM_BASE_URL;
if (!raw) throw new Error("MEM_BASE_URL must identify the deployed site");
const base = new URL(raw);
assert.equal(base.protocol, "https:");
assert(
  base.hostname === "yellow-pebble-060d84e03.1.azurestaticapps.net" ||
    base.hostname === "mem.aserdargun.com",
  "Expected the MEM custom domain or its verified Azure hostname",
);
const expected =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
let release;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    const r = await fetch(new URL(`/release.json?commit=${expected}`, base), {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (r.ok) {
      const candidate = await r.json();
      if (candidate.commit === expected) {
        release = candidate;
        break;
      }
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 3000));
}
assert(release, `Live release does not match ${expected}`);
assert.equal(release.app, "MEM");
assert.equal(
  release.sourceTreeDirty,
  false,
  "Published artifact must come from a clean commit",
);
// Azure consumes its routing config rather than serving it as a public artifact.
for (const file of release.files.filter(
  (f) => f.path !== "staticwebapp.config.json",
)) {
  assert(!file.path.startsWith("/") && !file.path.includes(".."));
  const response = await fetch(
    new URL(`/${file.path}?commit=${expected}`, base),
    { signal: AbortSignal.timeout(20000) },
  );
  assert.equal(response.status, 200, file.path);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.sha256,
    `Hash mismatch: ${file.path}`,
  );
  const type = response.headers.get("content-type") || "";
  if (file.path.endsWith(".html")) assert(type.includes("text/html"));
  if (file.path.endsWith(".js")) assert(/javascript/.test(type));
  if (file.path.endsWith(".css")) assert(type.includes("text/css"));
  if (file.path.endsWith(".svg")) assert(type.includes("image/svg+xml"));
  if (file.path.endsWith(".woff2")) assert(/woff2|octet-stream/.test(type));
}
console.log(
  `PASS: ${base.origin} release ${expected}; ${release.files.length - 1} public assets match SHA-256 and expected MIME types`,
);

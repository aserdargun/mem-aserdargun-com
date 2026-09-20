import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";
const root = resolve("dist");
const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(commit))
  throw new Error("A complete Git commit is required");
const sourceTreeDirty =
  execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    encoding: "utf8",
  }).trim().length > 0;
const files = [];
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.name !== "release.json") {
      const bytes = readFileSync(path);
      files.push({
        path: relative(root, path).split("\\").join("/"),
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
}
visit(root);
files.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(
  resolve(root, "release.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      app: "MEM",
      commit,
      sourceTreeDirty,
      builtAt: new Date().toISOString(),
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Release ${commit.slice(0, 7)}: ${files.length} hashed files`);

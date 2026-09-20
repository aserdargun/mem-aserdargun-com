import { spawn, execFileSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  openSync,
  readFileSync,
  existsSync,
  unlinkSync,
  realpathSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = realpathSync(fileURLToPath(new URL("..", import.meta.url))),
  dir = resolve(root, ".local"),
  pidFile = resolve(dir, "server.pid");
const port = 8041;
const pids = () => {
  try {
    return execFileSync("lsof", ["-t", `-iTCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
};
const owns = (pid) => {
  try {
    const cwd = execFileSync(
      "lsof",
      ["-a", "-p", String(pid), "-d", "cwd", "-Fn"],
      { encoding: "utf8" },
    )
      .split("\n")
      .find((s) => s.startsWith("n"))
      ?.slice(1);
    const cmd = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
    });
    return cwd && realpathSync(cwd) === root && cmd.includes("vite");
  } catch {
    return false;
  }
};
const action = process.argv[2];
if (action === "stop") {
  const listeners = pids();
  if (listeners.some((pid) => !owns(pid)))
    throw Error("Refusing to stop a foreign checkout listener.");
  for (const pid of listeners) process.kill(pid, "SIGTERM");
  if (existsSync(pidFile)) {
    const pid = Number(readFileSync(pidFile, "utf8"));
    if (owns(pid) && !listeners.includes(pid)) process.kill(pid, "SIGTERM");
    unlinkSync(pidFile);
  }
  console.log("MEM preview stopped (or already stopped).");
} else if (action === "start") {
  const listeners = pids();
  if (listeners.length) {
    if (listeners.every(owns)) {
      console.log(`MEM already running: http://127.0.0.1:${port}`);
      process.exit(0);
    }
    throw Error(
      `Port ${port} belongs to another checkout; no process was stopped.`,
    );
  }
  mkdirSync(dir, { recursive: true });
  const fd = openSync(resolve(dir, "server.log"), "a");
  const child = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: root, detached: true, stdio: ["ignore", fd, fd] },
  );
  child.unref();
  writeFileSync(pidFile, String(child.pid));
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 150));
    try {
      const res = await fetch(`http://127.0.0.1:${port}`);
      if (res.ok) {
        console.log(`MEM ready: http://127.0.0.1:${port}`);
        process.exit(0);
      }
    } catch {}
  }
  throw Error("Preview did not start; inspect .local/server.log");
} else throw Error("Use start or stop");

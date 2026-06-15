import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

run("scripts/seed-venues.js");
run("scripts/sync-worldcup.js");

function run(script) {
  const result = spawnSync(process.execPath, [path.join(rootDir, script)], {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
